/**
 * SL18 Render Stack - Log Manager
 * Phase 8: Scaling & Deployment
 * 
 * Centralized logging for operator review and debugging.
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import type { LogEntry, LogQuery, LogQueryResult, LogLevel, LogSource } from './system.types.js';

// ============================================================================
// Constants
// ============================================================================

const MAX_LOG_ENTRIES = 10000;
const LOG_FILE_NAME = 'system.jsonl';

// ============================================================================
// Log State
// ============================================================================

let logDirectory = './logs';
let logBuffer: LogEntry[] = [];

export function setLogDirectory(dir: string): void {
  logDirectory = dir;
}

// ============================================================================
// Logging Functions
// ============================================================================

export function log(
  level: LogLevel,
  source: LogSource,
  message: string,
  metadata?: Record<string, unknown>
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    metadata
  };
  
  logBuffer.push(entry);
  
  // Trim buffer if too large
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer = logBuffer.slice(-MAX_LOG_ENTRIES);
  }
  
  // Also write to file asynchronously
  appendLogToFile(entry).catch(err => {
    console.error('[log-manager] Failed to write log to file:', err);
  });
  
  return entry;
}

export function debug(source: LogSource, message: string, metadata?: Record<string, unknown>): LogEntry {
  return log('debug', source, message, metadata);
}

export function info(source: LogSource, message: string, metadata?: Record<string, unknown>): LogEntry {
  return log('info', source, message, metadata);
}

export function warn(source: LogSource, message: string, metadata?: Record<string, unknown>): LogEntry {
  return log('warn', source, message, metadata);
}

export function error(source: LogSource, message: string, metadata?: Record<string, unknown>): LogEntry {
  return log('error', source, message, metadata);
}

export function fatal(source: LogSource, message: string, metadata?: Record<string, unknown>): LogEntry {
  return log('fatal', source, message, metadata);
}

// ============================================================================
// Log with Context
// ============================================================================

export function logWithContext(
  level: LogLevel,
  source: LogSource,
  message: string,
  context: { nodeId?: string; jobId?: string; episodeId?: string },
  metadata?: Record<string, unknown>
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    nodeId: context.nodeId,
    jobId: context.jobId,
    episodeId: context.episodeId,
    metadata
  };
  
  logBuffer.push(entry);
  
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer = logBuffer.slice(-MAX_LOG_ENTRIES);
  }
  
  appendLogToFile(entry).catch(err => {
    console.error('[log-manager] Failed to write log to file:', err);
  });
  
  return entry;
}

// ============================================================================
// Log Queries
// ============================================================================

export function queryLogs(query: LogQuery): LogQueryResult {
  let entries = [...logBuffer];
  
  // Apply filters
  if (query.level) {
    entries = entries.filter(e => e.level === query.level);
  }
  
  if (query.source) {
    entries = entries.filter(e => e.source === query.source);
  }
  
  if (query.nodeId) {
    entries = entries.filter(e => e.nodeId === query.nodeId);
  }
  
  if (query.jobId) {
    entries = entries.filter(e => e.jobId === query.jobId);
  }
  
  if (query.startTime) {
    entries = entries.filter(e => e.timestamp >= query.startTime!);
  }
  
  if (query.endTime) {
    entries = entries.filter(e => e.timestamp <= query.endTime!);
  }
  
  // Sort by timestamp descending (newest first)
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  
  const total = entries.length;
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 100;
  
  entries = entries.slice(offset, offset + limit);
  
  return {
    entries,
    total,
    hasMore: offset + entries.length < total,
    query
  };
}

export function getRecentLogs(limit = 100): LogEntry[] {
  return logBuffer.slice(-limit).reverse();
}

export function getLogsByLevel(level: LogLevel, limit = 100): LogEntry[] {
  return logBuffer
    .filter(e => e.level === level)
    .slice(-limit)
    .reverse();
}

export function getErrorLogs(limit = 100): LogEntry[] {
  return logBuffer
    .filter(e => e.level === 'error' || e.level === 'fatal')
    .slice(-limit)
    .reverse();
}

// ============================================================================
// File Operations
// ============================================================================

async function appendLogToFile(entry: LogEntry): Promise<void> {
  try {
    await fs.mkdir(logDirectory, { recursive: true });
    const logPath = path.join(logDirectory, LOG_FILE_NAME);
    await fs.appendFile(logPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    // Silently fail file writes in case of permission issues
  }
}

export async function readLogsFromFile(query?: LogQuery): Promise<LogEntry[]> {
  const logPath = path.join(logDirectory, LOG_FILE_NAME);
  
  if (!existsSync(logPath)) {
    return [];
  }
  
  try {
    const content = await fs.readFile(logPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    let entries: LogEntry[] = [];
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as LogEntry;
        entries.push(entry);
      } catch {
        // Skip malformed lines
      }
    }
    
    // Apply query filters if provided
    if (query) {
      if (query.level) {
        entries = entries.filter(e => e.level === query.level);
      }
      if (query.source) {
        entries = entries.filter(e => e.source === query.source);
      }
      if (query.startTime) {
        entries = entries.filter(e => e.timestamp >= query.startTime!);
      }
      if (query.endTime) {
        entries = entries.filter(e => e.timestamp <= query.endTime!);
      }
    }
    
    // Sort and limit
    entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const limit = query?.limit ?? 1000;
    const offset = query?.offset ?? 0;
    
    return entries.slice(offset, offset + limit);
  } catch (err) {
    return [];
  }
}

export async function clearLogs(): Promise<void> {
  logBuffer = [];
  
  const logPath = path.join(logDirectory, LOG_FILE_NAME);
  if (existsSync(logPath)) {
    await fs.unlink(logPath);
  }
}

// ============================================================================
// Log Summary
// ============================================================================

export function getLogSummary(): {
  total: number;
  byLevel: Record<LogLevel, number>;
  bySource: Record<LogSource, number>;
  recentErrors: number;
} {
  const byLevel: Record<LogLevel, number> = {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    fatal: 0
  };
  
  const bySource: Record<LogSource, number> = {
    render: 0,
    publish: 0,
    qc: 0,
    storage: 0,
    system: 0,
    api: 0
  };
  
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  let recentErrors = 0;
  
  for (const entry of logBuffer) {
    byLevel[entry.level]++;
    bySource[entry.source]++;
    
    if ((entry.level === 'error' || entry.level === 'fatal') && entry.timestamp >= oneHourAgo) {
      recentErrors++;
    }
  }
  
  return {
    total: logBuffer.length,
    byLevel,
    bySource,
    recentErrors
  };
}

// ============================================================================
// Export
// ============================================================================

export * from './system.types.js';

/**
 * Control Panel API Routes
 * REST endpoints for operator dashboard and Airtable sync.
 * 
 * GET /api/control-panel/queue - Queue stats for UI
 * GET /api/control-panel/qc/:episodeId - QC details for dashboard
 * POST /api/control-panel/airtable-sync - Trigger Airtable sync
 * GET /api/control-panel/airtable-sync/status - Sync configuration status
 * GET /api/control-panel/airtable-sync/history - Sync history
 * GET /api/control-panel/render-dashboard - Render status overview
 * GET /api/control-panel/persona-preview/:code - Persona style preview
 */

import { Router, type Request, type Response } from 'express';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');

// Paths
const timelinesDir = path.join(repoRoot, 'timelines');
const rendersDir = path.join(repoRoot, 'renders');
const personaStylesPath = path.join(repoRoot, 'render-stack', 'config', 'persona_styles.json');

export const controlPanelRouter = Router();

// Types
interface RenderJob {
  episodeId: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  renderUrl?: string;
}

interface QueueStats {
  queued: number;
  rendering: number;
  completed: number;
  failed: number;
  total: number;
  averageRenderTime?: number;
}

interface RenderDashboardData {
  queueStats: QueueStats;
  recentJobs: RenderJob[];
  byPersona: Record<string, number>;
  byRenderProfile: Record<string, number>;
  storageUsed: number;
  lastUpdated: string;
}

interface PersonaPreview {
  code: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  captionPosition: string;
  motionPreset: string;
  transitionPreset: string;
  defaultRenderProfile?: string;
  sampleOverlay?: string;
}

/**
 * GET /api/control-panel/queue
 * Queue stats for UI
 */
controlPanelRouter.get('/queue', (_req: Request, res: Response) => {
  try {
    const stats = getQueueStats();
    res.json({
      stats,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[control-panel] Error loading queue stats:', error);
    res.status(500).json({ error: 'Failed to load queue stats' });
  }
});

/**
 * GET /api/control-panel/qc/:episodeId
 * QC details for dashboard
 */
controlPanelRouter.get('/qc/:episodeId', (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;
    const timelinePath = path.join(timelinesDir, episodeId, 'timeline.json');

    if (!existsSync(timelinePath)) {
      res.status(404).json({ error: `Timeline not found for episode: ${episodeId}` });
      return;
    }

    const timeline = JSON.parse(readFileSync(timelinePath, 'utf8'));
    
    // Get persona style
    let personaStyle = null;
    if (timeline.personaCode && existsSync(personaStylesPath)) {
      const personas = JSON.parse(readFileSync(personaStylesPath, 'utf8'));
      personaStyle = personas[timeline.personaCode] || null;
    }

    // Get render status
    const renderPath = path.join(rendersDir, episodeId, 'render_status.json');
    let renderStatus = null;
    if (existsSync(renderPath)) {
      renderStatus = JSON.parse(readFileSync(renderPath, 'utf8'));
    }

    res.json({
      episodeId,
      qcFlags: timeline.qcFlags || { contentWarnings: [], needsHumanReview: false },
      personaCode: timeline.personaCode,
      personaStyle,
      renderProfile: timeline.renderProfile,
      duration: timeline.duration,
      renderStatus,
      createdAt: timeline.createdAt,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[control-panel] Error loading QC details:', error);
    res.status(500).json({ error: 'Failed to load QC details' });
  }
});

/**
 * POST /api/control-panel/airtable-sync
 * Trigger Airtable sync for episode(s)
 */
controlPanelRouter.post('/airtable-sync', async (req: Request, res: Response) => {
  try {
    const { episodeIds, syncType = 'all' } = req.body;

    // Lazy import to avoid circular dependencies
    const { getAirtableSyncManager } = await import('../../../../render-stack/integration/airtable-sync.js');
    const manager = getAirtableSyncManager();

    if (!manager.isConfigured()) {
      res.status(503).json({ 
        error: 'Airtable not configured',
        hint: 'Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables'
      });
      return;
    }

    const ids = Array.isArray(episodeIds) ? episodeIds : [episodeIds];
    const results = [];

    for (const episodeId of ids) {
      // Get timeline data
      const timelinePath = path.join(timelinesDir, episodeId, 'timeline.json');
      if (!existsSync(timelinePath)) {
        results.push({ episodeId, success: false, error: 'Timeline not found' });
        continue;
      }

      const timeline = JSON.parse(readFileSync(timelinePath, 'utf8'));
      const airtableRecordId = timeline.airtableRecordId;

      if (!airtableRecordId) {
        // Try to find record by episode ID
        const foundId = await manager.findRecordByEpisodeId(episodeId);
        if (!foundId) {
          results.push({ episodeId, success: false, error: 'No Airtable record ID found' });
          continue;
        }
        timeline.airtableRecordId = foundId;
      }

      // Get render status
      const renderPath = path.join(rendersDir, episodeId, 'render_status.json');
      let renderStatus = 'pending';
      let renderUrl = undefined;
      if (existsSync(renderPath)) {
        const render = JSON.parse(readFileSync(renderPath, 'utf8'));
        renderStatus = render.status || 'pending';
        renderUrl = render.outputUrl;
      }

      // Build sync record
      const syncRecord = {
        episodeId,
        airtableRecordId: timeline.airtableRecordId,
        renderStatus: renderStatus as any,
        renderUrl,
        qcFlags: syncType === 'qc' || syncType === 'all' ? {
          needsHumanReview: timeline.qcFlags?.needsHumanReview || false,
          contentWarnings: timeline.qcFlags?.contentWarnings || [],
          reviewedAt: timeline.qcFlags?.reviewedAt,
          reviewedBy: timeline.qcFlags?.reviewedBy
        } : undefined
      };

      const result = await manager.syncRecord(syncRecord);
      results.push(result);
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      total: results.length,
      succeeded,
      failed,
      results,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[control-panel] Airtable sync error:', error);
    res.status(500).json({ error: 'Failed to sync with Airtable' });
  }
});

/**
 * GET /api/control-panel/airtable-sync/status
 * Sync configuration status
 */
controlPanelRouter.get('/airtable-sync/status', async (_req: Request, res: Response) => {
  try {
    const { getAirtableSyncManager } = await import('../../../../render-stack/integration/airtable-sync.js');
    const manager = getAirtableSyncManager();
    const status = manager.getConfigStatus();

    res.json({
      ...status,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[control-panel] Error loading sync status:', error);
    res.status(500).json({ error: 'Failed to load sync status' });
  }
});

/**
 * GET /api/control-panel/airtable-sync/history
 * Sync history
 */
controlPanelRouter.get('/airtable-sync/history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const { getAirtableSyncManager } = await import('../../../../render-stack/integration/airtable-sync.js');
    const manager = getAirtableSyncManager();
    const history = manager.readSyncHistory(limit);

    res.json({
      history,
      count: history.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[control-panel] Error loading sync history:', error);
    res.status(500).json({ error: 'Failed to load sync history' });
  }
});

/**
 * GET /api/control-panel/render-dashboard
 * Render status overview
 */
controlPanelRouter.get('/render-dashboard', (_req: Request, res: Response) => {
  try {
    const dashboard = getRenderDashboardData();
    res.json(dashboard);
  } catch (error) {
    console.error('[control-panel] Error loading render dashboard:', error);
    res.status(500).json({ error: 'Failed to load render dashboard' });
  }
});

/**
 * GET /api/control-panel/persona-preview/:code
 * Persona style preview
 */
controlPanelRouter.get('/persona-preview/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    if (!existsSync(personaStylesPath)) {
      res.status(404).json({ error: 'Persona styles not found' });
      return;
    }

    const personas = JSON.parse(readFileSync(personaStylesPath, 'utf8'));
    const style = personas[code.toUpperCase()];

    if (!style) {
      res.status(404).json({ error: `Persona not found: ${code}` });
      return;
    }

    // Generate sample overlay HTML for preview
    const preview: PersonaPreview = {
      code: code.toUpperCase(),
      ...style,
      sampleOverlay: generateSampleOverlay(style)
    };

    res.json({
      preview,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[control-panel] Error loading persona preview:', error);
    res.status(500).json({ error: 'Failed to load persona preview' });
  }
});

/**
 * Get queue statistics from render status files
 */
function getQueueStats(): QueueStats {
  const stats: QueueStats = {
    queued: 0,
    rendering: 0,
    completed: 0,
    failed: 0,
    total: 0
  };

  if (!existsSync(rendersDir)) {
    return stats;
  }

  const renderTimes: number[] = [];
  const dirs = readdirSync(rendersDir);

  for (const dir of dirs) {
    const statusPath = path.join(rendersDir, dir, 'render_status.json');
    if (!existsSync(statusPath)) continue;

    try {
      const status = JSON.parse(readFileSync(statusPath, 'utf8'));
      stats.total++;

      switch (status.status) {
        case 'queued':
          stats.queued++;
          break;
        case 'rendering':
          stats.rendering++;
          break;
        case 'completed':
          stats.completed++;
          if (status.startedAt && status.completedAt) {
            const duration = new Date(status.completedAt).getTime() - new Date(status.startedAt).getTime();
            renderTimes.push(duration);
          }
          break;
        case 'failed':
          stats.failed++;
          break;
      }
    } catch {
      // Skip invalid status files
    }
  }

  if (renderTimes.length > 0) {
    stats.averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
  }

  return stats;
}

/**
 * Get render dashboard data
 */
function getRenderDashboardData(): RenderDashboardData {
  const queueStats = getQueueStats();
  const recentJobs: RenderJob[] = [];
  const byPersona: Record<string, number> = {};
  const byRenderProfile: Record<string, number> = {};
  let storageUsed = 0;

  if (existsSync(rendersDir)) {
    const dirs = readdirSync(rendersDir);

    for (const dir of dirs) {
      const statusPath = path.join(rendersDir, dir, 'render_status.json');
      if (!existsSync(statusPath)) continue;

      try {
        const status = JSON.parse(readFileSync(statusPath, 'utf8'));
        
        recentJobs.push({
          episodeId: dir,
          status: status.status,
          progress: status.progress,
          startedAt: status.startedAt,
          completedAt: status.completedAt,
          error: status.error,
          renderUrl: status.outputUrl
        });

        // Get persona and profile from timeline
        const timelinePath = path.join(timelinesDir, dir, 'timeline.json');
        if (existsSync(timelinePath)) {
          const timeline = JSON.parse(readFileSync(timelinePath, 'utf8'));
          const persona = timeline.personaCode || 'UNKNOWN';
          const profile = timeline.renderProfile || 'unknown';
          
          byPersona[persona] = (byPersona[persona] || 0) + 1;
          byRenderProfile[profile] = (byRenderProfile[profile] || 0) + 1;
        }

        // Estimate storage from output file
        const outputPath = path.join(rendersDir, dir, 'master.mp4');
        if (existsSync(outputPath)) {
          const fs = require('fs');
          const stat = fs.statSync(outputPath);
          storageUsed += stat.size;
        }
      } catch {
        // Skip invalid files
      }
    }
  }

  // Sort by most recent first
  recentJobs.sort((a, b) => {
    const dateA = new Date(a.completedAt || a.startedAt || 0);
    const dateB = new Date(b.completedAt || b.startedAt || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return {
    queueStats,
    recentJobs: recentJobs.slice(0, 20),
    byPersona,
    byRenderProfile,
    storageUsed,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Generate sample overlay HTML for persona preview
 */
function generateSampleOverlay(style: any): string {
  const position = style.captionPosition || 'bottom';
  const positionStyle = position === 'top' 
    ? 'top: 10%;' 
    : position === 'middle' 
      ? 'top: 50%; transform: translateY(-50%);' 
      : 'bottom: 10%;';

  return `
    <div style="
      position: relative;
      width: 270px;
      height: 480px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 8px;
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        ${positionStyle}
        width: 90%;
        text-align: center;
      ">
        <div style="
          background: ${style.primaryColor || '#FFD700'}40;
          padding: 8px 16px;
          border-radius: 4px;
          backdrop-filter: blur(8px);
        ">
          <span style="
            color: ${style.primaryColor || '#FFD700'};
            font-family: ${style.fontFamily || 'Arial'}, sans-serif;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          ">
            Sample caption text
          </span>
        </div>
      </div>
      <div style="
        position: absolute;
        bottom: 4px;
        right: 8px;
        font-size: 10px;
        color: ${style.secondaryColor || '#FFFFFF'}80;
      ">
        Motion: ${style.motionPreset || 'fade'} | Trans: ${style.transitionPreset || 'cut'}
      </div>
    </div>
  `.trim();
}

export default controlPanelRouter;

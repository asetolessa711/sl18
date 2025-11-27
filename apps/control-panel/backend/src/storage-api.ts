/**
 * Storage API Routes
 * REST endpoints for storage management and file serving.
 * 
 * GET /api/storage/status - Get storage adapter status
 * GET /api/storage/render/:episodeId - Get render URL for episode
 * DELETE /api/storage/render/:episodeId - Delete render for episode
 */

import { Router, type Request, type Response } from 'express';
import { existsSync, createReadStream, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import storage manager
let storageManager: any;
let localStorageAdapter: any;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');

// Lazy load storage modules
async function loadStorageModules() {
  if (!storageManager) {
    try {
      const managerModule = await import('../../../../render-stack/storage/storage-manager.js');
      storageManager = managerModule.storageManager;
    } catch (e) {
      console.warn('[storage-api] Failed to load storage manager:', e);
    }
  }
  if (!localStorageAdapter) {
    try {
      const localModule = await import('../../../../render-stack/storage/local-storage.js');
      localStorageAdapter = localModule.localStorageAdapter;
    } catch (e) {
      console.warn('[storage-api] Failed to load local storage adapter:', e);
    }
  }
}

export const storageRouter = Router();

/**
 * GET /api/storage/status
 * Get status of storage adapters
 */
storageRouter.get('/status', async (_req: Request, res: Response) => {
  await loadStorageModules();
  
  if (!storageManager) {
    res.status(503).json({ error: 'Storage manager not available' });
    return;
  }

  try {
    const status = storageManager.getStatus();
    const providers = storageManager.getAvailableProviders();

    res.json({
      providers,
      status,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[storage-api] Status error:', error);
    res.status(500).json({ error: 'Failed to get storage status' });
  }
});

/**
 * GET /api/storage/render/:episodeId
 * Get render URL and info for an episode
 */
storageRouter.get('/render/:episodeId', async (req: Request, res: Response) => {
  await loadStorageModules();
  
  if (!storageManager) {
    res.status(503).json({ error: 'Storage manager not available' });
    return;
  }

  const { episodeId } = req.params;
  const { provider } = req.query;

  if (!episodeId) {
    res.status(400).json({ error: 'episodeId is required' });
    return;
  }

  try {
    const exists = await storageManager.renderExists(episodeId, provider as string | undefined);
    
    if (!exists) {
      res.status(404).json({ 
        error: 'Render not found',
        episodeId,
        hint: 'Run render job first via POST /api/render'
      });
      return;
    }

    const url = await storageManager.getRenderUrl(episodeId, provider as string | undefined);

    res.json({
      episodeId,
      url,
      exists: true,
      provider: provider ?? 'local',
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[storage-api] Get render error:', error);
    res.status(500).json({ error: 'Failed to get render info' });
  }
});

/**
 * DELETE /api/storage/render/:episodeId
 * Delete a render from storage
 */
storageRouter.delete('/render/:episodeId', async (req: Request, res: Response) => {
  await loadStorageModules();
  
  if (!storageManager) {
    res.status(503).json({ error: 'Storage manager not available' });
    return;
  }

  const { episodeId } = req.params;
  const { provider } = req.query;

  if (!episodeId) {
    res.status(400).json({ error: 'episodeId is required' });
    return;
  }

  try {
    const deleted = await storageManager.deleteRender(episodeId, provider as string | undefined);

    if (!deleted) {
      res.status(404).json({ 
        error: 'Render not found or already deleted',
        episodeId
      });
      return;
    }

    res.json({
      success: true,
      episodeId,
      message: `Render deleted for episode ${episodeId}`
    });
  } catch (error) {
    console.error('[storage-api] Delete render error:', error);
    res.status(500).json({ error: 'Failed to delete render' });
  }
});

/**
 * Middleware to serve local storage files
 * Mount at /storage to serve files from storage/renders/
 */
export function createStorageFileMiddleware() {
  const storageDir = path.join(repoRoot, 'storage', 'renders');

  return async (req: Request, res: Response, next: () => void) => {
    // Remove leading slashes from path
    const sanitizedPath = req.path.replace(/^\/+/, '');
    const filePath = path.join(storageDir, sanitizedPath);

    // Security: prevent path traversal
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(storageDir))) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (!existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    try {
      const stats = statSync(filePath);
      if (!stats.isFile()) {
        res.status(404).json({ error: 'Not a file' });
        return;
      }

      // Set content type based on extension
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg'
      };

      res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Accept-Ranges', 'bytes');

      // Support range requests for video streaming
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunkSize = end - start + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
        res.setHeader('Content-Length', chunkSize);

        const stream = createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        const stream = createReadStream(filePath);
        stream.pipe(res);
      }
    } catch (error) {
      console.error('[storage-api] File serve error:', error);
      res.status(500).json({ error: 'Failed to serve file' });
    }
  };
}

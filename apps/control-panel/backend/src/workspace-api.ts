/**
 * Workspace REST API
 * Endpoints for managing creative workspaces.
 */

import { Router, Request, Response } from 'express';
import { 
  WorkspaceManager,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspacePreviewRequest,
  WorkspaceListFilter,
  ContentGenre,
  WorkspaceStatus
} from '../../../../render-stack/workspaces';

const router = Router();

/**
 * POST /api/workspace
 * Create a new workspace
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const request: CreateWorkspaceRequest = req.body;
    
    // Validate required fields
    if (!request.name || !request.description || !request.genre) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'description', 'genre']
      });
    }

    // Validate genre
    const validGenres: ContentGenre[] = [
      'drama', 'music', 'comedy', 'educational', 
      'documentary', 'news', 'lifestyle', 'gaming', 'custom'
    ];
    if (!validGenres.includes(request.genre)) {
      return res.status(400).json({
        error: 'Invalid genre',
        validGenres
      });
    }

    const createdBy = req.headers['x-user-id'] as string || 'system';
    const workspace = WorkspaceManager.create(request, createdBy);

    res.status(201).json({
      success: true,
      workspace
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create workspace',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/workspace
 * List workspaces with optional filters
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const filter: WorkspaceListFilter = {
      genre: req.query.genre as ContentGenre,
      status: req.query.status as WorkspaceStatus,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      search: req.query.search as string,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    };

    const result = WorkspaceManager.list(filter);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list workspaces',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/workspace/:id
 * Retrieve a workspace by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const workspace = WorkspaceManager.get(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({
        error: 'Workspace not found',
        workspaceId: req.params.id
      });
    }

    res.json({
      success: true,
      workspace
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve workspace',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/workspace/:id
 * Update a workspace
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const request: UpdateWorkspaceRequest = req.body;
    const workspace = WorkspaceManager.update(req.params.id, request);
    
    if (!workspace) {
      return res.status(404).json({
        error: 'Workspace not found',
        workspaceId: req.params.id
      });
    }

    res.json({
      success: true,
      workspace
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update workspace',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/workspace/:id
 * Delete a workspace
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = WorkspaceManager.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Workspace not found',
        workspaceId: req.params.id
      });
    }

    res.json({
      success: true,
      message: 'Workspace deleted',
      workspaceId: req.params.id
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete workspace',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/workspace/:id/preview
 * Preview styled timeline for a workspace
 */
router.get('/:id/preview', (req: Request, res: Response) => {
  try {
    const request: WorkspacePreviewRequest = {
      sampleText: req.query.sampleText as string,
      templateId: req.query.templateId as string,
      renderProfile: req.query.renderProfile as any,
      previewDuration: req.query.previewDuration 
        ? parseInt(req.query.previewDuration as string, 10) 
        : undefined
    };

    const preview = WorkspaceManager.preview(req.params.id, request);
    
    if (!preview) {
      return res.status(404).json({
        error: 'Workspace or template not found',
        workspaceId: req.params.id
      });
    }

    res.json({
      success: true,
      preview
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate preview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/workspace/:id/preview
 * Generate a preview with custom options
 */
router.post('/:id/preview', (req: Request, res: Response) => {
  try {
    const request: WorkspacePreviewRequest = req.body;
    const preview = WorkspaceManager.preview(req.params.id, request);
    
    if (!preview) {
      return res.status(404).json({
        error: 'Workspace or template not found',
        workspaceId: req.params.id
      });
    }

    res.json({
      success: true,
      preview
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate preview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/workspace/:id/template
 * Add a persona template to a workspace
 */
router.post('/:id/template', (req: Request, res: Response) => {
  try {
    const template = WorkspaceManager.addTemplate(req.params.id, req.body);
    
    if (!template) {
      return res.status(404).json({
        error: 'Workspace not found',
        workspaceId: req.params.id
      });
    }

    res.status(201).json({
      success: true,
      template
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/workspace/:id/template/:templateId
 * Remove a persona template from a workspace
 */
router.delete('/:id/template/:templateId', (req: Request, res: Response) => {
  try {
    const removed = WorkspaceManager.removeTemplate(req.params.id, req.params.templateId);
    
    if (!removed) {
      return res.status(400).json({
        error: 'Failed to remove template',
        message: 'Template not found or is the only template',
        workspaceId: req.params.id,
        templateId: req.params.templateId
      });
    }

    res.json({
      success: true,
      message: 'Template removed',
      templateId: req.params.templateId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to remove template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/workspace/:id/clone
 * Clone a workspace
 */
router.post('/:id/clone', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Missing required field',
        required: ['name']
      });
    }

    const createdBy = req.headers['x-user-id'] as string || 'system';
    const workspace = WorkspaceManager.clone(req.params.id, name, createdBy);
    
    if (!workspace) {
      return res.status(404).json({
        error: 'Workspace not found',
        workspaceId: req.params.id
      });
    }

    res.status(201).json({
      success: true,
      workspace
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clone workspace',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/workspace/:id/qc-check
 * Apply workspace QC rules to episode data
 */
router.post('/:id/qc-check', (req: Request, res: Response) => {
  try {
    const episodeData = req.body;
    
    if (!episodeData.duration || !episodeData.captions) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['duration', 'captions']
      });
    }

    const result = WorkspaceManager.applyQCRules(req.params.id, episodeData);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to apply QC rules',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/workspace/genres
 * List available genres with their default configurations
 */
router.get('/meta/genres', (_req: Request, res: Response) => {
  const genres = [
    { genre: 'drama', description: 'Dramatic content with pacing rules' },
    { genre: 'music', description: 'Music content with loudness normalization' },
    { genre: 'comedy', description: 'Comedy content with timing rules' },
    { genre: 'educational', description: 'Educational content with concept pacing' },
    { genre: 'documentary', description: 'Documentary content with scene pacing' },
    { genre: 'news', description: 'News content with information density rules' },
    { genre: 'lifestyle', description: 'Lifestyle content with casual pacing' },
    { genre: 'gaming', description: 'Gaming content with fast pacing' },
    { genre: 'custom', description: 'Custom genre with user-defined rules' }
  ];

  res.json({
    success: true,
    genres
  });
});

/**
 * GET /api/workspace/stats
 * Get workspace statistics
 */
router.get('/meta/stats', (_req: Request, res: Response) => {
  const allWorkspaces = WorkspaceManager.list({ limit: 1000 });
  
  const stats = {
    total: allWorkspaces.total,
    byGenre: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    totalTemplates: 0
  };

  for (const ws of allWorkspaces.workspaces) {
    stats.byGenre[ws.genre] = (stats.byGenre[ws.genre] || 0) + 1;
    stats.byStatus[ws.status] = (stats.byStatus[ws.status] || 0) + 1;
    stats.totalTemplates += ws.personaTemplates.length;
  }

  res.json({
    success: true,
    stats
  });
});

export { router as workspaceRouter };

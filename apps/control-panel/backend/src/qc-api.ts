/**
 * QC (Quality Control) API Routes
 * REST endpoints for persona styling and QC flag management.
 * 
 * GET /api/qc/personas - List all persona styles
 * GET /api/qc/personas/:code - Get persona style by code
 * GET /api/qc/episodes - List episodes with QC flags
 * GET /api/qc/episodes/:episodeId - Get QC info for episode
 * POST /api/qc/episodes/:episodeId/review - Mark episode as reviewed
 * GET /api/qc/stats - Get QC statistics
 */

import { Router, type Request, type Response } from 'express';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');

// Paths to configuration files
const personaStylesPath = path.join(repoRoot, 'render-stack', 'config', 'persona_styles.json');
const timelinesDir = path.join(repoRoot, 'timelines');

export const qcRouter = Router();

// Types
interface PersonaStyle {
  personaCode: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  captionPosition: string;
  motionPreset: string;
  transitionPreset: string;
  defaultRenderProfile?: string;
}

interface QCFlags {
  contentWarnings: string[];
  needsHumanReview: boolean;
  reviewReason?: string;
  captionLengthExceeded?: boolean;
  durationExceeded?: boolean;
  notes?: string[];
  reviewedAt?: string;
  reviewedBy?: string;
}

interface TimelineQCInfo {
  episodeId: string;
  personaCode: string;
  franchiseId?: string;
  renderProfile: string;
  duration: number;
  qcFlags: QCFlags;
  style: PersonaStyle;
  createdAt: string;
}

/** Timeline document structure for QC checks */
interface TimelineDocument {
  episodeId: string;
  personaCode?: string;
  franchiseId?: string;
  renderProfile?: string;
  duration?: number;
  tracks?: Array<{
    type: string;
    clips?: Array<{
      captions?: Array<{
        text?: string;
      }>;
    }>;
  }>;
  style?: {
    primaryColor?: string;
    fontFamily?: string;
  };
  qcFlags?: QCFlags;
  createdAt?: string;
}

// QC thresholds
const QC_THRESHOLDS = {
  maxCaptionLength: 150,       // characters per caption
  maxDuration: 180,            // 3 minutes for shorts
  maxDurationLong: 600,        // 10 minutes for long-form
  warningKeywords: ['explicit', 'violence', 'controversial', 'adult']
};

/**
 * GET /api/qc/personas
 * List all persona styles
 */
qcRouter.get('/personas', (_req: Request, res: Response) => {
  try {
    if (!existsSync(personaStylesPath)) {
      res.status(404).json({ error: 'Persona styles not found' });
      return;
    }

    const content = readFileSync(personaStylesPath, 'utf8');
    const personas: Record<string, PersonaStyle> = JSON.parse(content);

    const list = Object.entries(personas).map(([code, style]) => ({
      code,
      ...style
    }));

    res.json({
      personas: list,
      count: list.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[qc-api] Error loading personas:', error);
    res.status(500).json({ error: 'Failed to load persona styles' });
  }
});

/**
 * GET /api/qc/personas/:code
 * Get persona style by code
 */
qcRouter.get('/personas/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    if (!existsSync(personaStylesPath)) {
      res.status(404).json({ error: 'Persona styles not found' });
      return;
    }

    const content = readFileSync(personaStylesPath, 'utf8');
    const personas: Record<string, PersonaStyle> = JSON.parse(content);

    const persona = personas[code.toUpperCase()];
    if (!persona) {
      res.status(404).json({ error: `Persona not found: ${code}` });
      return;
    }

    res.json({
      persona,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[qc-api] Error loading persona:', error);
    res.status(500).json({ error: 'Failed to load persona style' });
  }
});

/**
 * GET /api/qc/episodes
 * List episodes with QC flags (from timeline files)
 */
qcRouter.get('/episodes', (req: Request, res: Response) => {
  try {
    const { needsReview, persona, limit = '50' } = req.query;

    if (!existsSync(timelinesDir)) {
      res.json({
        episodes: [],
        count: 0,
        fetchedAt: new Date().toISOString()
      });
      return;
    }

    // Scan timelines directory
    const episodes: TimelineQCInfo[] = [];
    const dirs = readdirSync(timelinesDir);

    for (const dir of dirs) {
      const timelinePath = path.join(timelinesDir, dir, 'timeline.json');
      if (!existsSync(timelinePath)) continue;

      try {
        const content = readFileSync(timelinePath, 'utf8');
        const timeline = JSON.parse(content);

        // Apply filters
        if (needsReview === 'true' && !timeline.qcFlags?.needsHumanReview) continue;
        if (persona && timeline.personaCode !== persona) continue;

        episodes.push({
          episodeId: timeline.episodeId,
          personaCode: timeline.personaCode,
          franchiseId: timeline.franchiseId,
          renderProfile: timeline.renderProfile,
          duration: timeline.duration,
          qcFlags: timeline.qcFlags || { contentWarnings: [], needsHumanReview: false },
          style: timeline.style,
          createdAt: timeline.createdAt
        });
      } catch (e) {
        console.warn(`[qc-api] Failed to parse timeline: ${timelinePath}`);
      }
    }

    // Sort by needsHumanReview first, then by createdAt
    episodes.sort((a, b) => {
      if (a.qcFlags.needsHumanReview !== b.qcFlags.needsHumanReview) {
        return a.qcFlags.needsHumanReview ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply limit
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 200);
    const limited = episodes.slice(0, limitNum);

    res.json({
      episodes: limited,
      count: limited.length,
      total: episodes.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[qc-api] Error loading episodes:', error);
    res.status(500).json({ error: 'Failed to load episodes' });
  }
});

/**
 * GET /api/qc/episodes/:episodeId
 * Get QC info for specific episode
 */
qcRouter.get('/episodes/:episodeId', (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;
    const timelinePath = path.join(timelinesDir, episodeId, 'timeline.json');

    if (!existsSync(timelinePath)) {
      res.status(404).json({ error: `Timeline not found for episode: ${episodeId}` });
      return;
    }

    const content = readFileSync(timelinePath, 'utf8');
    const timeline = JSON.parse(content);

    // Extract QC-relevant info
    const qcInfo: TimelineQCInfo = {
      episodeId: timeline.episodeId,
      personaCode: timeline.personaCode,
      franchiseId: timeline.franchiseId,
      renderProfile: timeline.renderProfile,
      duration: timeline.duration,
      qcFlags: timeline.qcFlags || { contentWarnings: [], needsHumanReview: false },
      style: timeline.style,
      createdAt: timeline.createdAt
    };

    // Run additional QC checks
    const additionalFlags = runQCChecks(timeline);

    res.json({
      episode: qcInfo,
      additionalFlags,
      thresholds: QC_THRESHOLDS,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[qc-api] Error loading episode:', error);
    res.status(500).json({ error: 'Failed to load episode QC info' });
  }
});

/**
 * POST /api/qc/episodes/:episodeId/review
 * Mark episode as reviewed
 */
qcRouter.post('/episodes/:episodeId/review', (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;
    const { reviewedBy, notes, approved } = req.body;

    const timelinePath = path.join(timelinesDir, episodeId, 'timeline.json');

    if (!existsSync(timelinePath)) {
      res.status(404).json({ error: `Timeline not found for episode: ${episodeId}` });
      return;
    }

    const content = readFileSync(timelinePath, 'utf8');
    const timeline = JSON.parse(content);

    // Update QC flags
    timeline.qcFlags = timeline.qcFlags || { contentWarnings: [], needsHumanReview: false };
    timeline.qcFlags.reviewedAt = new Date().toISOString();
    timeline.qcFlags.reviewedBy = reviewedBy || 'Operator';
    
    if (approved === true) {
      timeline.qcFlags.needsHumanReview = false;
    }

    if (notes) {
      timeline.qcFlags.notes = timeline.qcFlags.notes || [];
      timeline.qcFlags.notes.push(`[${timeline.qcFlags.reviewedAt}] ${notes}`);
    }

    // Save updated timeline
    writeFileSync(timelinePath, JSON.stringify(timeline, null, 2));

    console.log(`[qc-api] Episode ${episodeId} reviewed by ${timeline.qcFlags.reviewedBy}`);

    res.json({
      success: true,
      episodeId,
      qcFlags: timeline.qcFlags,
      message: approved ? 'Episode approved' : 'Episode reviewed'
    });
  } catch (error) {
    console.error('[qc-api] Error reviewing episode:', error);
    res.status(500).json({ error: 'Failed to review episode' });
  }
});

/**
 * GET /api/qc/stats
 * Get QC statistics
 */
qcRouter.get('/stats', (_req: Request, res: Response) => {
  try {
    if (!existsSync(timelinesDir)) {
      res.json({
        stats: {
          total: 0,
          needsReview: 0,
          reviewed: 0,
          byPersona: {},
          byRenderProfile: {}
        },
        fetchedAt: new Date().toISOString()
      });
      return;
    }

    const stats = {
      total: 0,
      needsReview: 0,
      reviewed: 0,
      captionLengthExceeded: 0,
      durationExceeded: 0,
      byPersona: {} as Record<string, number>,
      byRenderProfile: {} as Record<string, number>,
      recentReviews: [] as { episodeId: string; reviewedAt: string; reviewedBy?: string }[]
    };

    const dirs = readdirSync(timelinesDir);

    for (const dir of dirs) {
      const timelinePath = path.join(timelinesDir, dir, 'timeline.json');
      if (!existsSync(timelinePath)) continue;

      try {
        const content = readFileSync(timelinePath, 'utf8');
        const timeline = JSON.parse(content);

        stats.total++;

        if (timeline.qcFlags?.needsHumanReview) {
          stats.needsReview++;
        }

        if (timeline.qcFlags?.reviewedAt) {
          stats.reviewed++;
          stats.recentReviews.push({
            episodeId: timeline.episodeId,
            reviewedAt: timeline.qcFlags.reviewedAt,
            reviewedBy: timeline.qcFlags.reviewedBy
          });
        }

        if (timeline.qcFlags?.captionLengthExceeded) {
          stats.captionLengthExceeded++;
        }

        if (timeline.qcFlags?.durationExceeded) {
          stats.durationExceeded++;
        }

        // Count by persona
        const persona = timeline.personaCode || 'UNKNOWN';
        stats.byPersona[persona] = (stats.byPersona[persona] || 0) + 1;

        // Count by render profile
        const profile = timeline.renderProfile || 'unknown';
        stats.byRenderProfile[profile] = (stats.byRenderProfile[profile] || 0) + 1;
      } catch (e) {
        console.warn(`[qc-api] Failed to parse timeline: ${timelinePath}`);
      }
    }

    // Sort recent reviews by date
    stats.recentReviews.sort((a, b) => 
      new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
    );
    stats.recentReviews = stats.recentReviews.slice(0, 10);

    res.json({
      stats,
      thresholds: QC_THRESHOLDS,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[qc-api] Error loading stats:', error);
    res.status(500).json({ error: 'Failed to load QC stats' });
  }
});

/**
 * Run QC checks on a timeline
 */
function runQCChecks(timeline: TimelineDocument): { issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check duration
  if (timeline.duration && timeline.duration > QC_THRESHOLDS.maxDurationLong) {
    issues.push(`Duration (${timeline.duration}s) exceeds maximum (${QC_THRESHOLDS.maxDurationLong}s)`);
  } else if (timeline.duration && timeline.duration > QC_THRESHOLDS.maxDuration) {
    warnings.push(`Duration (${timeline.duration}s) exceeds short-form limit (${QC_THRESHOLDS.maxDuration}s)`);
  }

  // Check captions
  if (timeline.tracks) {
    for (const track of timeline.tracks) {
      if (track.type === 'caption') {
        for (const clip of track.clips || []) {
          for (const caption of clip.captions || []) {
            if (caption.text && caption.text.length > QC_THRESHOLDS.maxCaptionLength) {
              warnings.push(`Caption exceeds ${QC_THRESHOLDS.maxCaptionLength} chars: "${caption.text.substring(0, 50)}..."`);
            }

            // Check for warning keywords
            const lowerText = (caption.text || '').toLowerCase();
            for (const keyword of QC_THRESHOLDS.warningKeywords) {
              if (lowerText.includes(keyword)) {
                warnings.push(`Caption contains flagged keyword: "${keyword}"`);
              }
            }
          }
        }
      }
    }
  }

  // Check styling
  if (!timeline.style?.primaryColor) {
    warnings.push('Missing primary color in style');
  }

  if (!timeline.style?.fontFamily) {
    warnings.push('Missing font family in style');
  }

  return { issues, warnings };
}

import { detectGeographicHotspots, CATEGORY_HAZARD_WEIGHTS, SEVERITY_WEIGHTS } from '../services/hotspotService.js';
import { generateHotspotRecommendation } from '../services/gemini.service.js';

// In-memory cache for hotspots calculations (60s TTL)
const hotspotsCache = new Map();
const HOTSPOTS_CACHE_TTL = 60 * 1000;

// Register hotspot cache clear in global invalidation
const originalClear = global.clearAnalyticsCache;
global.clearAnalyticsCache = () => {
  if (originalClear) originalClear();
  hotspotsCache.clear();
};

/**
 * GET /api/admin/hotspots
 * 
 * Geographic hotspot detection endpoint for municipal admins.
 * Groups complaints geographically, evaluates concentration, severity, category,
 * and calculates a deterministic 0-100 priority score.
 * 
 * Individual complaints are NEVER treated as hotspots.
 * 
 * Query Params:
 * - radius: Cluster distance threshold in meters (default: 500)
 * - minComplaints: Minimum complaints required to form a hotspot (default: 2)
 * - category: Filter by specific category or 'ALL'
 * - status: Filter by status ('ALL', 'UNRESOLVED', or specific status)
 */
export const getAdminHotspots = async (req, res) => {
  try {
    const { radius, minComplaints, category, status, refresh } = req.query;
    const isTest = process.env.NODE_ENV === 'test';
    const cacheKey = `hotspots:${radius || 500}:${minComplaints || 2}:${category || 'ALL'}:${status || 'ALL'}`;

    if (!isTest && refresh !== 'true' && hotspotsCache.has(cacheKey)) {
      const cached = hotspotsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < HOTSPOTS_CACHE_TTL) {
        return res.status(200).json(cached.data);
      }
      hotspotsCache.delete(cacheKey);
    }

    const hotspots = await detectGeographicHotspots({
      radius: radius ? parseInt(radius, 10) : 500,
      minComplaints: minComplaints ? parseInt(minComplaints, 10) : 2,
      category: category || 'ALL',
      status: status || 'ALL'
    });

    const responsePayload = {
      success: true,
      count: hotspots.length,
      data: {
        hotspots,
        formulaDocumentation: {
          description: 'Deterministic 0-100 Civic Hazard Priority Formula',
          weights: {
            volumeFactorMax: 35,
            severityFactorMax: 35,
            categoryHazardFactorMax: 15,
            spatialConcentrationFactorMax: 15
          },
          categoryWeights: CATEGORY_HAZARD_WEIGHTS,
          severityWeights: SEVERITY_WEIGHTS,
          explanation: 'Score = (min(1, count/10) * 35) + ((weightedSev / (4*count)) * 35) + (categoryHazardWeight * 15) + ((1 - (spreadRadius - 50)/(maxRadius - 50)) * 15)'
        }
      }
    };

    hotspotsCache.set(cacheKey, {
      data: responsePayload,
      timestamp: Date.now()
    });

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Failed to detect geographic hotspots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect geographic hotspots',
      error: error.message
    });
  }
};

/**
 * POST /api/admin/hotspots/:id/recommendation
 * POST /api/admin/hotspots/recommendation
 * GET /api/admin/hotspots/:id/recommendation
 * 
 * Generate AI-powered infrastructure recommendations for significant hotspots using Google Gemini.
 * Sends:
 * - hotspot statistics
 * - categories
 * - severity distribution
 * - sample complaint summaries (sanitized, zero personal information)
 * - available geographic information
 * 
 * Returns:
 * {
 *   recommendedIntervention,
 *   reason,
 *   expectedBenefit,
 *   urgency
 * }
 */
export const getHotspotRecommendation = async (req, res) => {
  try {
    let hotspot = req.body?.hotspot;
    const hotspotId = req.params?.id || req.body?.hotspotId || (hotspot && hotspot.id);

    // If hotspot object not provided in body, find by hotspotId
    if (!hotspot && hotspotId) {
      const hotspots = await detectGeographicHotspots();
      hotspot = hotspots.find(h => String(h.id) === String(hotspotId));
    }

    if (!hotspot) {
      return res.status(400).json({
        success: false,
        message: 'Hotspot data or valid hotspot ID is required to generate AI recommendation.'
      });
    }

    const recommendation = await generateHotspotRecommendation({
      hotspot,
      skipCache: req.query?.refresh === 'true' || req.body?.refresh === true
    });

    return res.status(200).json({
      success: true,
      data: {
        hotspotId: hotspot.id,
        recommendation: {
          recommendedIntervention: recommendation.recommendedIntervention,
          reason: recommendation.reason,
          expectedBenefit: recommendation.expectedBenefit,
          urgency: recommendation.urgency
        },
        attribution: 'Based on available CivicAI complaint data',
        disclaimer: 'Recommendations are decision-support suggestions based on available CivicAI complaint data and require authority verification.'
      }
    });
  } catch (error) {
    console.error('Failed to generate hotspot recommendation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate hotspot infrastructure recommendation',
      error: error.message
    });
  }
};

export default {
  getAdminHotspots,
  getHotspotRecommendation
};

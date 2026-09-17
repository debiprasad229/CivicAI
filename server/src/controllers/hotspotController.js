import { detectGeographicHotspots, CATEGORY_HAZARD_WEIGHTS, SEVERITY_WEIGHTS } from '../services/hotspotService.js';

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
    const { radius, minComplaints, category, status } = req.query;

    const hotspots = await detectGeographicHotspots({
      radius: radius ? parseInt(radius, 10) : 500,
      minComplaints: minComplaints ? parseInt(minComplaints, 10) : 2,
      category: category || 'ALL',
      status: status || 'ALL'
    });

    res.status(200).json({
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
    });
  } catch (error) {
    console.error('Failed to detect geographic hotspots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect geographic hotspots',
      error: error.message
    });
  }
};

export default {
  getAdminHotspots
};

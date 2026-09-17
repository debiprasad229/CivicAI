import Complaint from '../models/Complaint.js';

// Earth radius in meters for Haversine distance calculation
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculate Great Circle distance between two [longitude, latitude] coordinates in meters
 */
export function calculateDistanceMeters(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Category hazard weights (0.0 to 1.0)
 * Reflects inherent infrastructural danger and public disruption
 */
export const CATEGORY_HAZARD_WEIGHTS = {
  DRAINAGE: 0.95,        // Flooding, sewage contamination, communicable disease risk
  WATER: 0.90,           // Potable water contamination, mainline bursting
  ELECTRICITY: 0.90,     // Electrocution hazard, high-voltage arcing
  ROAD: 0.85,            // Major craters, subsidence, vehicular accidents
  WASTE: 0.75,           // Biohazard, toxic leaching, open dumping
  STREET_LIGHT: 0.65,    // Commuter safety, crime vulnerability in dark stretches
  PUBLIC_TRANSPORT: 0.60,// Transit stoppage, bus shelter damage
  OTHER: 0.50            // General civic amenity issues
};

/**
 * Severity weight multipliers
 */
export const SEVERITY_WEIGHTS = {
  CRITICAL: 4.0,
  HIGH: 3.0,
  MEDIUM: 1.5,
  LOW: 0.5
};

/**
 * Calculate deterministic priority score (0 - 100)
 * 
 * Formula:
 * P = S_count (max 35) + S_severity (max 35) + S_category (max 15) + S_concentration (max 15)
 * 
 * @param {Object} params
 * @param {number} params.complaintCount - Total complaints in hotspot
 * @param {Object} params.severityBreakdown - Count of complaints by severity
 * @param {string} params.dominantCategory - Most frequent category in hotspot
 * @param {number} params.spreadRadiusMeters - Maximum distance from centroid to complaints in hotspot
 * @param {number} params.clusterRadiusThreshold - Configured clustering radius threshold (default: 500m)
 * @returns {number} Normalized priority score between 0 and 100
 */
export function calculatePriorityScore({
  complaintCount,
  severityBreakdown,
  dominantCategory,
  spreadRadiusMeters,
  clusterRadiusThreshold = 500
}) {
  if (complaintCount <= 0) return 0;

  // 1. Complaint Volume Factor (max 35 points)
  // Linear scaling with saturation at 10 complaints
  const countFactor = Math.min(1.0, complaintCount / 10);
  const countScore = countFactor * 35;

  // 2. Severity Factor (max 35 points)
  // Normalized weighted sum divided by maximum potential severity points (4.0 * complaintCount)
  const critical = severityBreakdown.CRITICAL || 0;
  const high = severityBreakdown.HIGH || 0;
  const medium = severityBreakdown.MEDIUM || 0;
  const low = severityBreakdown.LOW || 0;

  const totalSeverityPoints =
    critical * SEVERITY_WEIGHTS.CRITICAL +
    high * SEVERITY_WEIGHTS.HIGH +
    medium * SEVERITY_WEIGHTS.MEDIUM +
    low * SEVERITY_WEIGHTS.LOW;

  const maxSeverityPoints = complaintCount * SEVERITY_WEIGHTS.CRITICAL;
  const severityRatio = maxSeverityPoints > 0 ? totalSeverityPoints / maxSeverityPoints : 0;
  const severityScore = severityRatio * 35;

  // 3. Category Hazard Factor (max 15 points)
  const categoryWeight = CATEGORY_HAZARD_WEIGHTS[dominantCategory] || 0.60;
  const categoryScore = categoryWeight * 15;

  // 4. Spatial Concentration Factor (max 15 points)
  // Smaller spread radius indicates acute concentrated failure
  const minSpread = 50; // meters
  const maxSpread = Math.max(clusterRadiusThreshold, 100);
  const clampedRadius = Math.max(minSpread, Math.min(maxSpread, spreadRadiusMeters));
  const concentrationRatio = 1.0 - (clampedRadius - minSpread) / (maxSpread - minSpread);
  const concentrationScore = Math.max(0, Math.min(1.0, concentrationRatio)) * 15;

  const totalRaw = countScore + severityScore + categoryScore + concentrationScore;
  return Math.min(100, Math.max(0, Math.round(totalRaw)));
}

/**
 * Detect geographic hotspots from complaints in MongoDB
 * 
 * @param {Object} options
 * @param {number} [options.radius=500] - Clustering search radius in meters
 * @param {number} [options.minComplaints=2] - Minimum complaints to qualify as hotspot (DO NOT treat individual complaints as hotspots)
 * @param {string} [options.status] - Optional filter for status (e.g. 'UNRESOLVED' or specific status)
 * @param {string} [options.category] - Optional filter for category
 * @returns {Promise<Array>} Array of hotspot objects
 */
export async function detectGeographicHotspots({
  radius = 500,
  minComplaints = 2,
  status = 'ALL',
  category = 'ALL'
} = {}) {
  // Ensure minComplaints is at least 2 to strictly prevent individual complaints being hotspots
  const effectiveMinComplaints = Math.max(2, parseInt(minComplaints, 10) || 2);
  const clusterRadius = Math.max(50, parseInt(radius, 10) || 500);

  // Build query filter
  const query = {
    'location.coordinates': { $exists: true, $size: 2 },
    status: { $ne: 'REJECTED' }
  };

  if (category && category !== 'ALL') {
    query.category = category;
  }

  if (status && status !== 'ALL') {
    if (status === 'UNRESOLVED') {
      query.status = { $ne: 'RESOLVED' };
    } else {
      query.status = status;
    }
  }

  // Retrieve complaints with coordinates
  const complaints = await Complaint.find(query)
    .select('_id title description category severity status address location createdAt')
    .lean();

  if (complaints.length < effectiveMinComplaints) {
    return [];
  }

  // Filter valid coordinates [lon, lat]
  const validComplaints = complaints.filter(
    (c) =>
      Array.isArray(c.location?.coordinates) &&
      c.location.coordinates.length === 2 &&
      !isNaN(c.location.coordinates[0]) &&
      !isNaN(c.location.coordinates[1])
  );

  if (validComplaints.length < effectiveMinComplaints) {
    return [];
  }

  // Density-Based Clustering (DBSCAN / Radius clustering)
  const visited = new Set();
  const clusters = [];

  for (let i = 0; i < validComplaints.length; i++) {
    const seed = validComplaints[i];
    const seedId = String(seed._id);

    if (visited.has(seedId)) continue;

    // Find all neighbors within clusterRadius
    const neighbors = [];
    for (let j = 0; j < validComplaints.length; j++) {
      const candidate = validComplaints[j];
      const dist = calculateDistanceMeters(seed.location.coordinates, candidate.location.coordinates);
      if (dist <= clusterRadius) {
        neighbors.push({ complaint: candidate, distance: dist });
      }
    }

    // A cluster must satisfy effectiveMinComplaints (>= 2). Individual complaints are rejected!
    if (neighbors.length >= effectiveMinComplaints) {
      const currentCluster = [];
      const clusterIds = new Set();

      for (const item of neighbors) {
        const idStr = String(item.complaint._id);
        if (!clusterIds.has(idStr)) {
          clusterIds.add(idStr);
          visited.add(idStr);
          currentCluster.push(item.complaint);
        }
      }

      // Expand cluster
      let k = 0;
      while (k < currentCluster.length) {
        const point = currentCluster[k];
        const secondaryNeighbors = [];
        for (let j = 0; j < validComplaints.length; j++) {
          const candidate = validComplaints[j];
          const dist = calculateDistanceMeters(point.location.coordinates, candidate.location.coordinates);
          if (dist <= clusterRadius) {
            secondaryNeighbors.push(candidate);
          }
        }

        if (secondaryNeighbors.length >= effectiveMinComplaints) {
          for (const cand of secondaryNeighbors) {
            const candId = String(cand._id);
            if (!clusterIds.has(candId)) {
              clusterIds.add(candId);
              visited.add(candId);
              currentCluster.push(cand);
            }
          }
        }
        k++;
      }

      clusters.push(currentCluster);
    }
  }

  // Transform each cluster into structured hotspot
  const hotspots = clusters.map((cluster, index) => {
    const count = cluster.length;

    // Centroid calculation [latitude, longitude]
    let sumLat = 0;
    let sumLon = 0;
    const categoryCounts = {};
    const severityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const statusCounts = {};
    const addresses = new Set();

    cluster.forEach((c) => {
      const [lon, lat] = c.location.coordinates;
      sumLon += lon;
      sumLat += lat;

      // Category counts
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;

      // Severity counts
      if (severityCounts.hasOwnProperty(c.severity)) {
        severityCounts[c.severity]++;
      } else {
        severityCounts[c.severity] = 1;
      }

      // Status counts
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

      if (c.address) {
        addresses.add(c.address.trim());
      }
    });

    const centroidLat = Number((sumLat / count).toFixed(6));
    const centroidLon = Number((sumLon / count).toFixed(6));
    const centroidCoords = [centroidLon, centroidLat];

    // Calculate spread radius (max distance to centroid)
    let maxDistToCentroid = 0;
    cluster.forEach((c) => {
      const dist = calculateDistanceMeters(centroidCoords, c.location.coordinates);
      if (dist > maxDistToCentroid) {
        maxDistToCentroid = dist;
      }
    });
    // Visual radius: at least 100m, at most clusterRadius + 100m
    const radiusMeters = Math.max(100, Math.round(maxDistToCentroid));

    // Determine dominant category
    let dominantCategory = 'OTHER';
    let maxCatCount = -1;
    for (const [cat, catCount] of Object.entries(categoryCounts)) {
      if (catCount > maxCatCount) {
        maxCatCount = catCount;
        dominantCategory = cat;
      }
    }

    // High priority count (HIGH + CRITICAL)
    const highPriorityCount = (severityCounts.HIGH || 0) + (severityCounts.CRITICAL || 0);

    // Calculate deterministic priority score (0-100)
    const priorityScore = calculatePriorityScore({
      complaintCount: count,
      severityBreakdown: severityCounts,
      dominantCategory,
      spreadRadiusMeters: maxDistToCentroid,
      clusterRadiusThreshold: clusterRadius
    });

    // Sample complaints
    const sampleComplaints = cluster.slice(0, 5).map((c) => ({
      id: c._id,
      title: c.title,
      category: c.category,
      severity: c.severity,
      status: c.status,
      address: c.address
    }));

    return {
      id: `hotspot-${index + 1}`,
      latitude: centroidLat,
      longitude: centroidLon,
      complaintCount: count,
      highPriorityCount,
      dominantCategory,
      priorityScore,
      radiusMeters,
      spreadMeters: Math.round(maxDistToCentroid),
      severityBreakdown: severityCounts,
      categoryBreakdown: categoryCounts,
      statusBreakdown: statusCounts,
      addresses: Array.from(addresses).slice(0, 4),
      complaintIds: cluster.map((c) => c._id),
      sampleComplaints
    };
  });

  // Sort hotspots descending by priorityScore
  hotspots.sort((a, b) => b.priorityScore - a.priorityScore);

  return hotspots;
}

export default {
  calculateDistanceMeters,
  calculatePriorityScore,
  detectGeographicHotspots,
  CATEGORY_HAZARD_WEIGHTS,
  SEVERITY_WEIGHTS
};

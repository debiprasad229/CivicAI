import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';

// Allowed civic categories
export const ALLOWED_CATEGORIES = [
  'ROAD',
  'STREET_LIGHT',
  'WATER',
  'DRAINAGE',
  'WASTE',
  'PUBLIC_TRANSPORT',
  'ELECTRICITY',
  'OTHER'
];

// Allowed severity levels
export const ALLOWED_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Simple in-memory LRU-like cache to avoid unnecessary repeated calls for identical content
const analysisCache = new Map();
const CACHE_MAX_SIZE = 100;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Generate a cache key from complaint content
 */
const getCacheKey = ({ title = '', description = '', address = '', category = '', language = '' }) => {
  const normalized = `${title.trim().toLowerCase()}|${description.trim().toLowerCase()}|${address.trim().toLowerCase()}|${category.trim().toLowerCase()}|${language.trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

/**
 * Sanitize error message to prevent leaking API keys or secrets in logs
 */
export const sanitizeError = (err) => {
  if (!err) return 'Unknown error';
  let message = typeof err === 'string' ? err : err.message || JSON.stringify(err);
  
  // Redact any Gemini API keys (e.g., key=AIza... or Bearer ...)
  message = message.replace(/key=[A-Za-z0-9_-]+/gi, 'key=[REDACTED]');
  message = message.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');
  message = message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');
  
  return message;
};

/**
 * Structured schema definition for Gemini response
 */
const complaintTriageSchema = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      enum: ALLOWED_CATEGORIES,
      description: 'Infrastructure domain category: ROAD, STREET_LIGHT, WATER, DRAINAGE, WASTE, PUBLIC_TRANSPORT, ELECTRICITY, or OTHER.'
    },
    severity: {
      type: Type.STRING,
      enum: ALLOWED_SEVERITIES,
      description: 'Triage severity: LOW, MEDIUM, HIGH, or CRITICAL based on immediate public hazard and disruption.'
    },
    language: {
      type: Type.STRING,
      description: 'The language detected or used in the complaint (e.g., "en", "hi", "es", "ta").'
    },
    summary: {
      type: Type.STRING,
      description: 'A concise 1-2 sentence factual summary for municipal dispatchers.'
    },
    affectedGroup: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Demographic groups or citizens impacted (e.g. Pedestrians, Commuters). Say "unavailable" or "general public" if unknown without hallucinating facts.'
    },
    recommendedAction: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Immediate municipal response and repair steps recommended.'
    },
    reasoning: {
      type: Type.STRING,
      description: 'Transparent justification explaining the assigned severity and category.'
    }
  },
  required: [
    'category',
    'severity',
    'language',
    'summary',
    'affectedGroup',
    'recommendedAction',
    'reasoning'
  ]
};

/**
 * Analyze citizen complaint grievance using Google Gemini
 * 
 * @param {Object} params
 * @param {string} params.title - Complaint title
 * @param {string} params.description - Detailed complaint description
 * @param {string} [params.language] - Optional language hint
 * @param {string} [params.category] - Optional category hint
 * @param {string} [params.address] - Optional address or landmark
 * @param {Object|Array} [params.location] - Optional coordinates [lng, lat] or GeoJSON
 * @param {boolean} [params.skipCache=false] - Whether to bypass memory cache
 * @returns {Promise<Object>} Structured triage assessment
 */
export const analyzeComplaint = async ({
  title,
  description,
  language = 'en',
  category = null,
  address = null,
  location = null,
  skipCache = false
}) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured on backend.');
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  if (!title || !description) {
    const error = new Error('Title and description are required for AI analysis.');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  // Check in-memory cache to prevent redundant API calls
  const cacheKey = getCacheKey({ title, description, address, category, language });
  if (!skipCache && analysisCache.has(cacheKey)) {
    const cached = analysisCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { ...cached.data, _cached: true };
    }
    analysisCache.delete(cacheKey);
  }

  const ai = new GoogleGenAI({ apiKey });

  // Format coordinates context if available
  let locationContext = 'unavailable';
  if (location) {
    if (Array.isArray(location.coordinates)) {
      locationContext = `Coordinates: [longitude: ${location.coordinates[0]}, latitude: ${location.coordinates[1]}]`;
    } else if (Array.isArray(location) && location.length >= 2) {
      locationContext = `Coordinates: [longitude: ${location[0]}, latitude: ${location[1]}]`;
    } else if (location.lat != null && location.lng != null) {
      locationContext = `Coordinates: [lat: ${location.lat}, lng: ${location.lng}]`;
    }
  }

  const prompt = `You are CivicAI Municipal Triage Analyst, an AI engine evaluating civic infrastructure grievances for municipal governance, public works, and emergency dispatch.

Analyze the following citizen report:
- Title: ${title.trim()}
- Description: ${description.trim()}
- Language hint: ${language || 'Auto-detect'}
- Citizen Selected Category: ${category ? category.trim() : 'Not provided'}
- Address / Landmark: ${address ? address.trim() : 'unavailable'}
- Location Data: ${locationContext}

CRITICAL RULES AND CONSTRAINTS:
1. Do not invent precise population numbers, hospital/school names, nearby government landmarks, or unverified infrastructure facts. If specific localized data is unknown or cannot be inferred with certainty from the text, state "unavailable" or "general public" for demographics.
2. Category must strictly be one of: ROAD, STREET_LIGHT, WATER, DRAINAGE, WASTE, PUBLIC_TRANSPORT, ELECTRICITY, OTHER.
3. Severity must strictly be one of:
   - CRITICAL: Imminent threat to life/safety, severe structural collapse, exposed high-voltage cables, major active flooding threatening residences, severe toxic hazard.
   - HIGH: Major traffic/transit blockage, deep road cave-in/sinkhole on arterial road, burst water main, sewage overflow on walkway.
   - MEDIUM: Standard infrastructure repair, localized non-hazardous pothole, non-working streetlight, overflowing garbage bin.
   - LOW: Minor cosmetic defect, faded lane marking, minor park debris, non-urgent request.
4. Summary: Concise 1-2 sentence municipal dispatch summary.
5. Provide actionable municipal repair steps in recommendedAction (array).
6. Provide transparent reasoning for the assigned severity and category.
`;

  try {
    // Primary model: gemini-3.6-flash with retry on transient spikes
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: complaintTriageSchema,
          temperature: 0.1
        }
      });
    } catch (primaryError) {
      const safePrimaryErr = sanitizeError(primaryError);
      // If 503 or 429 temporary spike, retry once after short backoff
      if (safePrimaryErr.includes('503') || safePrimaryErr.includes('429')) {
        console.warn(`[GeminiService] Transient demand spike detected. Retrying in 1.2s...`);
        await new Promise((r) => setTimeout(r, 1200));
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: complaintTriageSchema,
            temperature: 0.1
          }
        });
      } else {
        throw primaryError;
      }
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini model.');
    }

    const parsed = JSON.parse(responseText);

    // Validate and normalize structured output
    const validated = {
      category: ALLOWED_CATEGORIES.includes(parsed.category) 
        ? parsed.category 
        : (category && ALLOWED_CATEGORIES.includes(category.toUpperCase()) ? category.toUpperCase() : 'OTHER'),
      severity: ALLOWED_SEVERITIES.includes(parsed.severity) ? parsed.severity : 'MEDIUM',
      language: parsed.language || language || 'en',
      summary: parsed.summary || title,
      affectedGroup: Array.isArray(parsed.affectedGroup) && parsed.affectedGroup.length > 0 
        ? parsed.affectedGroup 
        : ['General Public'],
      recommendedAction: Array.isArray(parsed.recommendedAction) && parsed.recommendedAction.length > 0
        ? parsed.recommendedAction 
        : ['Dispatch municipal inspection crew to assess location'],
      reasoning: parsed.reasoning || 'Evaluated based on reported public infrastructure hazard.'
    };

    // Cache valid result
    if (analysisCache.size >= CACHE_MAX_SIZE) {
      const oldestKey = analysisCache.keys().next().value;
      analysisCache.delete(oldestKey);
    }
    analysisCache.set(cacheKey, { timestamp: Date.now(), data: validated });

    return validated;
  } catch (error) {
    const safeMessage = sanitizeError(error);
    console.error(`[GeminiService] Error during analysis: ${safeMessage}`);
    const wrappedError = new Error(safeMessage);
    wrappedError.originalCode = error.code || error.status;
    throw wrappedError;
  }
};

/**
 * Calculate Great-Circle distance in meters between two coordinates [longitude, latitude]
 */
export const calculateDistanceMeters = (coord1, coord2) => {
  if (!coord1 || !coord2) return null;
  const [lon1, lat1] = Array.isArray(coord1) 
    ? coord1 
    : [coord1.lng ?? coord1.longitude, coord1.lat ?? coord1.latitude];
  const [lon2, lat2] = Array.isArray(coord2) 
    ? coord2 
    : [coord2.lng ?? coord2.longitude, coord2.lat ?? coord2.latitude];
  
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;

  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Schema for similar/duplicate complaint detection
 */
const similarComplaintsSchema = {
  type: Type.OBJECT,
  properties: {
    similarComplaints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          complaintId: { 
            type: Type.STRING,
            description: 'The unique ID of the candidate complaint.'
          },
          isLikelyDuplicate: { 
            type: Type.BOOLEAN,
            description: 'Whether this candidate complaint describes the same underlying civic problem.'
          },
          similarityConfidence: { 
            type: Type.INTEGER, 
            description: 'Confidence score from 0 to 100.' 
          },
          explanation: { 
            type: Type.STRING, 
            description: 'Objective explanation comparing the two complaints, highlighting matching or conflicting details.' 
          }
        },
        required: ['complaintId', 'isLikelyDuplicate', 'similarityConfidence', 'explanation']
      }
    },
    summaryExplanation: {
      type: Type.STRING,
      description: 'Overall municipal summary of the duplicate analysis.'
    }
  },
  required: ['similarComplaints', 'summaryExplanation']
};

/**
 * Detect similar or duplicate complaints using Google Gemini
 * Evaluates only a pre-filtered small candidate set from MongoDB geospatial query.
 * 
 * @param {Object} params
 * @param {Object} params.targetComplaint - The base complaint being inspected
 * @param {Array} params.candidates - Pre-filtered candidate complaints within geographic proximity
 * @returns {Promise<Object>} Similar complaints analysis with confidence and explanations
 */
export const detectSimilarComplaints = async ({ targetComplaint, candidates = [] }) => {
  if (!targetComplaint || !Array.isArray(candidates) || candidates.length === 0) {
    return {
      similarComplaints: [],
      summaryExplanation: 'No nearby candidates found in proximity.'
    };
  }

  // Calculate distance for all candidates
  const candidatesWithDistance = candidates.map((c) => {
    const dist = calculateDistanceMeters(
      targetComplaint.location?.coordinates,
      c.location?.coordinates
    );
    return {
      ...c,
      distanceMeters: dist
    };
  });

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If no Gemini API key, return heuristic proximity fallback
  if (!apiKey) {
    return {
      similarComplaints: candidatesWithDistance.map((c) => ({
        complaintId: String(c._id || c.id),
        distanceMeters: c.distanceMeters,
        isLikelyDuplicate: c.distanceMeters != null && c.distanceMeters < 250,
        similarityConfidence: c.distanceMeters != null && c.distanceMeters < 250 ? 60 : 30,
        explanation: `Located within ${c.distanceMeters != null ? c.distanceMeters + 'm' : 'close proximity'} in category ${c.category}. Gemini API key unconfigured; requires admin verification.`
      })),
      summaryExplanation: 'Candidates identified via geographic proximity and category match. Requires municipal admin review.'
    };
  }

  const candidateDescriptions = candidatesWithDistance.map((c, idx) => `
Candidate #${idx + 1}:
- ID: ${c._id || c.id}
- Title: ${c.title}
- Description: ${c.description}
- Category: ${c.category}
- Address: ${c.address || 'unavailable'}
- Distance from target: ${c.distanceMeters != null ? `${c.distanceMeters} meters` : 'unknown'}
- Current Status: ${c.status || 'SUBMITTED'}
`).join('\n');

  const prompt = `You are CivicAI Municipal Triage Analyst.
Compare the following primary complaint against a list of pre-filtered nearby candidate complaints (all within 1 km in the same category) to determine if any describe the exact same physical infrastructure issue or are related incidents.

Primary Complaint:
- ID: ${targetComplaint._id || targetComplaint.id}
- Title: ${targetComplaint.title}
- Description: ${targetComplaint.description}
- Category: ${targetComplaint.category}
- Address: ${targetComplaint.address || 'unavailable'}

Geographically Nearby Candidates:
${candidateDescriptions}

RULES:
1. For EACH candidate, determine if it is likely a duplicate (describes the same physical fault, e.g. same pothole, same burst pipe, same dark street).
2. Assign similarityConfidence (0 to 100). If it describes the same physical hazard at the same spot, confidence should be 80-99. If nearby but different issue, confidence should be lower.
3. Provide a clear, factual explanation describing why they are or are not duplicate. Do not invent unverified facts.
4. Note: Complaints are NOT automatically merged; this output will be reviewed by a municipal administrator.
`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: similarComplaintsSchema,
          temperature: 0.1
        }
      });
    } catch (primaryError) {
      const safePrimaryErr = sanitizeError(primaryError);
      if (safePrimaryErr.includes('503') || safePrimaryErr.includes('429')) {
        console.warn(`[GeminiService] Duplicate detection transient spike. Retrying in 1.2s...`);
        await new Promise((r) => setTimeout(r, 1200));
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: similarComplaintsSchema,
            temperature: 0.1
          }
        });
      } else {
        throw primaryError;
      }
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received for duplicate analysis.');
    }

    const parsed = JSON.parse(responseText);

    // Merge calculated distance with AI results
    const mergedSimilar = (parsed.similarComplaints || []).map((item) => {
      const matchedCandidate = candidatesWithDistance.find(
        (c) => String(c._id || c.id) === String(item.complaintId)
      );
      return {
        ...item,
        distanceMeters: matchedCandidate ? matchedCandidate.distanceMeters : null,
        candidateDetails: matchedCandidate ? {
          _id: matchedCandidate._id,
          title: matchedCandidate.title,
          category: matchedCandidate.category,
          severity: matchedCandidate.severity,
          status: matchedCandidate.status,
          address: matchedCandidate.address,
          createdAt: matchedCandidate.createdAt
        } : null
      };
    });

    return {
      similarComplaints: mergedSimilar,
      summaryExplanation: parsed.summaryExplanation || 'Geospatial and semantic duplicate analysis completed.'
    };
  } catch (error) {
    const safeErr = sanitizeError(error);
    console.error(`[GeminiService] Error in detectSimilarComplaints: ${safeErr}`);
    
    // Graceful fallback to proximity
    return {
      similarComplaints: candidatesWithDistance.map((c) => ({
        complaintId: String(c._id || c.id),
        distanceMeters: c.distanceMeters,
        isLikelyDuplicate: c.distanceMeters != null && c.distanceMeters < 250,
        similarityConfidence: c.distanceMeters != null && c.distanceMeters < 250 ? 60 : 30,
        explanation: `Located within ${c.distanceMeters != null ? c.distanceMeters + 'm' : 'close proximity'}. AI analysis temporarily unavailable; admin review required.`,
        candidateDetails: {
          _id: c._id,
          title: c.title,
          category: c.category,
          severity: c.severity,
          status: c.status,
          address: c.address,
          createdAt: c.createdAt
        }
      })),
      summaryExplanation: 'Proximity candidates identified. Automated semantic comparison unavailable; requires admin inspection.'
    };
  }
};

export default {
  analyzeComplaint,
  detectSimilarComplaints,
  calculateDistanceMeters,
  ALLOWED_CATEGORIES,
  ALLOWED_SEVERITIES,
  sanitizeError
};


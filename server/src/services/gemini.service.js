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
      description: 'Detected language of the complaint: "en" (English), "hi" (Hindi), "or" (Odia), or relevant language code.'
    },
    summary: {
      type: Type.STRING,
      description: 'Standardized, concise 1-2 sentence factual English summary for municipal dispatchers. Regardless of whether original input was in English, Hindi, or Odia, this summary MUST ALWAYS BE in fluent standard English.'
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
      description: 'Transparent justification explaining the assigned severity, category, and language detection.'
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

MULTILINGUAL GRIEVANCE PROCESSING INSTRUCTIONS:
1. SUPPORTED CITIZEN LANGUAGES:
   - English
   - Hindi (हिन्दी) - in Devanagari script or transliteration
   - Odia (ଓଡ଼ିଆ) - in Odia script or transliteration
2. LANGUAGE DETECTION:
   - Detect whether the complaint is written in English ("en"), Hindi ("hi"), Odia ("or"), or another language code.
   - Accurately return "en", "hi", or "or" in the language field.
3. STANDARDIZED ENGLISH SUMMARY:
   - You MUST generate the "summary" field in clear, professional, standardized ENGLISH.
   - Even if the citizen lodged the grievance in Hindi or Odia, translate and condense the core civic problem into a concise 1-2 sentence English summary for municipal dispatchers, engineers, and public works personnel.
   - Do NOT output the summary in Hindi or Odia; the summary must always be standardized English.
4. PRESERVE ORIGINAL COMPLAINT:
   - The citizen's original text must be respected as the authoritative complaint record and will never be overwritten.
5. DOMAIN CLASSIFICATION & TRIAGE:
   - Understand municipal keywords in Hindi and Odia (e.g., सड़क/ରାସ୍ତା = ROAD, पानी/ଜଳ/ପାଣି = WATER, नाली/ଡ୍ରେନ୍ = DRAINAGE, बिजली/ବିଜୁଳି = ELECTRICITY, कचरा/ଅଳିଆ = WASTE, बत्ती/ଆଲୋକ = STREET_LIGHT) to assign the exact category and severity.

CRITICAL RULES AND CONSTRAINTS:
1. Do not invent precise population numbers, hospital/school names, nearby government landmarks, or unverified infrastructure facts. If specific localized data is unknown or cannot be inferred with certainty from the text, state "unavailable" or "general public" for demographics.
2. Category must strictly be one of: ROAD, STREET_LIGHT, WATER, DRAINAGE, WASTE, PUBLIC_TRANSPORT, ELECTRICITY, OTHER.
3. Severity must strictly be one of:
   - CRITICAL: Imminent threat to life/safety, severe structural collapse, exposed high-voltage cables, major active flooding threatening residences, severe toxic hazard.
   - HIGH: Major traffic/transit blockage, deep road cave-in/sinkhole on arterial road, burst water main, sewage overflow on walkway.
   - MEDIUM: Standard infrastructure repair, localized non-hazardous pothole, non-working streetlight, overflowing garbage bin.
   - LOW: Minor cosmetic defect, faded lane marking, minor park debris, non-urgent request.
4. Provide actionable municipal repair steps in recommendedAction (array).
5. Provide transparent reasoning for the assigned severity and category.
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

    // Normalize detected language code
    const rawLang = (parsed.language || language || 'en').toLowerCase().trim();
    const normalizedLanguage = 
      (rawLang.includes('hindi') || rawLang === 'hi') ? 'hi' :
      (rawLang.includes('odia') || rawLang.includes('oriya') || rawLang === 'or') ? 'or' :
      (rawLang.includes('english') || rawLang === 'en') ? 'en' :
      rawLang;

    // Validate and normalize structured output
    const validated = {
      category: ALLOWED_CATEGORIES.includes(parsed.category) 
        ? parsed.category 
        : (category && ALLOWED_CATEGORIES.includes(category.toUpperCase()) ? category.toUpperCase() : 'OTHER'),
      severity: ALLOWED_SEVERITIES.includes(parsed.severity) ? parsed.severity : 'MEDIUM',
      language: normalizedLanguage,
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
 * Deterministic fallback triage for multilingual complaints (English, Hindi, Odia)
 * Used when Gemini API encounters temporary rate limits, unconfigured key, or in test environments.
 */
export const getFallbackComplaintTriage = ({
  title = '',
  description = '',
  category = null,
  language = null,
  severity = 'MEDIUM'
}) => {
  const text = `${title} ${description}`.trim();
  
  // Detect language / script
  let detectedLang = 'en';
  if (/[\u0B00-\u0B7F]/.test(text)) {
    detectedLang = 'or'; // Odia script
  } else if (/[\u0900-\u097F]/.test(text)) {
    detectedLang = 'hi'; // Devanagari script
  } else if (language) {
    const raw = language.toLowerCase().trim();
    if (raw.includes('hi') || raw.includes('hindi')) detectedLang = 'hi';
    else if (raw.includes('or') || raw.includes('odia') || raw.includes('oriya')) detectedLang = 'or';
  }

  // Detect category keywords in English, Hindi, and Odia
  let detectedCategory = category ? category.toUpperCase() : 'OTHER';
  let detectedSeverity = severity || 'MEDIUM';
  let standardizedEnglishSummary = '';

  if (/water|pipeline|leak|supply|burst|drinking|पानी|जल|पाइप|नल|ପାଣି|ଜଳ|ପାଇପ|ଫାଟି/i.test(text)) {
    detectedCategory = 'WATER';
    detectedSeverity = /burst|flood|rupture|hazard|contamination|गंभीर|फूट|ଫାଟି|ବନ୍ୟା|ବିଷାକ୍ତ/i.test(text) ? 'CRITICAL' : 'HIGH';
    standardizedEnglishSummary = detectedLang === 'hi'
      ? 'Citizen reports water supply disruption and pipeline leakage requiring utility maintenance.'
      : detectedLang === 'or'
      ? 'Citizen reports critical mainline water pipeline rupture causing localized waterlogging.'
      : 'Water supply disruption and pipeline leakage reported requiring immediate utility inspection.';
  } else if (/road|pothole|crater|street|pavement|asphalt|सड़क|गड्ढा|मार्ग|ରାସ୍ତା|ଖାଲ|ପଥ/i.test(text)) {
    detectedCategory = 'ROAD';
    detectedSeverity = /accident|deep|danger|severe|hazard|दुर्घटना|गंभीर|ବଡ଼|ଦୁର୍ଘଟଣା/i.test(text) ? 'HIGH' : 'MEDIUM';
    standardizedEnglishSummary = detectedLang === 'hi'
      ? 'Citizen reports road surface deterioration and hazardous potholes obstructing vehicular traffic.'
      : detectedLang === 'or'
      ? 'Citizen reports severe road degradation and deep potholes posing commuter safety hazard.'
      : 'Pothole and road surface degradation reported requiring asphalt repaving.';
  } else if (/light|dark|pole|lamp|streetlight|बत्ती|रोशनी|बिजली|ବିଜୁଳି|ଆଲୋକ|ଖୁଣ୍ଟ/i.test(text)) {
    detectedCategory = 'STREET_LIGHT';
    detectedSeverity = 'MEDIUM';
    standardizedEnglishSummary = 'Non-functional streetlights reported along the transit stretch creating dark spots.';
  } else if (/drain|drainage|culvert|clog|sewer|waterlogging|नाली|नाला|जलभराव|ଡ୍ରେନ୍|ନାଳ/i.test(text)) {
    detectedCategory = 'DRAINAGE';
    detectedSeverity = 'HIGH';
    standardizedEnglishSummary = 'Blocked drainage canal causing stormwater overflow and localized water stagnation.';
  } else if (/waste|garbage|dump|trash|rubbish|कचरा|कूड़ा|ଅଳିଆ|ଆବର୍ଜନା/i.test(text)) {
    detectedCategory = 'WASTE';
    detectedSeverity = 'MEDIUM';
    standardizedEnglishSummary = 'Accumulation of uncollected municipal waste creating localized sanitation issue.';
  } else {
    standardizedEnglishSummary = `Civic infrastructure grievance submitted in ${detectedLang === 'hi' ? 'Hindi' : detectedLang === 'or' ? 'Odia' : 'English'}. Standardized for dispatch.`;
  }

  return {
    category: ALLOWED_CATEGORIES.includes(detectedCategory) ? detectedCategory : 'OTHER',
    severity: ALLOWED_SEVERITIES.includes(detectedSeverity) ? detectedSeverity : 'MEDIUM',
    language: detectedLang,
    summary: standardizedEnglishSummary,
    affectedGroup: ['Local Residents', 'Pedestrians', 'Commuters'],
    recommendedAction: ['Dispatch municipal zonal inspection team to survey site'],
    reasoning: `Classified as ${detectedCategory} based on multilingual semantic keywords. Language detected as ${detectedLang}.`
  };
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

/**
 * Structured schema definition for Hotspot AI Recommendation
 */
export const hotspotRecommendationSchema = {
  type: Type.OBJECT,
  properties: {
    recommendedIntervention: {
      type: Type.STRING,
      description: 'Specific physical infrastructure repair, dispatch, or remediation action recommended for municipal field teams.'
    },
    reason: {
      type: Type.STRING,
      description: 'Clear rationale linking the recommendation directly to the reported complaint patterns, severity, and category.'
    },
    expectedBenefit: {
      type: Type.STRING,
      description: 'Anticipated direct civic outcome of the intervention (e.g. hazard mitigation, restored utility access, risk reduction).'
    },
    urgency: {
      type: Type.STRING,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      description: 'Urgency tier based on public safety hazard and complaint concentration: LOW, MEDIUM, HIGH, or CRITICAL.'
    }
  },
  required: ['recommendedIntervention', 'reason', 'expectedBenefit', 'urgency']
};

// In-memory cache for hotspot recommendations
const hotspotRecCache = new Map();

/**
 * Deterministic fallback recommendation when Gemini API is unconfigured or offline
 */
export const getFallbackHotspotRecommendation = (hotspot = {}) => {
  const cat = hotspot.dominantCategory || 'OTHER';
  const count = hotspot.complaintCount || 2;
  const radius = hotspot.radiusMeters || 100;
  const isHighPriority = (hotspot.highPriorityCount || 0) > 0 || (hotspot.priorityScore || 0) >= 60;

  switch (cat) {
    case 'WATER':
      return {
        recommendedIntervention: 'Dispatch water utility engineering crew to isolate the local pipe segment, test pressure gates, and patch pipeline fractures.',
        reason: `Concentration of ${count} water grievances within ~${radius}m indicates localized supply disruption or mainline leakage.`,
        expectedBenefit: 'Restores drinking water delivery, halts street flooding, and mitigates contamination risks.',
        urgency: isHighPriority ? 'CRITICAL' : 'HIGH'
      };
    case 'ROAD':
      return {
        recommendedIntervention: 'Deploy road maintenance unit to erect safety warning barricades and commence cold-mix asphalt crater patching.',
        reason: `Cluster of ${count} road grievances indicates roadbed degradation posing vehicular crash hazards.`,
        expectedBenefit: 'Prevents vehicular accidents, eliminates rim damage, and restores smooth traffic circulation.',
        urgency: isHighPriority ? 'HIGH' : 'MEDIUM'
      };
    case 'DRAINAGE':
      return {
        recommendedIntervention: 'Mobilize municipal suction gully-emptiers to unblock stormwater culverts and clear obstructed drainage mains.',
        reason: `Multiple drainage complaints within a compact radius indicates heavy silt blockage and sewage backflow risk.`,
        expectedBenefit: 'Relieves street waterlogging, prevents foul wastewater stagnation, and mitigates vector-borne health risks.',
        urgency: isHighPriority ? 'CRITICAL' : 'HIGH'
      };
    case 'ELECTRICITY':
      return {
        recommendedIntervention: 'Deploy emergency electrical utility squad to isolate faulty lines, secure exposed conductors, and repair junction boxes.',
        reason: `Cluster of electrical grievances creating acute electrocution and transformer fire risks.`,
        expectedBenefit: 'Eliminates public electrocution hazards and stabilizes neighborhood power delivery.',
        urgency: 'CRITICAL'
      };
    case 'STREET_LIGHT':
      return {
        recommendedIntervention: 'Dispatch municipal lighting maintenance team to replace damaged luminaires and restore feed cables.',
        reason: `Group of non-functional streetlights resulting in an unlit corridor along the reported stretch.`,
        expectedBenefit: 'Restores nighttime commuter illumination and improves pedestrian safety.',
        urgency: 'MEDIUM'
      };
    case 'WASTE':
      return {
        recommendedIntervention: 'Deploy solid waste compactor trucks and sanitization team to remove accumulated garbage and disinfect dump sites.',
        reason: `Multiple reports of overflowing waste dumpsters causing localized sanitation hazards.`,
        expectedBenefit: 'Restores public hygiene, clears footpaths, and eliminates vector breeding grounds.',
        urgency: isHighPriority ? 'HIGH' : 'MEDIUM'
      };
    default:
      return {
        recommendedIntervention: 'Dispatch a municipal multi-disciplinary task force to perform an on-site audit and initiate targeted remedial works.',
        reason: `Civic grievance cluster of ${count} reports indicating persistent infrastructure failure in this locality.`,
        expectedBenefit: 'Addresses recurring citizen grievances and restores municipal service reliability.',
        urgency: isHighPriority ? 'HIGH' : 'MEDIUM'
      };
  }
};

/**
 * Generate AI-powered infrastructure recommendations for significant hotspots using Google Gemini
 * 
 * Enforces strict data minimization:
 * - Hotspot statistics (count, highPriorityCount, priorityScore, radius, spread)
 * - Categories & severity distribution
 * - Sample complaint summaries (titles/descriptions only; zero personal info)
 * - Available geographic information (coordinates, general locality)
 * 
 * Constrained to distinguish database facts from recommendations, and forbidden from
 * hallucinating population, budgets, schools, hospitals, or unverified infrastructure statistics.
 * 
 * @param {Object} params
 * @param {Object} params.hotspot - The hotspot object
 * @param {boolean} [params.skipCache=false] - Whether to bypass memory cache
 * @returns {Promise<Object>} Recommendation object { recommendedIntervention, reason, expectedBenefit, urgency }
 */
export const generateHotspotRecommendation = async ({ hotspot, skipCache = false }) => {
  if (!hotspot) {
    throw new Error('Hotspot data is required to generate AI recommendation.');
  }

  const hotspotId = hotspot.id || 'hotspot';
  const cacheKey = `${hotspotId}|${hotspot.complaintCount}|${hotspot.priorityScore}|${hotspot.dominantCategory}`;

  if (!skipCache && hotspotRecCache.has(cacheKey)) {
    const cached = hotspotRecCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { ...cached.data, _cached: true };
    }
    hotspotRecCache.delete(cacheKey);
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If no Gemini API key configured, use transparent deterministic fallback
  if (!apiKey) {
    const fallback = getFallbackHotspotRecommendation(hotspot);
    return { ...fallback, _fallback: true };
  }

  // Sanitize sample complaints: extract ONLY titles, categories, and descriptions. NO personal data!
  const sanitizedSamples = (hotspot.sampleComplaints || []).slice(0, 5).map((c, idx) => {
    const title = c.title ? String(c.title).trim() : 'Civic issue';
    const desc = c.description ? String(c.description).trim().slice(0, 200) : 'No description provided';
    const cat = c.category || 'OTHER';
    const sev = c.severity || 'MEDIUM';
    const addr = c.address ? String(c.address).trim() : 'General locality';
    return `Sample #${idx + 1}: [${cat}] Severity: ${sev} | Title: "${title}" | Details: "${desc}" | Location: ${addr}`;
  }).join('\n');

  const prompt = `You are the CivicAI Municipal Infrastructure Planning Engine.
You are generating a decision-support infrastructure recommendation for municipal field authorities based SOLELY on verified complaint cluster data.

CLUSTER TELEMETRY & DATABASE FACTS:
- Cluster Identifier: ${hotspot.id || 'Hotspot'}
- Total Complaints Logged: ${hotspot.complaintCount || 2}
- High Priority (Critical & High) Hazards: ${hotspot.highPriorityCount || 0}
- Priority Score: ${hotspot.priorityScore || 50} / 100
- Cluster Spread Radius: ~${hotspot.radiusMeters || 100} meters
- Dominant Infrastructure Sector: ${hotspot.dominantCategory || 'OTHER'}
- Category Breakdown: ${JSON.stringify(hotspot.categoryBreakdown || {})}
- Severity Distribution: ${JSON.stringify(hotspot.severityBreakdown || {})}
- Approximate Centroid: [latitude: ${hotspot.latitude || 'unavailable'}, longitude: ${hotspot.longitude || 'unavailable'}]
- Reported Localities: ${(hotspot.addresses || []).join('; ') || 'General municipal area'}

SAMPLE REPORT SUMMARIES (Zero Personal Information):
${sanitizedSamples || 'No individual report summaries available.'}

CRITICAL DIRECTIVES:
1. Distinguish database facts from your AI recommendations. Base all observations strictly on the reported complaint telemetry above.
2. DO NOT invent, assume, or hallucinate population figures, municipal budgets, school names, hospital names, or unverified infrastructure statistics not provided in the input. If specific population or demographic facts are unavailable, explicitly state 'unavailable' or omit them.
3. Formulate:
   - recommendedIntervention: Concrete, physical engineering repair, dispatch protocol, or preventive maintenance to resolve this specific cluster.
   - reason: Objective rationale explaining how the intervention directly addresses the reported grievances, severity distribution, and spatial concentration.
   - expectedBenefit: Clear direct civic benefit (e.g., hazard reduction, restored utility service, public health protection).
   - urgency: Strictly one of: "LOW", "MEDIUM", "HIGH", or "CRITICAL" based on the hazard level and public risk.
4. Keep the response concise, authoritative, and professional for city engineers.`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: hotspotRecommendationSchema,
          temperature: 0.1
        }
      });
    } catch (primaryError) {
      const safeErr = sanitizeError(primaryError);
      if (safeErr.includes('503') || safeErr.includes('429')) {
        console.warn(`[GeminiService] Hotspot recommendation transient spike. Retrying in 1.2s...`);
        await new Promise((r) => setTimeout(r, 1200));
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: hotspotRecommendationSchema,
            temperature: 0.1
          }
        });
      } else {
        throw primaryError;
      }
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini for hotspot recommendation.');
    }

    const parsed = JSON.parse(responseText);

    const recommendation = {
      recommendedIntervention: parsed.recommendedIntervention || 'Perform on-site municipal engineering inspection and remedial repair.',
      reason: parsed.reason || 'Multiple clustered infrastructure grievances requiring coordinated public works intervention.',
      expectedBenefit: parsed.expectedBenefit || 'Mitigates localized public hazards and restores infrastructure integrity.',
      urgency: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.urgency) ? parsed.urgency : 'HIGH'
    };

    hotspotRecCache.set(cacheKey, {
      data: recommendation,
      timestamp: Date.now()
    });

    return recommendation;
  } catch (error) {
    const safeErr = sanitizeError(error);
    console.error(`[GeminiService] Error in generateHotspotRecommendation: ${safeErr}`);
    const fallback = getFallbackHotspotRecommendation(hotspot);
    return { ...fallback, _fallback: true, _error: safeErr };
  }
};

export default {
  analyzeComplaint,
  detectSimilarComplaints,
  generateHotspotRecommendation,
  calculateDistanceMeters,
  ALLOWED_CATEGORIES,
  ALLOWED_SEVERITIES,
  sanitizeError
};


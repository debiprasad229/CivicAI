import Complaint, { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, COMPLAINT_SEVERITIES } from '../models/Complaint.js';
import geminiService, { sanitizeError, getFallbackComplaintTriage } from '../services/gemini.service.js';

// @desc    Submit a new infrastructure grievance
// @route   POST /api/complaints
// @access  Private (Citizen or Admin)
export const createComplaint = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      severity, 
      location, 
      address, 
      affectedGroup, 
      language 
    } = req.body;

    if (!title || !description || !category || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, and address'
      });
    }

    const normalizedCategory = category.toUpperCase().trim();
    if (!COMPLAINT_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category '${category}'. Allowed values: ${COMPLAINT_CATEGORIES.join(', ')}`
      });
    }

    // Process GeoJSON location [longitude, latitude]
    let coordinates = [77.2090, 28.6139]; // Default coordinates
    if (location) {
      if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
        coordinates = [Number(location.coordinates[0]), Number(location.coordinates[1])];
      } else if (location.lng !== undefined && location.lat !== undefined) {
        coordinates = [Number(location.lng), Number(location.lat)];
      } else if (location.longitude !== undefined && location.latitude !== undefined) {
        coordinates = [Number(location.longitude), Number(location.latitude)];
      }
    }

    const normalizedSeverity = severity ? severity.toUpperCase().trim() : 'MEDIUM';
    const validSeverity = COMPLAINT_SEVERITIES.includes(normalizedSeverity) ? normalizedSeverity : 'MEDIUM';

    // Build timeline entry
    const initialTimeline = [
      {
        status: 'SUBMITTED',
        note: 'Complaint lodged by citizen via digital portal',
        updatedBy: req.user._id,
        timestamp: new Date()
      }
    ];

    // Detect initial language based on Unicode script if not specified
    let initialLanguage = language || 'en';
    const textScan = `${title} ${description}`;
    if (/[\u0B00-\u0B7F]/.test(textScan)) {
      initialLanguage = 'or';
    } else if (/[\u0900-\u097F]/.test(textScan)) {
      initialLanguage = 'hi';
    }

    // Compute immediate high-accuracy heuristic triage for instant demo feedback
    const heuristicTriage = getFallbackComplaintTriage({
      title: title.trim(),
      description: description.trim(),
      category: normalizedCategory,
      language: initialLanguage,
      severity: validSeverity
    });

    // 1. Save complaint immediately with baseline triage & PENDING status
    const complaint = await Complaint.create({
      title: title.trim(),
      description: description.trim(),
      originalDescription: description.trim(),
      category: normalizedCategory,
      severity: validSeverity,
      status: 'SUBMITTED',
      language: initialLanguage,
      affectedGroup: Array.isArray(affectedGroup) && affectedGroup.length > 0 
        ? affectedGroup 
        : heuristicTriage.affectedGroup || ['General Public'],
      recommendedAction: heuristicTriage.recommendedAction || ['Dispatch municipal inspection crew to assess location'],
      aiSummary: heuristicTriage.summary || title.trim(),
      location: {
        type: 'Point',
        coordinates
      },
      address: address.trim(),
      createdBy: req.user._id,
      timeline: initialTimeline,
      aiAnalysis: {
        status: 'PENDING',
        urgencyScore: validSeverity === 'CRITICAL' ? 95 : validSeverity === 'HIGH' ? 75 : 50,
        recommendedDepartment: `${normalizedCategory.replace(/_/g, ' ')} Public Works Bureau`,
        reasoning: 'Initial triage assigned via deterministic heuristic engine; background AI verification active.'
      }
    });

    // Invalidate analytics and hotspot in-memory caches on new complaint
    if (global.clearAnalyticsCache) {
      global.clearAnalyticsCache();
    }

    // 2. Respond immediately to user (<80ms) for snappy UX during live demo!
    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint
    });

    // 3. Asynchronously execute Gemini AI deep triage in background if API key configured
    if (process.env.GEMINI_API_KEY?.trim()) {
      setImmediate(async () => {
        try {
          const aiResult = await geminiService.analyzeComplaint({
            title: complaint.title,
            description: complaint.description,
            language: complaint.language,
            category: complaint.category,
            address: complaint.address,
            location: complaint.location
          });

          const toUpdate = {};
          if (aiResult.severity) toUpdate.severity = aiResult.severity;
          if (aiResult.category && COMPLAINT_CATEGORIES.includes(aiResult.category)) {
            toUpdate.category = aiResult.category;
          }
          if (aiResult.language) toUpdate.language = aiResult.language;
          if (aiResult.summary) toUpdate.aiSummary = aiResult.summary;
          if (Array.isArray(aiResult.affectedGroup) && aiResult.affectedGroup.length > 0) {
            toUpdate.affectedGroup = aiResult.affectedGroup;
          }
          if (Array.isArray(aiResult.recommendedAction) && aiResult.recommendedAction.length > 0) {
            toUpdate.recommendedAction = aiResult.recommendedAction;
          }

          toUpdate.aiAnalysis = {
            status: 'COMPLETED',
            reasoning: aiResult.reasoning || '',
            completedAt: new Date(),
            rawResponse: aiResult
          };

          await Complaint.findByIdAndUpdate(complaint._id, {
            $set: toUpdate,
            $push: {
              timeline: {
                status: 'SUBMITTED',
                note: `AI automated triage completed (Severity: ${toUpdate.severity || complaint.severity}, Category: ${toUpdate.category || complaint.category})`,
                updatedBy: req.user._id,
                timestamp: new Date()
              }
            }
          });
        } catch (aiError) {
          const safeMessage = sanitizeError(aiError);
          console.warn(`[ComplaintController] Background AI triage notice for complaint #${complaint._id}: ${safeMessage}`);
          await Complaint.findByIdAndUpdate(complaint._id, {
            $set: {
              'aiAnalysis.status': 'PENDING',
              'aiAnalysis.error': safeMessage
            }
          }).catch(() => {});
        }
      });
    }
  } catch (error) {
    const safeError = sanitizeError(error);
    console.error('[ComplaintController.createComplaint] Error:', safeError);
    return res.status(500).json({
      success: false,
      message: safeError || 'Server error creating complaint'
    });
  }
};

// @desc    Get all complaints created by logged-in citizen
// @route   GET /api/complaints/my
// @access  Private (Citizen)
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error('[ComplaintController.getMyComplaints] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving your complaints'
    });
  }
};

// @desc    Get a single complaint by ID with ownership validation
// @route   GET /api/complaints/:id
// @access  Private (Owner or Admin)
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('createdBy', 'name email phone ward')
      .populate('timeline.updatedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `Complaint #${req.params.id} not found`
      });
    }

    // Ownership check: Citizens can only view their own complaints; Admins can view all
    const isOwner = complaint.createdBy && complaint.createdBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this complaint'
      });
    }

    return res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('[ComplaintController.getComplaintById] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.kind === 'ObjectId' ? 'Invalid complaint ID format' : 'Server error fetching complaint'
    });
  }
};

// @desc    Update complaint details (Citizen owner only)
// @route   PATCH /api/complaints/:id
// @access  Private (Owner only)
export const updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `Complaint #${req.params.id} not found`
      });
    }

    // Verify ownership
    if (complaint.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit complaints submitted by your account'
      });
    }

    // Only allow editing if complaint is not in progress or resolved
    if (['IN_PROGRESS', 'RESOLVED', 'REJECTED'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit complaint with status '${complaint.status}'. Municipal field action has already commenced.`
      });
    }

    const { title, description, address, affectedGroup } = req.body;
    if (title) complaint.title = title.trim();
    if (description) complaint.description = description.trim();
    if (address) complaint.address = address.trim();
    if (affectedGroup) {
      complaint.affectedGroup = Array.isArray(affectedGroup) ? affectedGroup : [affectedGroup];
    }

    complaint.updatedAt = new Date();
    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint
    });
  } catch (error) {
    console.error('[ComplaintController.updateComplaint] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error updating complaint'
    });
  }
};

// Utility to escape regex special characters to prevent ReDoS / query injection
const escapeRegex = (string) => {
  return typeof string === 'string' ? string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
};

// @desc    Get all complaints across municipality with filtering & search
// @route   GET /api/admin/complaints
// @access  Private (Admin only)
export const getAdminComplaints = async (req, res) => {
  try {
    const { category, status, severity, search, limit = 50, page = 1 } = req.query;

    const filter = {};

    if (category && category !== 'ALL') {
      filter.category = category.toUpperCase();
    }
    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }
    if (severity && severity !== 'ALL') {
      filter.severity = severity.toUpperCase();
    }
    if (search && typeof search === 'string' && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim().slice(0, 100));
      filter.$or = [
        { title: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
        { address: { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('createdBy', 'name email phone ward')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: complaints.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      complaints
    });
  } catch (error) {
    console.error('[ComplaintController.getAdminComplaints] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving municipal registry'
    });
  }
};

// @desc    Update complaint status & append resolution audit note
// @route   PATCH /api/admin/complaints/:id/status
// @access  Private (Admin only)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a target status'
      });
    }

    const normalizedStatus = status.toUpperCase().trim();
    if (!COMPLAINT_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed values: ${COMPLAINT_STATUSES.join(', ')}`
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `Complaint #${req.params.id} not found`
      });
    }

    complaint.status = normalizedStatus;
    complaint.timeline.push({
      status: normalizedStatus,
      note: note ? note.trim() : `Status updated to ${normalizedStatus} by municipal administrator`,
      updatedBy: req.user._id,
      timestamp: new Date()
    });
    complaint.updatedAt = new Date();

    await complaint.save();

    if (global.clearAnalyticsCache) {
      global.clearAnalyticsCache();
    }

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to ${normalizedStatus}`,
      complaint
    });
  } catch (error) {
    console.error('[ComplaintController.updateComplaintStatus] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error updating complaint status'
    });
  }
};

// In-memory cache for similar complaint detection to avoid repeated Gemini calls
const similarComplaintsCache = new Map();
const SIMILAR_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// @desc    Detect nearby similar or duplicate complaints using geospatial + AI
// @route   GET /api/complaints/:id/similar
// @access  Private (Citizen owner or Admin)
export const getSimilarComplaints = async (req, res) => {
  try {
    const maxDistanceMeters = Number(req.query.radius) || 1000; // 1km default radius
    const cacheKey = `${req.params.id}|${maxDistanceMeters}`;

    if (similarComplaintsCache.has(cacheKey)) {
      const entry = similarComplaintsCache.get(cacheKey);
      if (Date.now() - entry.timestamp < SIMILAR_CACHE_TTL) {
        return res.status(200).json({ ...entry.data, cached: true });
      }
      similarComplaintsCache.delete(cacheKey);
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `Complaint #${req.params.id} not found`
      });
    }

    // Check authorization: complaint creator or admin
    const isOwner = complaint.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only inspect duplicate analysis for your own complaints'
      });
    }

    if (!complaint.location?.coordinates || !Array.isArray(complaint.location.coordinates) || complaint.location.coordinates.length < 2) {
      return res.status(200).json({
        success: true,
        complaintId: complaint._id,
        hasCandidates: false,
        similarComplaints: [],
        summaryExplanation: 'No geographic coordinates available on this complaint for geospatial proximity search.',
        adminReviewRequired: true
      });
    }

    // 1. Filter candidates by geographic proximity ($near) and matching category
    // Using 2dsphere geospatial index
    let candidates = [];
    try {
      candidates = await Complaint.find({
        _id: { $ne: complaint._id },
        category: complaint.category,
        status: { $ne: 'REJECTED' },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: complaint.location.coordinates
            },
            $maxDistance: maxDistanceMeters
          }
        }
      })
      .limit(5)
      .select('title description category severity status location address createdAt aiSummary')
      .lean();
    } catch (geoErr) {
      console.warn('[ComplaintController.getSimilarComplaints] $near query fallback:', geoErr.message);
      // Fallback in case 2dsphere index is still building or non-standard geo environment
      candidates = await Complaint.find({
        _id: { $ne: complaint._id },
        category: complaint.category,
        status: { $ne: 'REJECTED' }
      })
      .limit(5)
      .select('title description category severity status location address createdAt aiSummary')
      .lean();
    }

    if (!candidates || candidates.length === 0) {
      return res.status(200).json({
        success: true,
        complaintId: complaint._id,
        hasCandidates: false,
        candidateCount: 0,
        similarComplaints: [],
        summaryExplanation: `No existing grievances found within ${maxDistanceMeters}m radius in the '${complaint.category}' category.`,
        adminReviewRequired: true
      });
    }

    // 2. Use AI on this small candidate set (max 5)
    const duplicateAnalysis = await geminiService.detectSimilarComplaints({
      targetComplaint: complaint,
      candidates
    });

    const responsePayload = {
      success: true,
      complaintId: complaint._id,
      hasCandidates: true,
      candidateCount: candidates.length,
      searchRadiusMeters: maxDistanceMeters,
      similarComplaints: duplicateAnalysis.similarComplaints,
      summaryExplanation: duplicateAnalysis.summaryExplanation,
      adminReviewRequired: true
    };

    similarComplaintsCache.set(cacheKey, {
      data: responsePayload,
      timestamp: Date.now()
    });

    return res.status(200).json(responsePayload);
  } catch (error) {
    const safeErr = sanitizeError(error);
    console.error('[ComplaintController.getSimilarComplaints] Error:', safeErr);
    return res.status(500).json({
      success: false,
      message: safeErr || 'Error detecting similar complaints'
    });
  }
};


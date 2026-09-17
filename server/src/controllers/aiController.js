import Complaint, { COMPLAINT_CATEGORIES } from '../models/Complaint.js';
import geminiService, { sanitizeError } from '../services/gemini.service.js';

/**
 * @desc    Analyze a complaint grievance using Gemini
 * @route   POST /api/ai/analyze-complaint
 * @access  Private (Authenticated Citizen or Admin)
 */
export const analyzeComplaintHandler = async (req, res) => {
  try {
    const { 
      complaintId,
      title, 
      description, 
      category, 
      language, 
      address, 
      location,
      force = false
    } = req.body;

    // Case 1: If complaintId is provided, analyze or retrieve existing analysis for a stored complaint
    if (complaintId) {
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: `Complaint with ID '${complaintId}' not found.`
        });
      }

      // Check permission: only owner or admin can trigger analysis
      const isOwner = complaint.createdBy.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to analyze this complaint.'
        });
      }

      // Avoid unnecessary repeated calls if already analyzed and not forced
      if (!force && complaint.aiAnalysis?.status === 'COMPLETED' && complaint.aiAnalysis?.rawResponse) {
        return res.status(200).json({
          success: true,
          cached: true,
          analysis: complaint.aiAnalysis.rawResponse
        });
      }

      // Run analysis
      const analysis = await geminiService.analyzeComplaint({
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        language: complaint.language,
        address: complaint.address,
        location: complaint.location,
        skipCache: force
      });

      // Update complaint in database
      complaint.severity = analysis.severity || complaint.severity;
      if (analysis.category && COMPLAINT_CATEGORIES.includes(analysis.category)) {
        complaint.category = analysis.category;
      }
      complaint.aiSummary = analysis.summary || complaint.aiSummary;
      if (Array.isArray(analysis.affectedGroup) && analysis.affectedGroup.length > 0) {
        complaint.affectedGroup = analysis.affectedGroup;
      }
      if (Array.isArray(analysis.recommendedAction) && analysis.recommendedAction.length > 0) {
        complaint.recommendedAction = analysis.recommendedAction;
      }
      complaint.aiAnalysis = {
        status: 'COMPLETED',
        reasoning: analysis.reasoning,
        completedAt: new Date(),
        rawResponse: analysis
      };

      complaint.timeline.push({
        status: complaint.status,
        note: `AI automated triage updated (Severity: ${complaint.severity}, Category: ${complaint.category})`,
        updatedBy: req.user._id,
        timestamp: new Date()
      });

      await complaint.save();

      return res.status(200).json({
        success: true,
        complaintId: complaint._id,
        analysis
      });
    }

    // Case 2: Analyze draft grievance payload before submission
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and description for analysis.'
      });
    }

    if (title.trim().length < 5 || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 5 characters and description at least 10 characters.'
      });
    }

    const analysis = await geminiService.analyzeComplaint({
      title: title.trim(),
      description: description.trim(),
      category: category ? category.trim() : null,
      language: language || 'en',
      address: address ? address.trim() : null,
      location: location || null,
      skipCache: force
    });

    return res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    const safeMsg = sanitizeError(error);
    console.error('[aiController.analyzeComplaintHandler] Error:', safeMsg);

    // Provide friendly response if API key is unconfigured
    if (error.code === 'MISSING_API_KEY') {
      return res.status(503).json({
        success: false,
        code: 'MISSING_API_KEY',
        message: 'AI analysis service is temporarily unavailable (GEMINI_API_KEY not configured).'
      });
    }

    return res.status(500).json({
      success: false,
      message: safeMsg || 'Failed to analyze complaint with Gemini.'
    });
  }
};

export default {
  analyzeComplaintHandler
};

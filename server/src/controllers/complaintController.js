import Complaint, { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, COMPLAINT_SEVERITIES } from '../models/Complaint.js';

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

    const complaint = await Complaint.create({
      title: title.trim(),
      description: description.trim(),
      category: normalizedCategory,
      severity: validSeverity,
      status: 'SUBMITTED',
      language: language || 'en',
      affectedGroup: Array.isArray(affectedGroup) ? affectedGroup : affectedGroup ? [affectedGroup] : [],
      location: {
        type: 'Point',
        coordinates
      },
      address: address.trim(),
      createdBy: req.user._id,
      timeline: initialTimeline
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    console.error('[ComplaintController.createComplaint] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating complaint'
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
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('createdBy', 'name email phone ward')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Complaint.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: complaints.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
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

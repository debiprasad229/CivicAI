import express from 'express';
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  getAdminComplaints,
  updateComplaintStatus
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

// Citizen Complaints Router (Mounted at /api/complaints)
export const complaintRoutes = express.Router();

complaintRoutes.use(protect); // All complaint routes require authentication
complaintRoutes.post('/', createComplaint);
complaintRoutes.get('/my', getMyComplaints);
complaintRoutes.get('/:id', getComplaintById);
complaintRoutes.patch('/:id', updateComplaint);

// Admin Complaints Router (Mounted at /api/admin/complaints)
export const adminComplaintRoutes = express.Router();

adminComplaintRoutes.use(protect);
adminComplaintRoutes.use(authorize('admin')); // Strictly restricted to admin role
adminComplaintRoutes.get('/', getAdminComplaints);
adminComplaintRoutes.patch('/:id/status', updateComplaintStatus);

export default complaintRoutes;

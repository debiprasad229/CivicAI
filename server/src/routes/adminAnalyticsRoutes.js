import express from 'express';
import {
  getOverview,
  getCategories,
  getSeverity,
  getTrends
} from '../controllers/adminAnalyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict security: all endpoints require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/overview', getOverview);
router.get('/categories', getCategories);
router.get('/severity', getSeverity);
router.get('/trends', getTrends);

export default router;

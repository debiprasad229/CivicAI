import express from 'express';
import { getAdminHotspots } from '../controllers/hotspotController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict security: Only admins may access hotspot endpoints
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAdminHotspots);

export default router;

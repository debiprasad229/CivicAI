import express from 'express';
import { getAdminHotspots, getHotspotRecommendation } from '../controllers/hotspotController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict security: Only admins may access hotspot endpoints
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAdminHotspots);
router.post('/recommendation', getHotspotRecommendation);
router.post('/:id/recommendation', getHotspotRecommendation);
router.get('/:id/recommendation', getHotspotRecommendation);

export default router;

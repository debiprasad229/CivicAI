import express from 'express';
import { analyzeComplaintHandler } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

export const aiRoutes = express.Router();

// All AI routes require user authentication
aiRoutes.use(protect);

// POST /api/ai/analyze-complaint
aiRoutes.post('/analyze-complaint', analyzeComplaintHandler);

export default aiRoutes;

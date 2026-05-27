import express from 'express';
import { initiatePayment } from '../controllers/controller.payment.js';
import { verifyToken } from '../middleware/middleware.auth.js';

const router = express.Router();

// A user must be logged in to buy a course
router.post('/initiate', verifyToken, initiatePayment);

export default router;
import express from 'express';
import { initiatePayment, verifyPayment, handleWebhook } from '../controllers/controller.payment.js';
import { verifyToken } from '../middleware/middleware.auth.js';

const router = express.Router();

// User must be logged in to buy a course
router.post('/initiate', verifyToken, initiatePayment);

// Frontend calls this after PhonePe redirects the user back
// to confirm payment and trigger enrollment
router.get('/verify/:transactionId', verifyToken, verifyPayment);

// PhonePe's server-to-server webhook — no JWT, verified via X-VERIFY header
router.post('/webhook', handleWebhook);

export default router;
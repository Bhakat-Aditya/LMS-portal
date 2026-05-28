import express from 'express';
import { getChapterQuiz, submitQuiz, getMyQuizResult } from '../controllers/controller.quiz.js';
import { verifyToken } from '../middleware/middleware.auth.js';

const router = express.Router();

// Get quiz questions for a chapter (auth required — enrolled students + teachers)
router.get('/:chapterId', verifyToken, getChapterQuiz);

// Student submits answers
router.post('/:chapterId/submit', verifyToken, submitQuiz);

// Student checks their own result
router.get('/:chapterId/my-result', verifyToken, getMyQuizResult);

export default router;

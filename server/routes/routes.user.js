import express from 'express';
import { registerUser, loginUser, getProfile, getAllStudents } from '../controllers/controller.user.js';
import { verifyToken, isTeacher } from '../middleware/middleware.auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected: returns fresh user data (including purchasedCourses) for post-payment refresh
router.get('/profile', verifyToken, getProfile);

// Protected: returns all students and their quiz metrics (Teacher Only)
router.get('/all-students', verifyToken, isTeacher, getAllStudents);

export default router;
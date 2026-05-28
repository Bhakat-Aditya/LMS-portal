import express from 'express';
import {
    createCourse,
    addChapter,
    addQuizToChapter,
    getAllCourses,
    getCourseDetails,
    getTeacherCourses,
    togglePublishCourse,
    toggleChapterVisibility,
    getEnrolledStudents,
    getChaptersByCourse
} from '../controllers/controller.course.js';
import { verifyToken, isTeacher } from '../middleware/middleware.auth.js';
import { optionalVerifyToken } from '../middleware/middleware.optionalAuth.js';

const router = express.Router();

// ── Public routes ─────────────────────────────────
router.get('/', getAllCourses);

// ── Teacher-only static paths (must come BEFORE /:courseId) ──
router.get('/teacher/my-courses', verifyToken, isTeacher, getTeacherCourses);
router.post('/', verifyToken, isTeacher, createCourse);
// Note: chapters/:chapterId routes — use 'chapters' prefix so they don't clash with /:courseId
router.post('/chapters/:chapterId/quiz', verifyToken, isTeacher, addQuizToChapter);
router.patch('/chapters/:chapterId/visibility', verifyToken, isTeacher, toggleChapterVisibility);

// ── Dynamic /:courseId routes ─────────────────────
// optionalVerifyToken lets teachers see hidden chapters on the course detail page
router.get('/:courseId', optionalVerifyToken, getCourseDetails);
router.post('/:courseId/chapters', verifyToken, isTeacher, addChapter);
router.patch('/:courseId/publish', verifyToken, isTeacher, togglePublishCourse);
router.get('/:courseId/students', verifyToken, isTeacher, getEnrolledStudents);
router.get('/:courseId/chapters-list', verifyToken, isTeacher, getChaptersByCourse);

export default router;
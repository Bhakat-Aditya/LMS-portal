import express from 'express';
import { createCourse, addChapter, addQuizToChapter, getAllCourses, getCourseDetails } from '../controllers/controller.course.js';
import { verifyToken, isTeacher } from '../middleware/middleware.auth.js';

const router = express.Router();

router.get('/', getAllCourses);

router.get('/:courseId', getCourseDetails);

router.post('/', verifyToken, isTeacher, createCourse);

router.post('/:courseId/chapters', verifyToken, isTeacher, addChapter);

router.post('/chapters/:chapterId/quiz', verifyToken, isTeacher, addQuizToChapter);

export default router;
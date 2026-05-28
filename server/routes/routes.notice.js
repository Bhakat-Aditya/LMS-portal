import express from 'express';
import { 
    getNotices, 
    createNotice, 
    deleteNotice, 
    votePoll, 
    addComment, 
    deleteComment,
    addReply,
    deleteReply
} from '../controllers/controller.notice.js';
import { verifyToken, isTeacher } from '../middleware/middleware.auth.js';

const router = express.Router();

// Get all notices (all authenticated users can read)
router.get('/', verifyToken, getNotices);

// Create a notice (teachers only)
router.post('/', verifyToken, isTeacher, createNotice);

// Delete a notice (teachers only)
router.delete('/:id', verifyToken, isTeacher, deleteNotice);

// Vote in a poll notice (all authenticated users)
router.post('/:id/vote', verifyToken, votePoll);

// Comment on a notice (all authenticated users)
router.post('/:id/comment', verifyToken, addComment);

// Delete a comment (teachers only for moderation)
router.delete('/:id/comment/:commentId', verifyToken, isTeacher, deleteComment);

// Add a reply to a comment (all authenticated users)
router.post('/:id/comment/:commentId/reply', verifyToken, addReply);

// Delete a reply (teachers only for moderation)
router.delete('/:id/comment/:commentId/reply/:replyId', verifyToken, isTeacher, deleteReply);

export default router;

import Notice from '../models/models.notice.js';
import User from '../models/models.user.js';

// GET all notices
export const getNotices = async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.status(200).json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notices', error: error.message });
    }
};

// CREATE a notice
export const createNotice = async (req, res) => {
    try {
        const { title, content, type, imageUrl, pollQuestion, pollOptions } = req.body;

        // Find teacher info
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Teacher profile not found' });
        }

        const noticeData = {
            title,
            content,
            type: type || 'text',
            imageUrl: imageUrl || '',
            author: req.userId,
            authorName: user.name,
            comments: []
        };

        if (type === 'poll') {
            if (!pollQuestion) {
                return res.status(400).json({ message: 'Poll question is required for poll type' });
            }
            if (!Array.isArray(pollOptions) || pollOptions.length < 2) {
                return res.status(400).json({ message: 'At least 2 poll options are required' });
            }

            noticeData.poll = {
                question: pollQuestion,
                options: pollOptions.map(opt => ({
                    optionText: opt,
                    votes: []
                }))
            };
        }

        const newNotice = await Notice.create(noticeData);
        res.status(201).json(newNotice);
    } catch (error) {
        res.status(500).json({ message: 'Error creating notice', error: error.message });
    }
};

// DELETE a notice
export const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const notice = await Notice.findById(id);
        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        await Notice.findByIdAndDelete(id);
        res.status(200).json({ message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting notice', error: error.message });
    }
};

// VOTE in a poll
export const votePoll = async (req, res) => {
    try {
        const { id } = req.params;
        const { optionId } = req.body;

        // Teachers are not allowed to vote in polls
        if (req.userRole === 'teacher') {
            return res.status(403).json({ message: 'Teachers are not allowed to vote in polls.' });
        }

        const notice = await Notice.findById(id);
        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        if (notice.type !== 'poll' || !notice.poll) {
            return res.status(400).json({ message: 'This notice does not contain a poll' });
        }

        // Check if user has already voted for any option in this poll
        const alreadyVoted = notice.poll.options.some(opt =>
            opt.votes.some(voteId => voteId.toString() === req.userId.toString())
        );

        if (alreadyVoted) {
            return res.status(400).json({ message: 'You have already voted in this poll' });
        }

        // Find option and add vote
        const option = notice.poll.options.id(optionId);
        if (!option) {
            return res.status(404).json({ message: 'Option not found' });
        }

        option.votes.push(req.userId);
        await notice.save();

        res.status(200).json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Error voting in poll', error: error.message });
    }
};

// ADD comment
export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { commentText } = req.body;

        if (!commentText || commentText.trim() === '') {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        const notice = await Notice.findById(id);
        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        notice.comments.push({
            userId: req.userId,
            userName: user.name,
            userRole: user.role,
            commentText: commentText.trim()
        });

        await notice.save();
        res.status(200).json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

// DELETE comment (Teacher only)
export const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;

        const notice = await Notice.findById(id);
        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        const comment = notice.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        notice.comments.pull(commentId);
        await notice.save();

        res.status(200).json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment', error: error.message });
    }
};

// ADD reply to comment
export const addReply = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { replyText } = req.body;

        if (!replyText || replyText.trim() === '') {
            return res.status(400).json({ message: 'Reply text is required' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        const notice = await Notice.findById(id);
        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        const comment = notice.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        comment.replies.push({
            userId: req.userId,
            userName: user.name,
            userRole: user.role,
            replyText: replyText.trim()
        });

        await notice.save();
        res.status(200).json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Error adding reply', error: error.message });
    }
};

// DELETE reply (Teacher only)
export const deleteReply = async (req, res) => {
    try {
        const { id, commentId, replyId } = req.params;

        const notice = await Notice.findById(id);
        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        const comment = notice.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const reply = comment.replies.id(replyId);
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }

        comment.replies.pull(replyId);
        await notice.save();

        res.status(200).json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting reply', error: error.message });
    }
};

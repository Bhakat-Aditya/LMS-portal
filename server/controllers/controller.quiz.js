import Chapter from '../models/models.chapter.js';
import QuizResult from '../models/models.quizresult.js';
import Course from '../models/models.course.js';

// ─────────────────────────────────────────────────────
// GET /api/quiz/:chapterId
// Returns the quiz questions for a chapter.
// Students get questions WITHOUT the correctAnswerIndex (no cheating).
// Teachers get the full data including the correct answer.
// ─────────────────────────────────────────────────────
export const getChapterQuiz = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const isTeacher = req.userRole === 'teacher';

        const chapter = await Chapter.findById(chapterId).select('quiz title courseId');
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        // Sanitize quiz for students — hide the correct answer
        const quiz = chapter.quiz.map((q) => ({
            _id: q._id,
            question: q.question,
            options: q.options,
            // Only expose correctAnswerIndex to teachers
            ...(isTeacher ? { correctAnswerIndex: q.correctAnswerIndex } : {})
        }));

        res.status(200).json({ chapterId, quiz });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// POST /api/quiz/:chapterId/submit
// Student submits their answers. Scores and saves result.
// Requires: verifyToken
// Body: { answers: [0, 2, 1, ...] } — index of chosen option per question
// ─────────────────────────────────────────────────────
export const submitQuiz = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const { answers } = req.body; // array of chosen option indices
        const studentId = req.userId;

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        if (!chapter.quiz || chapter.quiz.length === 0) {
            return res.status(400).json({ message: 'No quiz found for this chapter' });
        }

        if (!Array.isArray(answers) || answers.length !== chapter.quiz.length) {
            return res.status(400).json({ message: 'Answers array length must match number of questions' });
        }

        // Calculate score
        let score = 0;
        const breakdown = chapter.quiz.map((q, i) => {
            const isCorrect = answers[i] === q.correctAnswerIndex;
            if (isCorrect) score++;
            return {
                question: q.question,
                chosen: answers[i],
                correct: q.correctAnswerIndex,
                isCorrect
            };
        });

        const totalQuestions = chapter.quiz.length;

        // Upsert: if student retakes, overwrite previous result
        await QuizResult.findOneAndUpdate(
            { studentId, chapterId },
            { studentId, chapterId, score, totalQuestions },
            { upsert: true, new: true }
        );

        res.status(200).json({
            message: 'Quiz submitted!',
            score,
            totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100),
            breakdown
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// GET /api/quiz/:chapterId/my-result
// Returns the logged-in student's quiz result for this chapter.
// ─────────────────────────────────────────────────────
export const getMyQuizResult = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const result = await QuizResult.findOne({ studentId: req.userId, chapterId });
        if (!result) {
            return res.status(200).json({ attempted: false });
        }
        res.status(200).json({
            attempted: true,
            score: result.score,
            totalQuestions: result.totalQuestions,
            percentage: Math.round((result.score / result.totalQuestions) * 100)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching result', error: error.message });
    }
};

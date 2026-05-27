import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chapterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
        required: true
    },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('QuizResult', quizResultSchema);
import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    youtubeVideoId: { type: String },
    videoUrl: { type: String },
    isVisible: { type: Boolean, default: true }, // Teacher can hide from students


    pdfMaterials: [{
        title: { type: String },
        fileUrl: { type: String }
    }],

    quiz: [{
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswerIndex: { type: Number, required: true }
    }]
}, { timestamps: true });

export default mongoose.model('Chapter', chapterSchema);
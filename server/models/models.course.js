import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notices: [{
        message: { type: String, required: true },
        postedAt: { type: Date, default: Date.now }
    }],
    thumbnailUrl: { type: String, default: '' },
    isPublished: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
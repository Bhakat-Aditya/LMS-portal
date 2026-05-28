import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'poll'],
        default: 'text'
    },
    imageUrl: {
        type: String,
        default: ''
    },
    poll: {
        question: { type: String, default: '' },
        options: [{
            optionText: { type: String, required: true },
            votes: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }]
        }]
    },
    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        userRole: {
            type: String,
            default: 'student'
        },
        commentText: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        replies: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            userName: {
                type: String,
                required: true
            },
            userRole: {
                type: String,
                required: true
            },
            replyText: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorName: {
        type: String,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Notice', noticeSchema);

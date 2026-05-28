import mongoose from 'mongoose';

// Temporary record created when a payment is initiated.
// It maps a PhonePe merchantOrderId back to the userId and courseId
// so we know who to enroll when PhonePe calls the webhook or the
// user lands on the payment-status redirect page.
const pendingTransactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    }
}, { timestamps: true });

export default mongoose.model('PendingTransaction', pendingTransactionSchema);

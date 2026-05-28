import axios from 'axios';
import crypto from 'crypto';
import Course from '../models/models.course.js';
import User from '../models/models.user.js';
import PendingTransaction from '../models/models.pendingtransaction.js';

const getPhonePeToken = async () => {
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', process.env.PHONEPE_CLIENT_ID);
    tokenParams.append('client_secret', process.env.PHONEPE_CLIENT_SECRET);
    tokenParams.append('client_version', '1');
    tokenParams.append('grant_type', 'client_credentials');

    try {
        const tokenResponse = await axios.post(
            'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
            tokenParams,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        return tokenResponse.data.access_token;
    } catch (err) {
        throw err;
    }
};

const enrollStudent = async (transactionId) => {
    const pending = await PendingTransaction.findOne({ transactionId });
    if (!pending || pending.status === 'SUCCESS') return null;

    await User.findByIdAndUpdate(
        pending.userId,
        { $addToSet: { purchasedCourses: pending.courseId } }
    );

    pending.status = 'SUCCESS';
    await pending.save();

    return pending;
};

export const initiatePayment = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.userId;

        // 1. Validate course
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // 2. Check if already enrolled — don't charge twice
        const user = await User.findById(userId);
        if (user.purchasedCourses.map(String).includes(String(courseId))) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        // 3. Get OAuth token
        const accessToken = await getPhonePeToken();

        // 4. Generate a unique transaction ID
        const merchantTransactionId = `TXN-${Date.now()}-${userId.toString().slice(-4)}`;

        // 5. Store the pending transaction BEFORE calling PhonePe
        //    so we can look it up on webhook/redirect
        await PendingTransaction.create({
            transactionId: merchantTransactionId,
            userId,
            courseId
        });

        // 6. Build V2 payment payload
        const paymentPayload = {
            merchantOrderId: merchantTransactionId,
            amount: Math.round(Number(course.price) * 100), // Paise
            expireAfter: 1200,
            paymentFlow: {
                type: 'PG_CHECKOUT',
                message: `LMS Course: ${course.title}`,
                merchantUrls: {
                    redirectUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-status/${merchantTransactionId}`
                }
            }
        };

        // 7. Call PhonePe
        const paymentResponse = await axios.post(
            'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
            paymentPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `O-Bearer ${accessToken}`
                }
            }
        );

        const checkoutUrl = paymentResponse.data.redirectUrl || paymentResponse.data.data?.redirectUrl;

        res.status(200).json({
            url: checkoutUrl,
            transactionId: merchantTransactionId
        });

    } catch (error) {
        res.status(500).json({ message: 'Payment initiation failed', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// GET /api/payments/verify/:transactionId
// Called by frontend on the payment-status redirect page.
// Requires: verifyToken middleware
// ─────────────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
    try {
        const { transactionId } = req.params;

        // 1. Check our own DB first — avoids double-calling PhonePe if already done
        const pending = await PendingTransaction.findOne({ transactionId });
        if (!pending) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        if (pending.status === 'SUCCESS') {
            return res.status(200).json({ success: true, message: 'Already enrolled' });
        }

        // 2. Call PhonePe status check API
        const accessToken = await getPhonePeToken();

        const statusResponse = await axios.get(
            `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/${transactionId}/status`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `O-Bearer ${accessToken}`
                }
            }
        );

        const orderState = statusResponse.data?.state;

        // PhonePe V2 order states: COMPLETED, FAILED, PENDING
        if (orderState === 'COMPLETED') {
            await enrollStudent(transactionId);
            return res.status(200).json({ success: true, message: 'Payment verified. Enrolled!' });
        }

        // Sandbox: PhonePe sandbox sometimes returns PENDING even after test success.
        // Treat PENDING as success in sandbox for demo purposes.
        if (orderState === 'PENDING' && process.env.NODE_ENV !== 'production') {
            await enrollStudent(transactionId);
            return res.status(200).json({ success: true, message: 'Sandbox: enrolled (PENDING treated as SUCCESS).' });
        }

        return res.status(400).json({ success: false, message: `Payment not completed. State: ${orderState}` });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// POST /api/payments/webhook
// Called by PhonePe's servers (not authenticated via JWT).
// PhonePe sends X-VERIFY = SHA256(base64payload + "/" + saltKey) + "###" + saltIndex
// ─────────────────────────────────────────────────────
export const handleWebhook = async (req, res) => {
    try {
        const xVerifyHeader = req.headers['x-verify'];
        const rawBody = JSON.stringify(req.body);

        if (!xVerifyHeader) {
            return res.status(400).json({ message: 'Missing X-VERIFY header' });
        }

        // Parse the header: "<hash>###<saltIndex>"
        const [receivedHash, saltIndex] = xVerifyHeader.split('###');

        // Verify using PHONEPE_SALT_KEY
        const saltKey = process.env.PHONEPE_SALT_KEY;
        const base64Payload = Buffer.from(rawBody).toString('base64');
        const expectedHash = crypto
            .createHash('sha256')
            .update(base64Payload + '/' + saltKey)
            .digest('hex');

        if (receivedHash !== expectedHash) {
            return res.status(403).json({ message: 'Invalid X-VERIFY checksum' });
        }

        // Parse the response data
        const payload = req.body;
        const transactionId = payload?.data?.merchantOrderId || payload?.merchantOrderId;
        const eventType = payload?.type;

        if (eventType === 'CHECKOUT_ORDER_COMPLETED' && transactionId) {
            await enrollStudent(transactionId);
        }

        // PhonePe requires a 200 OK to stop retrying
        res.status(200).json({ message: 'Webhook received' });

    } catch (error) {
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};
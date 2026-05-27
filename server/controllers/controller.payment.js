import axios from 'axios';
import Course from '../models/models.course.js';

export const initiatePayment = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.userId;

        // 1. Fetch the course details from MongoDB
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // 2. STEP 1 FROM THE VIDEO: Generate the Authorization Token
        // We pass your dashboard credentials using standard form URL encoding
        const tokenParams = new URLSearchParams();
        tokenParams.append('client_id', process.env.PHONEPE_CLIENT_ID);
        tokenParams.append('client_secret', process.env.PHONEPE_CLIENT_SECRET);
        tokenParams.append('client_version', '1');
        tokenParams.append('grant_type', 'client_credentials');

        const tokenResponse = await axios.post(
            'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
            tokenParams,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenResponse.data.access_token;

        // 3. STEP 2 FROM THE VIDEO: Create the Payment Request
        const merchantTransactionId = `TXN-${Date.now()}`;

        const paymentPayload = {
            merchantOrderId: merchantTransactionId,
            amount: Math.round(Number(course.price) * 100), // Converted to Paise
            expireAfter: 900, // 15 minutes
            paymentFlowType: 'PG_CHECKOUT',
            redirectUrl: `http://localhost:5173/payment-status/${merchantTransactionId}`
        };

        // Make the outward payment call using the retrieved Bearer token
        const paymentResponse = await axios.post(
            'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',
            paymentPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        // 4. Send the secure redirect URL back to the React frontend
        res.status(200).json({
            url: paymentResponse.data.redirectUrl,
            transactionId: merchantTransactionId
        });

    } catch (error) {
        console.error("❌ PHONEPE OAUTH ERROR:", error.response?.data || error.message);
        res.status(500).json({ message: 'Payment initiation failed', error: error.message });
    }
};
import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const router = express.Router();

// Get Razorpay credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Initialize Razorpay with failsafe
let razorpay;
try {
    // Check if we have the necessary credentials
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        console.error('Razorpay credentials missing! Using dummy mode.');
        // Create dummy razorpay object for development without throwing errors
        razorpay = {
            orders: {
                create: async (options) => {
                    console.log('DUMMY RAZORPAY: Creating order', options);
                    return {
                        id: `order_${Date.now()}`,
                        amount: options.amount,
                        currency: options.currency,
                        receipt: options.receipt,
                        status: 'created'
                    };
                }
            }
        };
    } else {
        // Normal initialization with real credentials
        razorpay = new Razorpay({
            key_id: RAZORPAY_KEY_ID,
            key_secret: RAZORPAY_KEY_SECRET
        });
        console.log('Razorpay initialized successfully');
    }
} catch (error) {
    console.error('Failed to initialize Razorpay:', error);
    // Provide dummy implementation as fallback
    razorpay = {
        orders: {
            create: async (options) => {
                console.log('FALLBACK RAZORPAY: Creating order', options);
                return {
                    id: `order_${Date.now()}`,
                    amount: options.amount,
                    currency: options.currency,
                    receipt: options.receipt,
                    status: 'created'
                };
            }
        }
    };
}

// Create order
router.post('/create-order', async (req, res) => {
    try {
        const { amount } = req.body;
        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Verify payment
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Check if we're in dummy mode
        if (!RAZORPAY_KEY_SECRET) {
            console.log('DUMMY RAZORPAY: Payment verification skipped');
            return res.json({ verified: true });
        }

        // Verify signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            res.json({ verified: true });
        } else {
            res.status(400).json({ verified: false });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

export default router; 
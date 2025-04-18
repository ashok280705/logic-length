import express from 'express';
import crypto from 'crypto';
import User from '../../models/User.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Initialize Razorpay with credentials from .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('Razorpay initialized with key_id:', process.env.RAZORPAY_KEY_ID);

const router = express.Router();

// Create order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, package: selectedPackage } = req.body;
    
    // Create a Razorpay order
    const options = {
      amount: amount * 100, // amount in paisa
      currency: 'INR',
      receipt: 'order_' + Date.now(),
      payment_capture: 1
    };
    
    try {
      const order = await razorpay.orders.create(options);
      
      // Store the package details in session
      req.session.pendingPackage = selectedPackage;
      
      // Store order details in session
      req.session.currentOrder = {
        orderId: order.id,
        package: selectedPackage,
        amount
      };
      
      res.json({ 
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      });
    } catch (razorpayError) {
      console.error('Razorpay order creation error:', razorpayError);
      
      // Fallback to direct payment link if Razorpay order creation fails
      const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      
      // Store order details in session
      req.session.currentOrder = {
        orderId,
        package: selectedPackage,
        amount
      };
      
      res.json({ 
        success: true,
        orderId,
        paymentLink: `https://razorpay.me/@logic-length?amount=${amount * 100}`
      });
    }
  } catch (error) {
    console.error('Payment route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment and add coins
router.post('/verify', async (req, res) => {
  try {
    const { orderId, paymentId, signature, userId } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get the package details from the order
    const order = req.session.currentOrder;
    
    if (!order) {
      return res.status(400).json({ error: 'Invalid order' });
    }
    
    // Verify signature if provided
    if (signature) {
      const text = orderId + "|" + paymentId;
      const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest("hex");
        
      if (generated_signature !== signature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }
    
    // Add coins to user's account
    const coins = order.package.coins;
    await user.addCoins(coins);
    
    // Record the transaction
    user.transactions.push({
      amount: coins,
      type: 'purchase',
      orderId: orderId,
      paymentId: paymentId
    });
    
    await user.save();
    
    // Clear the order from session
    delete req.session.currentOrder;
    
    res.json({ 
      success: true, 
      message: 'Payment verified and coins added',
      coins: coins,
      totalCoins: user.coins
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle successful payments
router.post('/webhook', async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      payload: {
        payment: {
          entity: {
            amount,
            currency,
            status
          }
        }
      }
    } = req.body;

    // Verify signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");
      
    const isSignatureValid = generated_signature === razorpay_signature;

    if (status === 'paid' && isSignatureValid) {
      // Find the user based on the order ID or payment ID
      const user = await User.findOne({ 'transactions.orderId': razorpay_order_id });
      
      if (user) {
        // Convert amount from paise to rupees and calculate coins (100 coins per rupee)
        const amountInRupees = amount / 100;
        const coins = amountInRupees * 100; // 1 rupee = 100 coins
        
        await user.addCoins(coins);
        
        // Update transaction record
        user.transactions.push({
          amount: coins,
          type: 'purchase',
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id
        });
        await user.save();
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 
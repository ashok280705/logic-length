import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  coins: {
    type: Number,
    default: 0
  },
  googleId: {
    type: String,
    required: false,
    sparse: true
  },
  photoURL: {
    type: String,
    required: false
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  transactions: [{
    amount: Number,
    type: String, // 'purchase' or 'spend'
    orderId: String,
    paymentId: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    if (this.isModified('password')) {
      console.log('Hashing password for user:', this.username);
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      console.log('Password hashed successfully');
    }
    next();
  } catch (error) {
    console.error('Error hashing password:', error.message);
    next(error);
  }
});

// Method to add coins
userSchema.methods.addCoins = async function(amount) {
  this.coins += amount;
  await this.save();
};

// Method to spend coins
userSchema.methods.spendCoins = async function(amount) {
  if (this.coins >= amount) {
    this.coins -= amount;
    this.transactions.push({
      amount,
      type: 'spend'
    });
    await this.save();
    return true;
  }
  return false;
};

export default mongoose.model('User', userSchema); 
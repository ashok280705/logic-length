import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    validate: {
      validator: function(v) {
        // Only allow alphanumeric characters and underscores
        return /^[a-zA-Z0-9_]+$/.test(v);
      },
      message: props => `${props.value} is not a valid username. Use only letters, numbers, and underscores`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return v === '' || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address`
    }
  },
  coins: {
    type: Number,
    default: 50 // Start with 50 coins for new users
  },
  googleId: {
    type: String,
    sparse: true,
    index: true
  },
  photoURL: {
    type: String
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  transactions: {
    type: [{
      amount: {
        type: Number,
        required: true
      },
      type: {
        type: String,
        required: true
      },
      orderId: {
        type: String,
        required: true
      },
      paymentId: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now,
        required: true
      }
    }],
    default: [] // Initialize as empty array by default
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
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

// Method to verify password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add coins
userSchema.methods.addCoins = async function(amount) {
  this.coins += amount;
  await this.save();
  return this.coins;
};

// Method to spend coins
userSchema.methods.spendCoins = async function(amount) {
  if (this.coins >= amount) {
    this.coins -= amount;
    this.transactions.push({
      amount,
      type: 'spend',
      date: new Date()
    });
    await this.save();
    return true;
  }
  return false;
};

export default mongoose.model('User', userSchema); 
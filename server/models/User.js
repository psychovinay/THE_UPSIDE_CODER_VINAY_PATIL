const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  pin: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'worker', 'admin'], 
    required: true 
  },
  city: String,
  pincode: String,
  avatarColor: { type: String, default: 'bg-slate-500' },
  initials: String,
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { discriminatorKey: 'role' });

// Hash PIN before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('pin')) return next();
  this.pin = await bcrypt.hash(this.pin, 10);
  next();
});

// Method to compare PIN
userSchema.methods.comparePin = async function(candidatePin) {
  return await bcrypt.compare(candidatePin, this.pin);
};

const User = mongoose.model('User', userSchema);

// Customer discriminator
const Customer = User.discriminator('customer', new mongoose.Schema({
  savedWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  totalBookings: { type: Number, default: 0 },
}));

// Worker discriminator
const Worker = User.discriminator('worker', new mongoose.Schema({
  skills: [String],
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  hourlyRate: Number,
  fixedRate: Number,
  available: { type: Boolean, default: true },
  aadhaarVerified: { type: Boolean, default: false },
  aadhaarNumber: String,
  experience: String,
  completedJobs: { type: Number, default: 0 },
  bio: String,
  languages: [String],
  workingHours: String,
  location: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  walletBalance: { type: Number, default: 0 },
  // Worker-first matching settings
  serviceRadius: { type: Number, default: 5 }, // in km
  minimumRate: { type: Number, default: 200 },
  availableDays: [{ type: String }], // ['monday', 'tuesday', etc.]
  availableTimeStart: String, // '9:00 AM'
  availableTimeEnd: String, // '6:00 PM'
  kaamScore: { type: Number, default: 0 },
  onTimeRate: { type: Number, default: 0 },
  repeatCustomerRate: { type: Number, default: 0 },
}));

// Admin discriminator
const Admin = User.discriminator('admin', new mongoose.Schema({}));

module.exports = { User, Customer, Worker, Admin };

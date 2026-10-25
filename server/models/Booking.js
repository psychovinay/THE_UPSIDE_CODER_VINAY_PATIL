const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  address: { type: String, required: true },
  pincode: { type: String, required: true },
  budget: { type: Number, required: true },
  amount: { type: Number },
  requestCode: { type: String, required: true },
  arrivalOTP: { type: String },
  completionOTP: { type: String },
  notes: String,
  rating: { type: Number, min: 1, max: 5 },
  review: String,
  cancelReason: String,
  disputeReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
Booking.Booking = Booking;
module.exports = Booking;

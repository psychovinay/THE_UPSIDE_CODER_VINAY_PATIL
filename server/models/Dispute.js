const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  issue: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'rejected'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  resolution: String,
  refundAmount: Number,
  adminNotes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

disputeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Dispute = mongoose.model('Dispute', disputeSchema);
Dispute.Dispute = Dispute;
module.exports = Dispute;

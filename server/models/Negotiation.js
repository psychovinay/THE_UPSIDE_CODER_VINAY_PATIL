const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offers: [{
    party: {
      type: String,
      enum: ['customer', 'worker'],
      required: true
    },
    amount: { type: Number, required: true },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  finalAmount: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

negotiationSchema.index({ jobId: 1, workerId: 1 });
negotiationSchema.index({ workerId: 1, status: 1 });

const Negotiation = mongoose.model('Negotiation', negotiationSchema);
Negotiation.Negotiation = Negotiation;
module.exports = Negotiation;

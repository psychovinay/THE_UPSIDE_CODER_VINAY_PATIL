const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['credit', 'debit', 'withdrawal'],
    required: true
  },
  amount: { type: Number, required: true },
  description: String,
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  balance: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);

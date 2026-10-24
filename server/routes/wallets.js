const express = require('express');
const { WalletTransaction } = require('../models/Wallet');
const { Worker } = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get wallet balance
router.get('/balance', auth, authorize('worker'), async (req, res) => {
  try {
    const worker = await Worker.findById(req.user._id);
    res.json({ balance: worker.walletBalance || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get transaction history
router.get('/transactions', auth, authorize('worker'), async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add funds (credit)
router.post('/credit', auth, authorize('worker'), async (req, res) => {
  try {
    const { amount, description, bookingId } = req.body;

    const worker = await Worker.findById(req.user._id);
    worker.walletBalance = (worker.walletBalance || 0) + amount;
    await worker.save();

    const transaction = new WalletTransaction({
      userId: req.user._id,
      type: 'credit',
      amount,
      description,
      bookingId,
      balance: worker.walletBalance
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Withdraw funds
router.post('/withdraw', auth, authorize('worker'), async (req, res) => {
  try {
    const { amount, description } = req.body;

    const worker = await Worker.findById(req.user._id);
    if ((worker.walletBalance || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    worker.walletBalance -= amount;
    await worker.save();

    const transaction = new WalletTransaction({
      userId: req.user._id,
      type: 'withdrawal',
      amount,
      description: description || 'Withdrawal to bank account',
      balance: worker.walletBalance
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

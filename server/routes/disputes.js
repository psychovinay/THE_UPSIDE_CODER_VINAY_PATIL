const express = require('express');
const { Dispute } = require('../models/Dispute');
const { Booking } = require('../models/Booking');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Create dispute
router.post('/', auth, authorize('customer'), async (req, res) => {
  try {
    const { bookingId, issue } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const dispute = new Dispute({
      bookingId,
      customerId: req.user._id,
      workerId: booking.workerId,
      issue,
      status: 'open'
    });

    await dispute.save();

    // Update booking status
    booking.status = 'disputed';
    await booking.save();

    res.status(201).json(dispute);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all disputes (admin)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const disputes = await Dispute.find(filter)
      .populate('bookingId', 'date amount')
      .populate('customerId', 'name phone')
      .populate('workerId', 'name phone')
      .sort({ createdAt: -1 });

    res.json(disputes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dispute by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('bookingId')
      .populate('customerId', 'name phone')
      .populate('workerId', 'name phone');

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    // Authorization check
    if (req.user.role === 'customer' && dispute.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.user.role === 'worker' && dispute.workerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(dispute);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update dispute status (admin)
router.patch('/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, resolution, refundAmount } = req.body;

    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status, resolution, refundAmount },
      { new: true }
    );

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    // If resolved and refund approved, process refund
    if (status === 'resolved' && refundAmount) {
      const booking = await Booking.findById(dispute.bookingId);
      if (booking) {
        booking.status = 'completed';
        booking.amount = refundAmount;
        await booking.save();
      }
    }

    res.json(dispute);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

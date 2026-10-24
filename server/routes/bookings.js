const express = require('express');
const { Booking } = require('../models/Booking');
const { Worker } = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Generate random 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate random 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Create new booking
router.post('/', auth, authorize('customer'), async (req, res) => {
  try {
    const { workerId, serviceId, date, time, address, pincode, budget, notes } = req.body;

    const booking = new Booking({
      customerId: req.user._id,
      workerId,
      serviceId,
      date,
      time,
      address,
      pincode,
      budget,
      notes,
      requestCode: generateCode(),
      arrivalOTP: generateOTP(),
      completionOTP: generateOTP(),
      status: 'pending'
    });

    await booking.save();

    // Notify worker via socket
    const io = req.app.get('io');
    io.to(`worker-${workerId}`).emit('new-booking', booking);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name phone')
      .populate('workerId', 'name phone rating')
      .populate('serviceId', 'name');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    if (req.user.role === 'customer' && booking.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.user.role === 'worker' && booking.workerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept booking (worker only)
router.patch('/:id/accept', auth, authorize('worker'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking cannot be accepted' });
    }

    booking.status = 'accepted';
    await booking.save();

    // Notify customer
    const io = req.app.get('io');
    io.to(`customer-${booking.customerId}`).emit('booking-accepted', booking);

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Authorization check
    if (req.user.role === 'customer' && booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.user.role === 'worker' && booking.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();

    // Notify the other party
    const io = req.app.get('io');
    if (req.user.role === 'worker') {
      io.to(`customer-${booking.customerId}`).emit('booking-updated', booking);
    } else {
      io.to(`worker-${booking.workerId}`).emit('booking-updated', booking);
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify arrival OTP
router.post('/:id/verify-arrival', auth, authorize('customer'), async (req, res) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (booking.arrivalOTP !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    booking.status = 'arrived';
    await booking.save();

    const io = req.app.get('io');
    io.to(`worker-${booking.workerId}`).emit('arrival-verified', booking);

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify completion OTP
router.post('/:id/verify-completion', auth, authorize('worker'), async (req, res) => {
  try {
    const { otp, amount } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (booking.completionOTP !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    booking.status = 'completed';
    booking.amount = amount || booking.budget;
    await booking.save();

    // Update worker's completed jobs count
    const worker = await Worker.findById(booking.workerId);
    worker.completedJobs += 1;
    await worker.save();

    const io = req.app.get('io');
    io.to(`customer-${booking.customerId}`).emit('completion-verified', booking);

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel booking
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Authorization check
    if (req.user.role === 'customer' && booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.user.role === 'worker' && booking.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    booking.status = 'cancelled';
    booking.cancelReason = reason;
    await booking.save();

    // Notify the other party
    const io = req.app.get('io');
    if (req.user.role === 'worker') {
      io.to(`customer-${booking.customerId}`).emit('booking-cancelled', booking);
    } else {
      io.to(`worker-${booking.workerId}`).emit('booking-cancelled', booking);
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add rating and review
router.post('/:id/review', auth, authorize('customer'), async (req, res) => {
  try {
    const { rating, review } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Booking must be completed to review' });
    }

    booking.rating = rating;
    booking.review = review;
    await booking.save();

    // Update worker's average rating
    const worker = await Worker.findById(booking.workerId);
    const Review = require('../models/Review');
    const reviews = await Review.find({ workerId: booking.workerId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0) + rating;
    worker.rating = (totalRating / (reviews.length + 1)).toFixed(1);
    worker.reviewCount = reviews.length + 1;
    await worker.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

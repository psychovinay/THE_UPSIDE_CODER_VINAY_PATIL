const express = require('express');
const { User, Worker } = require('../models/User');
const { Booking } = require('../models/Booking');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get admin dashboard stats
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const totalWorkers = await Worker.countDocuments();
    const activeWorkers = await Worker.countDocuments({ available: true });
    const pendingVerification = await Worker.countDocuments({ aadhaarVerified: false });
    
    const Customer = require('../models/User').Customer;
    const totalCustomers = await Customer.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingsToday = await Booking.countDocuments({ createdAt: { $gte: today } });
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const bookingsThisMonth = await Booking.countDocuments({ createdAt: { $gte: thisMonth } });
    
    const Dispute = require('../models/Dispute');
    const openDisputes = await Dispute.countDocuments({ status: { $in: ['open', 'under_review'] } });

    const completedBookings = await Booking.find({ status: 'completed' });
    const avgRating = completedBookings.length > 0
      ? (completedBookings.reduce((sum, b) => sum + (b.rating || 0), 0) / completedBookings.length).toFixed(1)
      : 0;

    res.json({
      totalWorkers,
      activeWorkers,
      pendingVerification,
      totalCustomers,
      bookingsToday,
      bookingsThisMonth,
      openDisputes,
      avgRating
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all workers for moderation
router.get('/workers', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status === 'pending') {
      filter.aadhaarVerified = false;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const workers = await Worker.find(filter)
      .populate('serviceId', 'name')
      .select('-pin')
      .sort({ createdAt: -1 });

    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve worker
router.patch('/workers/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { aadhaarVerified: true },
      { new: true }
    ).select('-pin');

    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject/suspend worker
router.patch('/workers/:id/suspend', auth, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-pin');

    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent activity
router.get('/activity', auth, authorize('admin'), async (req, res) => {
  try {
    const recentBookings = await Booking.find()
      .populate('customerId', 'name')
      .populate('workerId', 'name')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(recentBookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

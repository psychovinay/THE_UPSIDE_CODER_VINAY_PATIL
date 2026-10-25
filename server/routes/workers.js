const express = require('express');
const { Worker } = require('../models/User');
const { Service } = require('../models/Service');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all workers with filters
router.get('/', async (req, res) => {
  try {
    const { serviceId, pincode, radius, available } = req.query;
    const filter = {};

    if (available !== undefined) filter.available = available === 'true';

    let workers = await Worker.find(filter)
      .populate('serviceId')
      .select('-pin');

    // Filter by serviceId (match by service _id)
    if (serviceId) {
      workers = workers.filter(w => w.serviceId && w.serviceId._id.toString() === serviceId);
    }

    // Filter by pincode/radius (simplified - in production use geospatial queries)
    if (pincode) {
      workers = workers.filter(w => w.pincode === pincode);
    }

    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get worker by ID
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('serviceId')
      .select('-pin');
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update worker profile
router.put('/:id', auth, authorize('worker'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-pin');

    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle availability
router.patch('/:id/availability', auth, authorize('worker'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const worker = await Worker.findById(req.params.id);
    worker.available = !worker.available;
    await worker.save();

    res.json({ available: worker.available });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get worker's bookings
router.get('/:id/bookings', auth, authorize('worker'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ workerId: req.params.id })
      .populate('customerId', 'name phone')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

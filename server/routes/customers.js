const express = require('express');
const { Customer } = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get customer by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .select('-pin')
      .populate('savedWorkers');
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update customer profile
router.put('/:id', auth, authorize('customer'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-pin');

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save/unsave worker
router.post('/:id/saved-workers', auth, authorize('customer'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { workerId, action } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (action === 'add') {
      if (!customer.savedWorkers.includes(workerId)) {
        customer.savedWorkers.push(workerId);
      }
    } else if (action === 'remove') {
      customer.savedWorkers = customer.savedWorkers.filter(id => id.toString() !== workerId);
    }

    await customer.save();
    await customer.populate('savedWorkers');
    res.json(customer.savedWorkers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer's bookings
router.get('/:id/bookings', auth, authorize('customer'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ customerId: req.params.id })
      .populate('workerId', 'name phone rating')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

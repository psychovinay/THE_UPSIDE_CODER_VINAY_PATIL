const express = require('express');
const { Review } = require('../models/Review');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get reviews for a worker
router.get('/worker/:workerId', async (req, res) => {
  try {
    const reviews = await Review.find({ workerId: req.params.workerId })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reviews by a customer
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ customerId: req.params.customerId })
      .populate('workerId', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { bookingId, workerId, rating, comment } = req.body;

    const review = new Review({
      bookingId,
      customerId: req.user._id,
      workerId,
      rating,
      comment
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

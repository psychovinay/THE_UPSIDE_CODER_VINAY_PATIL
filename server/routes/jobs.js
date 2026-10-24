const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Negotiation = require('../models/Negotiation');
const { calculateFairPrice, validateBudget } = require('../services/fairPriceEngine');
const { findBestMatches, findNearbyJobs } = require('../services/smartMatch');
const { calculateKaamScore } = require('../services/kaamScore');
const { auth } = require('../middleware/auth');

/**
 * POST /api/jobs
 * Create a new job posting
 */
router.post('/', auth, async (req, res) => {
  try {
    const { serviceId, title, description, location, preferredTime, budget, urgency, photos } = req.body;

    if (!serviceId || !title || !description || !budget) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate fair price range
    const fairPrice = await calculateFairPrice({
      serviceType: serviceId,
      city: location?.city,
      urgency: urgency || 'normal',
      description
    });

    // Validate budget
    const budgetValidation = validateBudget(budget, fairPrice);

    // Create job
    const job = new Job({
      customerId: req.user._id,
      serviceId,
      title,
      description,
      location,
      preferredTime,
      budget,
      estimatedPriceRange: {
        min: fairPrice.min,
        max: fairPrice.max
      },
      urgency: urgency || 'normal',
      photos: photos || []
    });

    await job.save();

    // Find best matching workers
    const matches = await findBestMatches(job, 5);

    // Update job with matched workers
    job.matchedWorkers = matches.map(m => ({
      workerId: m.workerId,
      matchScore: m.matchScore,
      matchFactors: m.matchFactors
    }));

    await job.save();

    res.status(201).json({
      job,
      fairPrice,
      budgetValidation,
      matches: matches.map(m => ({
        workerId: m.workerId,
        worker: m.worker,
        matchScore: m.matchScore,
        matchFactors: m.matchFactors,
        kaamScore: m.kaamScore
      }))
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

/**
 * GET /api/jobs/:id
 * Get job details
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customerId')
      .populate('serviceId')
      .populate('matchedWorkers.workerId')
      .populate('acceptedWorkerId');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is authorized to view this job
    if (job.customerId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

/**
 * GET /api/jobs
 * Get jobs for a customer or worker
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, role } = req.query;

    let jobs;

    if (req.user.role === 'customer') {
      jobs = await Job.find({ customerId: req.user._id, status })
        .populate('serviceId')
        .populate('acceptedWorkerId')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'worker') {
      // Get nearby jobs for worker
      jobs = await findNearbyJobs(req.user._id, 5, 20);
      jobs = jobs.map(j => j.job);
    } else {
      return res.status(403).json({ error: 'Invalid role' });
    }

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

/**
 * POST /api/jobs/:id/accept
 * Worker accepts a job with a price
 */
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const { amount, message } = req.body;

    if (req.user.role !== 'worker') {
      return res.status(403).json({ error: 'Only workers can accept jobs' });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Job is not available' });
    }

    // Create negotiation record
    const negotiation = new Negotiation({
      jobId: job._id,
      customerId: job.customerId,
      workerId: req.user._id,
      offers: [{
        party: 'worker',
        amount,
        message,
        timestamp: new Date()
      }],
      status: 'pending'
    });

    await negotiation.save();

    // Update job status
    job.status = 'negotiating';
    await job.save();

    res.status(201).json({ negotiation, job });
  } catch (error) {
    console.error('Error accepting job:', error);
    res.status(500).json({ error: 'Failed to accept job' });
  }
});

/**
 * POST /api/jobs/:id/negotiate
 * Customer or worker counter-offers
 */
router.post('/:id/negotiate', auth, async (req, res) => {
  try {
    const { amount, message } = req.body;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Find existing negotiation
    let negotiation = await Negotiation.findOne({
      jobId: job._id,
      status: 'pending'
    });

    if (!negotiation) {
      return res.status(404).json({ error: 'No active negotiation found' });
    }

    // Verify user is part of this negotiation
    if (negotiation.customerId.toString() !== req.user._id.toString() &&
        negotiation.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Add counter-offer
    const party = req.user.role === 'customer' ? 'customer' : 'worker';
    negotiation.offers.push({
      party,
      amount,
      message,
      timestamp: new Date()
    });

    await negotiation.save();

    res.json(negotiation);
  } catch (error) {
    console.error('Error negotiating:', error);
    res.status(500).json({ error: 'Failed to negotiate' });
  }
});

/**
 * POST /api/jobs/:id/accept-offer
 * Accept a negotiation offer
 */
router.post('/:id/accept-offer', auth, async (req, res) => {
  try {
    const { negotiationId } = req.body;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const negotiation = await Negotiation.findById(negotiationId);

    if (!negotiation) {
      return res.status(404).json({ error: 'Negotiation not found' });
    }

    // Verify user is the other party
    const lastOffer = negotiation.offers[negotiation.offers.length - 1];
    const acceptingParty = lastOffer.party === 'customer' ? 'worker' : 'customer';

    if (acceptingParty !== req.user.role) {
      return res.status(403).json({ error: 'Not authorized to accept this offer' });
    }

    // Accept the offer
    negotiation.status = 'accepted';
    negotiation.finalAmount = lastOffer.amount;
    await negotiation.save();

    // Update job
    job.status = 'accepted';
    job.acceptedWorkerId = negotiation.workerId;
    job.finalPrice = lastOffer.amount;
    await job.save();

    res.json({ job, negotiation });
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ error: 'Failed to accept offer' });
  }
});

/**
 * GET /api/jobs/:id/kaamscore
 * Get KaamScore for a worker
 */
router.get('/:workerId/kaamscore', async (req, res) => {
  try {
    const kaamScore = await calculateKaamScore(req.params.workerId);
    res.json(kaamScore);
  } catch (error) {
    console.error('Error calculating KaamScore:', error);
    res.status(500).json({ error: 'Failed to calculate KaamScore' });
  }
});

module.exports = router;

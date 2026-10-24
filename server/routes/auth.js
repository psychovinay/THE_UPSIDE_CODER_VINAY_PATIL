const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Customer, Worker } = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production', {
    expiresIn: '7d'
  });
};

// Register/Login
router.post('/login', [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('pin').trim().notEmpty().withMessage('PIN is required'),
  body('role').isIn(['customer', 'worker', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, pin, role } = req.body;

    // Find user by phone and role
    let user = await User.findOne({ phone, role });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    // Verify PIN
    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get full user data based on role
    let fullUser;
    if (role === 'customer') {
      fullUser = await Customer.findById(user._id).select('-pin');
    } else if (role === 'worker') {
      fullUser = await Worker.findById(user._id).select('-pin').populate('serviceId');
    } else {
      fullUser = await User.findById(user._id).select('-pin');
    }

    const token = generateToken(user._id, role);

    res.json({
      success: true,
      token,
      user: fullUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register new user
router.post('/register', [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('pin').trim().notEmpty().withMessage('PIN is required'),
  body('role').isIn(['customer', 'worker']).withMessage('Invalid role'),
  body('name').trim().notEmpty().withMessage('Name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, pin, role, name, city, pincode, skills, serviceId, hourlyRate, fixedRate, experience, bio, languages, workingHours, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone, role });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this phone number' });
    }

    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    const userData = {
      name,
      phone,
      pin,
      role,
      initials,
      avatarColor: 'bg-slate-500',
      city: city || '',
      pincode: pincode || ''
    };

    // Add customer-specific fields
    if (role === 'customer') {
      const customer = new Customer(userData);
      await customer.save();
      
      const fullUser = await Customer.findById(customer._id).select('-pin');
      const token = generateToken(customer._id, role);
      
      return res.json({
        success: true,
        token,
        user: fullUser
      });
    }

    // Add worker-specific fields
    if (role === 'worker') {
      userData.skills = skills || [];
      userData.serviceId = serviceId || null;
      userData.hourlyRate = hourlyRate || null;
      userData.fixedRate = fixedRate || null;
      userData.available = true;
      userData.aadhaarVerified = false;
      userData.experience = experience || '';
      userData.completedJobs = 0;
      userData.bio = bio || '';
      userData.languages = languages || [];
      userData.workingHours = workingHours || '';
      userData.location = location || '';
      userData.rating = 0;
      userData.reviewCount = 0;
      userData.referralCode = `SAATHI-${initials}${Math.floor(Math.random() * 1000)}`;
      userData.walletBalance = 0;

      const worker = new Worker(userData);
      await worker.save();
      
      const fullUser = await Worker.findById(worker._id).select('-pin').populate('serviceId');
      const token = generateToken(worker._id, role);
      
      return res.json({
        success: true,
        token,
        user: fullUser
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    let user;
    if (req.user.role === 'customer') {
      user = await Customer.findById(req.user._id).select('-pin').populate('savedWorkers');
    } else if (req.user.role === 'worker') {
      user = await Worker.findById(req.user._id).select('-pin').populate('serviceId');
    } else {
      user = await User.findById(req.user._id).select('-pin');
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;

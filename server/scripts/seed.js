require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
require('../models/User');
require('../models/Service');
require('../models/Booking');
require('../models/Review');
require('../models/Job');
require('../models/Negotiation');

const User = mongoose.model('User');
const Customer = mongoose.model('customer');
const Worker = mongoose.model('worker');
const Admin = mongoose.model('admin');
const Service = mongoose.model('Service');
const Booking = mongoose.model('Booking');
const Review = mongoose.model('Review');
const Job = mongoose.model('Job');
const Negotiation = mongoose.model('Negotiation');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sevasaathi')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await Job.deleteMany({});
    await Negotiation.deleteMany({});

    console.log('Cleared existing data');

    // Create Services
    const services = await Service.insertMany([
      { id: 1, name: 'Electrician', icon: '⚡', color: 'bg-amber-50 text-amber-600', description: 'Wiring, fans, switches, fuse repair', basePrice: 300, category: 'Home Repair' },
      { id: 2, name: 'Plumber', icon: '🔧', color: 'bg-blue-50 text-blue-600', description: 'Pipe fitting, tap repair, drainage', basePrice: 350, category: 'Home Repair' },
      { id: 3, name: 'Maid', icon: '🧹', color: 'bg-pink-50 text-pink-600', description: 'Sweeping, mopping, utensils, dusting', basePrice: 250, category: 'Household' },
      { id: 4, name: 'Cook', icon: '👨‍🍳', color: 'bg-orange-50 text-orange-600', description: 'Breakfast, lunch & dinner, tiffin', basePrice: 400, category: 'Household' },
      { id: 5, name: 'Carpenter', icon: '🪚', color: 'bg-green-50 text-green-600', description: 'Furniture repair, doors, cabinets', basePrice: 450, category: 'Home Repair' },
      { id: 6, name: 'Painter', icon: '🖌️', color: 'bg-purple-50 text-purple-600', description: 'Wall painting, waterproofing', basePrice: 500, category: 'Home Repair' },
      { id: 7, name: 'AC Repair', icon: '❄️', color: 'bg-cyan-50 text-cyan-600', description: 'Servicing, gas refill, installation', basePrice: 600, category: 'Appliances' },
      { id: 8, name: 'Pest Control', icon: '🐛', color: 'bg-red-50 text-red-600', description: 'Cockroach, termite, rats, bedbugs', basePrice: 800, category: 'Household' },
      { id: 9, name: 'Driver', icon: '🚗', color: 'bg-slate-50 text-slate-600', description: 'Full day, part time, outstation', basePrice: 700, category: 'Transport' },
      { id: 10, name: 'Security Guard', icon: '💂', color: 'bg-indigo-50 text-indigo-600', description: 'Society, shop, event security', basePrice: 900, category: 'Security' },
    ]);

    console.log('Created services');

    // Create Admin
    const admin = new Admin({
      name: 'Admin User',
      phone: '9000000000',
      pin: '0000',
      role: 'admin',
      initials: 'AU',
      avatarColor: 'bg-slate-600'
    });
    await admin.save();

    // Create Customers
    const customer1 = new Customer({
      name: 'Priya Sharma',
      phone: '9811234567',
      pin: '1234',
      role: 'customer',
      city: 'Gurugram',
      pincode: '122001',
      initials: 'PS',
      avatarColor: 'bg-rose-500',
      totalBookings: 12,
    });
    await customer1.save();

    const customer2 = new Customer({
      name: 'Ajay Mehta',
      phone: '9822334455',
      pin: '1234',
      role: 'customer',
      city: 'Bengaluru',
      pincode: '560066',
      initials: 'AM',
      avatarColor: 'bg-indigo-500',
      totalBookings: 7,
    });
    await customer2.save();

    // Create Workers
    const electricianService = services[0];
    const plumberService = services[1];
    const maidService = services[2];
    const cookService = services[3];
    const carpenterService = services[4];
    const painterService = services[5];
    const acService = services[6];
    const driverService = services[8];

    const worker1 = new Worker({
      name: 'RK',
      phone: '9876543210',
      pin: '1234',
      role: 'worker',
      initials: 'RK',
      avatarColor: 'bg-blue-600',
      location: 'Karol Bagh, New Delhi',
      city: 'Delhi',
      pincode: '110005',
      skills: ['Electrician', 'Wiring', 'Fan Installation', 'Inverter Repair'],
      serviceId: electricianService._id,
      hourlyRate: 350,
      available: true,
      aadhaarVerified: true,
      experience: '8 years',
      completedJobs: 312,
      bio: 'Expert electrician with 8+ years experience. Specialise in home wiring, switchboard repair and inverter servicing.',
      languages: ['Hindi', 'English'],
      workingHours: '7 AM – 8 PM',
      rating: 4.8,
      reviewCount: 127,
      walletBalance: 15000,
      referralCode: 'SAATHI-RK482',
      // KaamConnect worker settings
      serviceRadius: 5,
      minimumRate: 300,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      availableTimeStart: '7:00 AM',
      availableTimeEnd: '8:00 PM',
      kaamScore: 87,
      onTimeRate: 0.94,
      repeatCustomerRate: 0.35
    });
    await worker1.save();

    const worker2 = new Worker({
      name: 'Suresh Patel',
      phone: '9845123678',
      pin: '1234',
      role: 'worker',
      initials: 'SP',
      avatarColor: 'bg-blue-500',
      location: 'Andheri West, Mumbai',
      city: 'Mumbai',
      pincode: '400053',
      skills: ['Plumber', 'Pipe Fitting', 'Tap Repair', 'Geyser'],
      serviceId: plumberService._id,
      hourlyRate: 400,
      available: true,
      aadhaarVerified: true,
      experience: '6 years',
      completedJobs: 198,
      bio: 'Reliable plumber for all residential needs. Pipe leaks, tap repairs, geyser installation.',
      languages: ['Hindi', 'Marathi', 'Gujarati'],
      workingHours: '8 AM – 7 PM',
      rating: 4.6,
      reviewCount: 89,
      walletBalance: 12000,
      referralCode: 'SAATHI-SP391',
      serviceRadius: 8,
      minimumRate: 350,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      availableTimeStart: '8:00 AM',
      availableTimeEnd: '7:00 PM',
      kaamScore: 82,
      onTimeRate: 0.91,
      repeatCustomerRate: 0.28
    });
    await worker2.save();

    const worker3 = new Worker({
      name: 'Geeta Devi',
      phone: '9765432109',
      pin: '1234',
      role: 'worker',
      initials: 'GD',
      avatarColor: 'bg-pink-500',
      location: 'Koramangala, Bengaluru',
      city: 'Bengaluru',
      pincode: '560034',
      skills: ['Maid', 'Sweeping', 'Mopping', 'Utensils', 'Dusting'],
      serviceId: maidService._id,
      fixedRate: 280,
      available: true,
      aadhaarVerified: true,
      experience: '5 years',
      completedJobs: 450,
      bio: 'Dedicated and trustworthy maid with 5 years of experience.',
      languages: ['Kannada', 'Hindi', 'Telugu'],
      workingHours: '7 AM – 2 PM',
      rating: 4.9,
      reviewCount: 204,
      walletBalance: 8500,
      referralCode: 'SAATHI-GD574',
      serviceRadius: 3,
      minimumRate: 250,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      availableTimeStart: '7:00 AM',
      availableTimeEnd: '2:00 PM',
      kaamScore: 91,
      onTimeRate: 0.97,
      repeatCustomerRate: 0.42
    });
    await worker3.save();

    const worker4 = new Worker({
      name: 'Mohan Lal Verma',
      phone: '9988776655',
      pin: '1234',
      role: 'worker',
      initials: 'MV',
      avatarColor: 'bg-orange-500',
      location: 'Lajpat Nagar, New Delhi',
      city: 'Delhi',
      pincode: '110024',
      skills: ['Cook', 'North Indian', 'Rajasthani', 'Breakfast', 'Tiffin'],
      serviceId: cookService._id,
      fixedRate: 450,
      available: true,
      aadhaarVerified: false,
      experience: '10 years',
      completedJobs: 520,
      bio: 'Experienced cook specialising in North Indian cuisine.',
      languages: ['Hindi'],
      workingHours: '7 AM – 12 PM, 5 PM – 9 PM',
      rating: 4.7,
      reviewCount: 156,
      walletBalance: 20000,
      referralCode: 'SAATHI-MV283',
      serviceRadius: 4,
      minimumRate: 400,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      availableTimeStart: '7:00 AM',
      availableTimeEnd: '9:00 PM',
      kaamScore: 85,
      onTimeRate: 0.92,
      repeatCustomerRate: 0.38
    });
    await worker4.save();

    const worker5 = new Worker({
      name: 'Rajiv Nair',
      phone: '9654321098',
      pin: '1234',
      role: 'worker',
      initials: 'RN',
      avatarColor: 'bg-green-500',
      location: 'Indiranagar, Bengaluru',
      city: 'Bengaluru',
      pincode: '560038',
      skills: ['Carpenter', 'Furniture Repair', 'Door Fitting', 'Cabinet Making'],
      serviceId: carpenterService._id,
      hourlyRate: 500,
      available: false,
      aadhaarVerified: true,
      experience: '12 years',
      completedJobs: 289,
      bio: 'Master carpenter with 12 years of experience.',
      languages: ['Kannada', 'Hindi', 'Malayalam'],
      workingHours: '9 AM – 6 PM',
      rating: 4.5,
      reviewCount: 67,
      walletBalance: 18000,
      referralCode: 'SAATHI-RN491',
      serviceRadius: 6,
      minimumRate: 450,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      availableTimeStart: '9:00 AM',
      availableTimeEnd: '6:00 PM',
      kaamScore: 78,
      onTimeRate: 0.88,
      repeatCustomerRate: 0.25
    });
    await worker5.save();

    const worker6 = new Worker({
      name: 'Santosh Yadav',
      phone: '9123456789',
      pin: '1234',
      role: 'worker',
      initials: 'SY',
      avatarColor: 'bg-purple-500',
      location: 'Dadar, Mumbai',
      city: 'Mumbai',
      pincode: '400014',
      skills: ['Painter', 'Interior Painting', 'Waterproofing', 'Texture Paint'],
      serviceId: painterService._id,
      hourlyRate: 550,
      available: true,
      aadhaarVerified: false,
      experience: '4 years',
      completedJobs: 78,
      bio: 'Professional painter for residential and commercial spaces.',
      languages: ['Hindi', 'Marathi'],
      workingHours: '8 AM – 6 PM',
      rating: 4.3,
      reviewCount: 43,
      walletBalance: 5000,
      referralCode: 'SAATHI-SY672',
      serviceRadius: 10,
      minimumRate: 500,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      availableTimeStart: '8:00 AM',
      availableTimeEnd: '6:00 PM',
      kaamScore: 65,
      onTimeRate: 0.85,
      repeatCustomerRate: 0.18
    });
    await worker6.save();

    const worker7 = new Worker({
      name: 'Dinesh Sharma',
      phone: '9012345678',
      pin: '1234',
      role: 'worker',
      initials: 'DS',
      avatarColor: 'bg-cyan-500',
      location: 'Pitampura, New Delhi',
      city: 'Delhi',
      pincode: '110034',
      skills: ['AC Repair', 'AC Service', 'Gas Refill', 'AC Installation'],
      serviceId: acService._id,
      hourlyRate: 650,
      available: true,
      aadhaarVerified: true,
      experience: '7 years',
      completedJobs: 341,
      bio: 'Certified AC technician for all brands.',
      languages: ['Hindi', 'Punjabi'],
      workingHours: '9 AM – 8 PM',
      rating: 4.7,
      reviewCount: 91,
      walletBalance: 22000,
      referralCode: 'SAATHI-DS815',
      serviceRadius: 7,
      minimumRate: 600,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      availableTimeStart: '9:00 AM',
      availableTimeEnd: '8:00 PM',
      kaamScore: 84,
      onTimeRate: 0.93,
      repeatCustomerRate: 0.31
    });
    await worker7.save();

    const worker8 = new Worker({
      name: 'Kavitha Reddy',
      phone: '9345678901',
      pin: '1234',
      role: 'worker',
      initials: 'KR',
      avatarColor: 'bg-indigo-500',
      location: 'HSR Layout, Bengaluru',
      city: 'Bengaluru',
      pincode: '560102',
      skills: ['Driver', 'City Driving', 'Airport Drops', 'Outstation'],
      serviceId: driverService._id,
      hourlyRate: 750,
      available: true,
      aadhaarVerified: true,
      experience: '9 years',
      completedJobs: 180,
      bio: 'Licensed professional driver with 9 years of experience.',
      languages: ['Kannada', 'Telugu', 'Hindi', 'English'],
      workingHours: '6 AM – 10 PM',
      rating: 4.4,
      reviewCount: 38,
      walletBalance: 14000,
      referralCode: 'SAATHI-KR926',
      serviceRadius: 15,
      minimumRate: 700,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      availableTimeStart: '6:00 AM',
      availableTimeEnd: '10:00 PM',
      kaamScore: 72,
      onTimeRate: 0.89,
      repeatCustomerRate: 0.22
    });
    await worker8.save();

    console.log('Created users');

    // Create sample bookings
    const booking1 = new Booking({
      customerId: customer1._id,
      workerId: worker1._id,
      serviceId: electricianService._id,
      status: 'completed',
      date: new Date('2026-10-22'),
      time: '10:00 AM',
      address: '45, Rose Garden Society, Sector 14, Gurugram',
      pincode: '122001',
      budget: 600,
      amount: 550,
      requestCode: '847392',
      arrivalOTP: '7842',
      completionOTP: '3916',
      rating: 5,
      review: 'Excellent work! Fixed the wiring issue very quickly.'
    });
    await booking1.save();

    const booking2 = new Booking({
      customerId: customer1._id,
      workerId: worker2._id,
      serviceId: plumberService._id,
      status: 'en_route',
      date: new Date('2026-10-24'),
      time: '2:30 PM',
      address: '45, Rose Garden Society, Sector 14, Gurugram',
      pincode: '122001',
      budget: 500,
      requestCode: '293847',
      arrivalOTP: '4521',
    });
    await booking2.save();

    const booking3 = new Booking({
      customerId: customer2._id,
      workerId: worker3._id,
      serviceId: maidService._id,
      status: 'pending',
      date: new Date('2026-10-25'),
      time: '8:00 AM',
      address: '12, Sunshine Apartments, Whitefield, Bengaluru',
      pincode: '560066',
      budget: 350,
      requestCode: '567812',
    });
    await booking3.save();

    console.log('Created bookings');

    // Create sample reviews
    const review1 = new Review({
      bookingId: booking1._id,
      customerId: customer1._id,
      workerId: worker1._id,
      rating: 5,
      comment: 'Excellent work! Fixed all wiring in 2 hours. Very professional and clean.'
    });
    await review1.save();

    console.log('Created reviews');

    // Create sample jobs (KaamConnect feature)
    const job1 = new Job({
      customerId: customer1._id,
      serviceId: electricianService._id,
      title: 'Fix ceiling fan not working',
      description: 'The ceiling fan in my bedroom is not working. It makes a humming sound but does not rotate. Need someone to check and fix it.',
      location: {
        address: '45, Rose Garden Society, Sector 14, Gurugram',
        city: 'Gurugram',
        pincode: '122001'
      },
      preferredTime: {
        date: new Date('2026-10-26'),
        timeSlot: '3 PM - 6 PM'
      },
      budget: 400,
      estimatedPriceRange: {
        min: 350,
        max: 500
      },
      urgency: 'normal',
      status: 'open',
      matchedWorkers: [
        {
          workerId: worker1._id,
          matchScore: 92,
          matchFactors: { skill: 30, distance: 20, availability: 18, price: 14, trust: 10 }
        }
      ]
    });
    await job1.save();

    const job2 = new Job({
      customerId: customer2._id,
      serviceId: plumberService._id,
      title: 'Kitchen sink tap leaking',
      description: 'The kitchen sink tap has been leaking for 2 days. Need to replace the tap or fix the washer.',
      location: {
        address: '12, Sunshine Apartments, Whitefield, Bengaluru',
        city: 'Bengaluru',
        pincode: '560066'
      },
      preferredTime: {
        date: new Date('2026-10-25'),
        timeSlot: '9 AM - 12 PM'
      },
      budget: 350,
      estimatedPriceRange: {
        min: 300,
        max: 450
      },
      urgency: 'high',
      status: 'negotiating',
      matchedWorkers: [
        {
          workerId: worker2._id,
          matchScore: 85,
          matchFactors: { skill: 28, distance: 22, availability: 16, price: 12, trust: 7 }
        }
      ],
      acceptedWorkerId: worker2._id,
      finalPrice: 380
    });
    await job2.save();

    const job3 = new Job({
      customerId: customer1._id,
      serviceId: acService._id,
      title: 'AC not cooling properly',
      description: 'Split AC in living room is not cooling. Need gas refill or repair.',
      location: {
        address: '45, Rose Garden Society, Sector 14, Gurugram',
        city: 'Gurugram',
        pincode: '122001'
      },
      preferredTime: {
        date: new Date('2026-10-27'),
        timeSlot: '10 AM - 1 PM'
      },
      budget: 700,
      estimatedPriceRange: {
        min: 600,
        max: 900
      },
      urgency: 'normal',
      status: 'open'
    });
    await job3.save();

    console.log('Created jobs');

    // Create sample negotiations
    const negotiation1 = new Negotiation({
      jobId: job2._id,
      customerId: customer2._id,
      workerId: worker2._id,
      offers: [
        {
          party: 'customer',
          amount: 350,
          message: 'This is my budget for the tap repair',
          timestamp: new Date('2026-10-24T10:00:00')
        },
        {
          party: 'worker',
          amount: 400,
          message: 'Need to replace the entire tap assembly, parts cost extra',
          timestamp: new Date('2026-10-24T10:30:00')
        },
        {
          party: 'customer',
          amount: 380,
          message: 'Okay, I can do 380',
          timestamp: new Date('2026-10-24T11:00:00')
        }
      ],
      status: 'accepted',
      finalAmount: 380
    });
    await negotiation1.save();

    console.log('Created negotiations');

    console.log('Seed data completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    address: String,
    city: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  preferredTime: {
    date: Date,
    timeSlot: String
  },
  budget: { type: Number, required: true },
  estimatedPriceRange: {
    min: Number,
    max: Number
  },
  urgency: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  photos: [String],
  status: {
    type: String,
    enum: ['open', 'negotiating', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  matchedWorkers: [{
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    matchScore: Number,
    matchFactors: {
      skill: Number,
      distance: Number,
      availability: Number,
      price: Number,
      trust: Number
    }
  }],
  acceptedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  finalPrice: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

jobSchema.index({ customerId: 1, status: 1 });
jobSchema.index({ 'location.city': 1, status: 1 });
jobSchema.index({ serviceId: 1, status: 1 });

const Job = mongoose.model('Job', jobSchema);
Job.Job = Job;
module.exports = Job;

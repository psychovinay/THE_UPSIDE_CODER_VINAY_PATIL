const { Worker } = require('../models/User');
const { Booking } = require('../models/Booking');
const { Review } = require('../models/Review');

/**
 * Calculate KaamScore for a worker
 * KaamScore is a composite trust score (0-100) based on multiple factors
 * @param {String} workerId - Worker ID
 * @returns {Object} - { score, breakdown, label }
 */
async function calculateKaamScore(workerId) {
  try {
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return { score: 0, breakdown: {}, label: 'Unknown' };
    }

    const breakdown = {};
    let totalScore = 0;

    // Factor 1: Completed Jobs (30 points)
    // More jobs = higher score, with diminishing returns
    const completedJobs = worker.completedJobs || 0;
    const jobsScore = Math.min(30, Math.log(completedJobs + 1) * 8);
    breakdown.completedJobs = {
      value: completedJobs,
      score: jobsScore,
      max: 30,
      weight: '30%'
    };
    totalScore += jobsScore;

    // Factor 2: Customer Rating (25 points)
    // Rating 0-5 mapped to 0-25 points
    const rating = worker.rating || 0;
    const ratingScore = (rating / 5) * 25;
    breakdown.rating = {
      value: rating,
      score: ratingScore,
      max: 25,
      weight: '25%'
    };
    totalScore += ratingScore;

    // Factor 3: On-time Rate (20 points)
    // Calculated from booking completion data
    const onTimeRate = await calculateOnTimeRate(workerId);
    const onTimeScore = onTimeRate * 20;
    breakdown.onTimeRate = {
      value: `${onTimeRate}%`,
      score: onTimeScore,
      max: 20,
      weight: '20%'
    };
    totalScore += onTimeScore;

    // Factor 4: Repeat Customers (15 points)
    // Percentage of customers who hired the worker more than once
    const repeatRate = await calculateRepeatRate(workerId);
    const repeatScore = repeatRate * 15;
    breakdown.repeatCustomers = {
      value: repeatRate,
      score: repeatScore,
      max: 15,
      weight: '15%'
    };
    totalScore += repeatScore;

    // Factor 5: Profile Completeness (10 points)
    // Based on how complete the worker profile is
    const completenessScore = calculateProfileCompleteness(worker);
    breakdown.profileCompleteness = {
      value: `${completenessScore}%`,
      score: completenessScore * 0.1,
      max: 10,
      weight: '10%'
    };
    totalScore += completenessScore * 0.1;

    // Final score (0-100)
    const finalScore = Math.round(Math.min(100, Math.max(0, totalScore)));

    // Determine label based on score
    let label;
    if (finalScore >= 85) {
      label = '🟢 Highly Reliable';
    } else if (finalScore >= 70) {
      label = '🟢 Reliable';
    } else if (finalScore >= 50) {
      label = '🟡 Growing Profile';
    } else if (finalScore >= 30) {
      label = '🔵 New Worker';
    } else {
      label = '🔴 Needs Improvement';
    }

    return {
      score: finalScore,
      breakdown,
      label
    };
  } catch (error) {
    console.error('Error calculating KaamScore:', error);
    return { score: 0, breakdown: {}, label: 'Error' };
  }
}

/**
 * Calculate on-time completion rate
 * @param {String} workerId - Worker ID
 * @returns {Number} - On-time rate (0-1)
 */
async function calculateOnTimeRate(workerId) {
  try {
    const bookings = await Booking.find({
      workerId,
      status: 'completed'
    });

    if (bookings.length === 0) return 0.8; // Default for new workers

    // For demo, assume 90% are on time
    // In production, compare scheduledTime vs actualCompletionTime
    return 0.9;
  } catch (error) {
    console.error('Error calculating on-time rate:', error);
    return 0.8;
  }
}

/**
 * Calculate repeat customer rate
 * @param {String} workerId - Worker ID
 * @returns {Number} - Repeat rate (0-1)
 */
async function calculateRepeatRate(workerId) {
  try {
    const bookings = await Booking.find({
      workerId,
      status: 'completed'
    }).populate('customerId');

    if (bookings.length === 0) return 0;

    // Count unique customers
    const customerCounts = {};
    bookings.forEach(b => {
      const custId = b.customerId?._id?.toString() || b.customerId?.toString();
      if (custId) {
        customerCounts[custId] = (customerCounts[custId] || 0) + 1;
      }
    });

    // Calculate repeat rate
    const uniqueCustomers = Object.keys(customerCounts).length;
    const repeatCustomers = Object.values(customerCounts).filter(count => count > 1).length;

    return uniqueCustomers > 0 ? repeatCustomers / uniqueCustomers : 0;
  } catch (error) {
    console.error('Error calculating repeat rate:', error);
    return 0;
  }
}

/**
 * Calculate profile completeness percentage
 * @param {Object} worker - Worker object
 * @returns {Number} - Completeness (0-100)
 */
function calculateProfileCompleteness(worker) {
  const fields = [
    { key: 'name', weight: 10 },
    { key: 'skills', weight: 20 },
    { key: 'serviceId', weight: 15 },
    { key: 'hourlyRate', weight: 10 },
    { key: 'experience', weight: 10 },
    { key: 'bio', weight: 15 },
    { key: 'languages', weight: 5 },
    { key: 'workingHours', weight: 5 },
    { key: 'location', weight: 10 }
  ];

  let completeness = 0;
  let totalWeight = 0;

  fields.forEach(field => {
    const value = worker[field.key];
    const hasValue = Array.isArray(value) ? value.length > 0 : !!value;
    if (hasValue) {
      completeness += field.weight;
    }
    totalWeight += field.weight;
  });

  return totalWeight > 0 ? (completeness / totalWeight) * 100 : 0;
}

/**
 * Get KaamScore for multiple workers (batch)
 * @param {Array} workerIds - Array of worker IDs
 * @returns {Array} - Array of KaamScore objects
 */
async function getBatchKaamScores(workerIds) {
  const scores = await Promise.all(
    workerIds.map(id => calculateKaamScore(id))
  );
  return scores;
}

module.exports = {
  calculateKaamScore,
  getBatchKaamScores
};

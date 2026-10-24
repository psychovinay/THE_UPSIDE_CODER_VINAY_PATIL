const { Worker } = require('../models/User');
const { calculateKaamScore } = require('./kaamScore');

/**
 * Smart matching algorithm
 * Calculates match score based on skill, distance, availability, price, and trust
 * @param {Object} job - Job object
 * @param {Object} worker - Worker object
 * @param {Object} customerLocation - Customer location { lat, lng }
 * @returns {Object} - Match score with breakdown
 */
async function calculateMatchScore(job, worker, customerLocation) {
  const factors = {
    skill: 0,
    distance: 0,
    availability: 0,
    price: 0,
    trust: 0
  };

  // Factor 1: Skill Match (30 points)
  factors.skill = await calculateSkillMatch(job, worker);

  // Factor 2: Distance (25 points)
  factors.distance = calculateDistanceScore(customerLocation, worker.location);

  // Factor 3: Availability (20 points)
  factors.availability = calculateAvailabilityScore(job, worker);

  // Factor 4: Price Compatibility (15 points)
  factors.price = calculatePriceScore(job, worker);

  // Factor 5: Trust Score (10 points)
  const kaamScore = await calculateKaamScore(worker._id);
  factors.trust = (kaamScore.score / 100) * 10;

  // Calculate total match score
  const totalScore = factors.skill + factors.distance + factors.availability + factors.price + factors.trust;

  return {
    totalScore: Math.round(totalScore),
    factors,
    kaamScore: kaamScore.score
  };
}

/**
 * Calculate skill match score
 * @param {Object} job - Job object
 * @param {Object} worker - Worker object
 * @returns {Number} - Skill score (0-30)
 */
async function calculateSkillMatch(job, worker) {
  // Check if worker's service matches job's service
  if (worker.serviceId?.toString() !== job.serviceId?.toString()) {
    return 0;
  }

  // Check if worker has relevant skills
  const jobSkills = job.requiredSkills || [];
  const workerSkills = worker.skills || [];

  if (jobSkills.length === 0) {
    // No specific skills required, full points for service match
    return 30;
  }

  // Calculate skill overlap
  const matchedSkills = jobSkills.filter(skill => 
    workerSkills.some(ws => ws.toLowerCase().includes(skill.toLowerCase()))
  );

  const matchRatio = matchedSkills.length / jobSkills.length;
  return Math.round(matchRatio * 30);
}

/**
 * Calculate distance score
 * @param {Object} customerLocation - Customer location { lat, lng }
 * @param {String} workerLocation - Worker location string or coordinates
 * @returns {Number} - Distance score (0-25)
 */
function calculateDistanceScore(customerLocation, workerLocation) {
  if (!customerLocation || !workerLocation) {
    return 10; // Default score if location unknown
  }

  // For demo, use simple string matching
  // In production, use actual geolocation distance calculation
  const workerCity = workerLocation.toLowerCase();
  const customerCity = customerLocation.city?.toLowerCase() || '';

  if (workerCity.includes(customerCity) || customerCity.includes(workerCity)) {
    return 25; // Same city
  }

  return 10; // Different city
}

/**
 * Calculate availability score
 * @param {Object} job - Job object
 * @param {Object} worker - Worker object
 * @returns {Number} - Availability score (0-20)
 */
function calculateAvailabilityScore(job, worker) {
  if (!worker.available) {
    return 0;
  }

  const jobDate = new Date(job.preferredTime?.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if worker is available on the job date
  if (jobDate < today) {
    return 0; // Past date
  }

  // Check if job is today
  const isToday = jobDate.toDateString() === today.toDateString();

  if (isToday) {
    return 20; // Available today
  }

  // Check if job is within worker's working hours
  const jobTime = job.preferredTime?.timeSlot || '';
  const workerHours = worker.workingHours || '';

  if (workerHours && jobTime) {
    // Simple check if time ranges overlap
    return 15;
  }

  return 10; // Available but time not specified
}

/**
 * Calculate price compatibility score
 * @param {Object} job - Job object
 * @param {Object} worker - Worker object
 * @returns {Number} - Price score (0-15)
 */
function calculatePriceScore(job, worker) {
  const workerRate = worker.hourlyRate || worker.fixedRate;
  const jobBudget = job.budget;

  if (!workerRate || !jobBudget) {
    return 7; // Default score
  }

  // Calculate how close worker's rate is to job budget
  const ratio = workerRate / jobBudget;

  if (ratio <= 1.0) {
    // Worker rate is within or below budget
    return 15;
  } else if (ratio <= 1.2) {
    // Worker rate is slightly above budget
    return 10;
  } else if (ratio <= 1.5) {
    // Worker rate is moderately above budget
    return 5;
  } else {
    // Worker rate is significantly above budget
    return 0;
  }
}

/**
 * Find best matching workers for a job
 * @param {Object} job - Job object
 * @param {Number} limit - Maximum number of matches to return
 * @returns {Array} - Array of matched workers with scores
 */
async function findBestMatches(job, limit = 5) {
  try {
    // Find workers matching the service
    const workers = await Worker.find({
      serviceId: job.serviceId,
      available: true,
      isActive: true
    }).limit(50);

    if (workers.length === 0) {
      return [];
    }

    // Calculate match scores for all workers
    const matches = await Promise.all(
      workers.map(async (worker) => {
        const matchResult = await calculateMatchScore(
          job,
          worker,
          job.location
        );

        return {
          workerId: worker._id,
          worker,
          matchScore: matchResult.totalScore,
          matchFactors: matchResult.factors,
          kaamScore: matchResult.kaamScore
        };
      })
    );

    // Sort by match score (descending)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Return top matches
    return matches.slice(0, limit);
  } catch (error) {
    console.error('Error finding best matches:', error);
    return [];
  }
}

/**
 * Find nearby jobs for a worker
 * @param {String} workerId - Worker ID
 * @param {Number} radiusKm - Search radius in km
 * @param {Number} limit - Maximum number of jobs
 * @returns {Array} - Array of nearby jobs
 */
async function findNearbyJobs(workerId, radiusKm = 5, limit = 10) {
  try {
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return [];
    }

    const Job = require('../models/Job');

    // Find open jobs matching worker's service
    // For demo, remove city filter to show all jobs for the service
    // In production, use actual geolocation distance calculation
    const jobs = await Job.find({
      serviceId: worker.serviceId,
      status: 'open'
    }).limit(50).populate('customerId');

    if (jobs.length === 0) {
      return [];
    }

    // Calculate match scores for each job
    const matchedJobs = await Promise.all(
      jobs.map(async (job) => {
        const matchResult = await calculateMatchScore(
          job,
          worker,
          job.location
        );

        return {
          job,
          matchScore: matchResult.totalScore,
          matchFactors: matchResult.factors
        };
      })
    );

    // Sort by match score (descending)
    matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

    // Return top matches
    return matchedJobs.slice(0, limit);
  } catch (error) {
    console.error('Error finding nearby jobs:', error);
    return [];
  }
}

module.exports = {
  calculateMatchScore,
  findBestMatches,
  findNearbyJobs
};

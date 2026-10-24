const { Worker } = require('../models/User');
const { Booking } = require('../models/Booking');

// Base price ranges for different services (in INR)
const SERVICE_BASE_PRICES = {
  'electrician': { min: 250, max: 800, avg: 400 },
  'plumber': { min: 200, max: 700, avg: 350 },
  'carpenter': { min: 300, max: 1000, avg: 500 },
  'painter': { min: 500, max: 2000, avg: 1000 },
  'cleaner': { min: 150, max: 500, avg: 250 },
  'ac_repair': { min: 400, max: 1500, avg: 700 },
  'mechanic': { min: 300, max: 1200, avg: 600 },
  'mason': { min: 400, max: 1500, avg: 700 },
  'gardener': { min: 200, max: 600, avg: 350 },
  'cook': { min: 300, max: 800, avg: 450 }
};

// City multipliers (cost of living adjustment)
const CITY_MULTIPLIERS = {
  'mumbai': 1.3,
  'delhi': 1.25,
  'bangalore': 1.2,
  'pune': 1.15,
  'hyderabad': 1.1,
  'chennai': 1.15,
  'kolkata': 1.1,
  'ahmedabad': 1.05,
  'default': 1.0
};

// Urgency multipliers
const URGENCY_MULTIPLIERS = {
  'low': 0.9,
  'normal': 1.0,
  'high': 1.2,
  'urgent': 1.5
};

/**
 * Calculate fair price range for a service
 * @param {Object} params - { serviceType, city, urgency, description }
 * @returns {Object} - { min, max, avg, factors }
 */
async function calculateFairPrice(params) {
  const { serviceType, city, urgency = 'normal', description } = params;
  
  // Get base price for service
  const basePrice = SERVICE_BASE_PRICES[serviceType] || SERVICE_BASE_PRICES['electrician'];
  
  // Get city multiplier
  const cityLower = city?.toLowerCase() || 'default';
  const cityMultiplier = CITY_MULTIPLIERS[cityLower] || CITY_MULTIPLIERS['default'];
  
  // Get urgency multiplier
  const urgencyMultiplier = URGENCY_MULTIPLIERS[urgency] || URGENCY_MULTIPLIERS['normal'];
  
  // Calculate complexity factor based on description keywords
  const complexityFactor = analyzeComplexity(description);
  
  // Get local worker rates for this service
  const localRates = await getLocalWorkerRates(serviceType, city);
  
  // Calculate final price range
  const baseMin = basePrice.min * cityMultiplier * urgencyMultiplier * complexityFactor;
  const baseMax = basePrice.max * cityMultiplier * urgencyMultiplier * complexityFactor;
  const baseAvg = basePrice.avg * cityMultiplier * urgencyMultiplier * complexityFactor;
  
  // Blend with local rates if available
  let minPrice, maxPrice, avgPrice;
  
  if (localRates.length > 0) {
    const avgLocalRate = localRates.reduce((sum, r) => sum + r, 0) / localRates.length;
    minPrice = Math.round((baseMin + avgLocalRate * 0.7) / 2);
    maxPrice = Math.round((baseMax + avgLocalRate * 1.3) / 2);
    avgPrice = Math.round((baseAvg + avgLocalRate) / 2);
  } else {
    minPrice = Math.round(baseMin);
    maxPrice = Math.round(baseMax);
    avgPrice = Math.round(baseAvg);
  }
  
  // Ensure reasonable bounds
  minPrice = Math.max(minPrice, 100);
  maxPrice = Math.max(maxPrice, minPrice + 50);
  
  return {
    min: minPrice,
    max: maxPrice,
    avg: avgPrice,
    factors: {
      serviceBase: basePrice,
      cityMultiplier: cityMultiplier,
      urgencyMultiplier: urgencyMultiplier,
      complexityFactor: complexityFactor,
      localRates: localRates.length > 0 ? localRates : null
    }
  };
}

/**
 * Analyze job complexity from description
 * @param {String} description - Job description
 * @returns {Number} - Complexity multiplier (0.8 to 1.5)
 */
function analyzeComplexity(description) {
  if (!description) return 1.0;
  
  const desc = description.toLowerCase();
  
  // Simple jobs
  const simpleKeywords = ['fix', 'repair', 'replace', 'install', 'basic', 'simple', 'minor'];
  const simpleCount = simpleKeywords.filter(k => desc.includes(k)).length;
  
  // Complex jobs
  const complexKeywords = ['renovation', 'complete', 'full', 'major', 'complex', 'multiple', 'system', 'overhaul'];
  const complexCount = complexKeywords.filter(k => desc.includes(k)).length;
  
  let factor = 1.0;
  
  if (simpleCount > 0) {
    factor -= simpleCount * 0.05;
  }
  
  if (complexCount > 0) {
    factor += complexCount * 0.15;
  }
  
  // Check for quantity indicators
  const quantityMatch = desc.match(/\d+\s*(items|parts|rooms|fixtures|points)/i);
  if (quantityMatch) {
    const num = parseInt(quantityMatch[0]);
    if (num > 5) factor += 0.2;
    else if (num > 2) factor += 0.1;
  }
  
  return Math.max(0.8, Math.min(1.5, factor));
}

/**
 * Get local worker rates for a service in a city
 * @param {String} serviceType - Service type
 * @param {String} city - City name
 * @returns {Array} - Array of worker rates
 */
async function getLocalWorkerRates(serviceType, city) {
  try {
    const workers = await Worker.find({
      serviceId: serviceType,
      city: new RegExp(city, 'i'),
      available: true
    }).select('hourlyRate fixedRate');
    
    const rates = [];
    workers.forEach(w => {
      if (w.hourlyRate) rates.push(w.hourlyRate);
      if (w.fixedRate) rates.push(w.fixedRate);
    });
    
    return rates;
  } catch (error) {
    console.error('Error fetching local rates:', error);
    return [];
  }
}

/**
 * Validate customer budget against fair price
 * @param {Number} budget - Customer's budget
 * @param {Object} fairPrice - Fair price range object
 * @returns {Object} - { isReasonable, message, percentage }
 */
function validateBudget(budget, fairPrice) {
  const { min, max, avg } = fairPrice;
  
  if (budget < min) {
    return {
      isReasonable: false,
      message: `Budget is below fair price range (₹${min} - ₹${max})`,
      percentage: ((budget / min) * 100).toFixed(0)
    };
  }
  
  if (budget > max) {
    return {
      isReasonable: true,
      message: `Budget is above fair price range. You may be overpaying.`,
      percentage: ((budget / max) * 100).toFixed(0)
    };
  }
  
  if (budget >= avg * 0.9 && budget <= avg * 1.1) {
    return {
      isReasonable: true,
      message: `Budget is within fair market price ✅`,
      percentage: ((budget / avg) * 100).toFixed(0)
    };
  }
  
  return {
    isReasonable: true,
    message: `Budget is within fair price range`,
    percentage: ((budget / avg) * 100).toFixed(0)
  };
}

module.exports = {
  calculateFairPrice,
  validateBudget
};

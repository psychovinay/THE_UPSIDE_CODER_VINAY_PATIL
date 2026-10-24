import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, DollarSign, AlertCircle,
  Loader2, Sparkles, TrendingUp, CheckCircle, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';

export default function PostJob() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  const [formData, setFormData] = useState({
    serviceId: '',
    title: '',
    description: '',
    location: {
      address: '',
      city: user?.city || '',
      pincode: user?.pincode || ''
    },
    preferredTime: {
      date: '',
      timeSlot: ''
    },
    budget: '',
    urgency: 'normal'
  });

  const [fairPrice, setFairPrice] = useState(null);
  const [budgetValidation, setBudgetValidation] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await api.getServices();
        setServices(data);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      }
    };
    fetchServices();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const handleTimeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      preferredTime: {
        ...prev.preferredTime,
        [field]: value
      }
    }));
  };

  const calculateFairPrice = async () => {
    if (!formData.serviceId || !formData.description) {
      toast.error('Please select a service and describe your job');
      return;
    }

    try {
      setCalculatingPrice(true);
      const service = services.find(s => s._id === formData.serviceId);
      const result = await api.calculateFairPrice(
        service?.id || 'electrician',
        formData.location.city,
        formData.urgency,
        formData.description
      );
      setFairPrice(result);
      
      if (formData.budget) {
        const validation = validateBudget(formData.budget, result);
        setBudgetValidation(validation);
      }
    } catch (error) {
      console.error('Failed to calculate fair price:', error);
      toast.error('Failed to calculate fair price');
    } finally {
      setCalculatingPrice(false);
    }
  };

  const validateBudget = (budget, fairPrice) => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.serviceId || !formData.title || !formData.description || !formData.budget) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const result = await api.createJob(formData);
      
      setFairPrice(result.fairPrice);
      setBudgetValidation(result.budgetValidation);
      setMatches(result.matches);
      
      toast.success('Job posted! Finding best matches...');
    } catch (error) {
      console.error('Failed to post job:', error);
      toast.error('Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 md:pb-8">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Post a Job</h1>
          <p className="text-xs text-slate-500">
            Describe your needs and we'll find the right worker at a fair price
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Selection */}
          <div>
            <label className="label">Service Type *</label>
            <select
              value={formData.serviceId}
              onChange={(e) => handleInputChange('serviceId', e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select a service</option>
              {services.map(s => (
                <option key={s._id} value={s._id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          {/* Job Title */}
          <div>
            <label className="label">Job Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Fix leaking tap, Install ceiling fan"
              className="input-field"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Describe the problem *</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what needs to be done, any specific requirements, etc."
              className="input-field resize-none"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="label">Location</label>
            <input
              type="text"
              value={formData.location.address}
              onChange={(e) => handleLocationChange('address', e.target.value)}
              placeholder="Address"
              className="input-field"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                placeholder="City"
                className="input-field"
              />
              <input
                type="text"
                value={formData.location.pincode}
                onChange={(e) => handleLocationChange('pincode', e.target.value)}
                placeholder="PIN Code"
                className="input-field"
              />
            </div>
          </div>

          {/* Preferred Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preferred Date</label>
              <input
                type="date"
                value={formData.preferredTime.date}
                onChange={(e) => handleTimeChange('date', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Time Slot</label>
              <select
                value={formData.preferredTime.timeSlot}
                onChange={(e) => handleTimeChange('timeSlot', e.target.value)}
                className="input-field"
              >
                <option value="">Select time</option>
                <option value="9 AM - 12 PM">9 AM - 12 PM</option>
                <option value="12 PM - 3 PM">12 PM - 3 PM</option>
                <option value="3 PM - 6 PM">3 PM - 6 PM</option>
                <option value="6 PM - 9 PM">6 PM - 9 PM</option>
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="label">Your Budget (₹) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="Enter your budget"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="label">Urgency</label>
            <select
              value={formData.urgency}
              onChange={(e) => handleInputChange('urgency', e.target.value)}
              className="input-field"
            >
              <option value="low">🟢 Low - Flexible timing</option>
              <option value="normal">🟡 Normal - Within a few days</option>
              <option value="high">🟠 High - Today or tomorrow</option>
              <option value="urgent">🔴 Urgent - As soon as possible</option>
            </select>
          </div>

          {/* Fair Price Check */}
          <button
            type="button"
            onClick={calculateFairPrice}
            disabled={calculatingPrice}
            className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
          >
            {calculatingPrice ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Check Fair Price
          </button>

          {/* Fair Price Result */}
          {fairPrice && (
            <div className="card bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-teal-800">Local Fair Price</h3>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Estimated Range:</span>
                <span className="text-lg font-bold text-teal-700">
                  ₹{fairPrice.min} - ₹{fairPrice.max}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600">Average:</span>
                <span className="text-base font-semibold text-slate-800">
                  ₹{fairPrice.avg}
                </span>
              </div>
              
              {budgetValidation && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${
                  budgetValidation.isReasonable ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {budgetValidation.isReasonable ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${
                      budgetValidation.isReasonable ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {budgetValidation.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Post Job & Find Matches
          </button>
        </form>

        {/* Match Results */}
        {matches.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Best Matches ({matches.length})
            </h2>
            {matches.map((match, index) => (
              <div key={match.workerId} className="card p-4 border-l-4 border-l-teal-600">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {index === 0 && <span className="badge badge-amber">🥇 Best Match</span>}
                      <h3 className="font-bold text-slate-800">{match.worker.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {match.worker.skills?.join(', ') || 'Service Provider'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-teal-600">{match.matchScore}%</div>
                    <div className="text-xs text-slate-400">Match Score</div>
                  </div>
                </div>

                {/* Match Factors */}
                <div className="grid grid-cols-5 gap-2 text-center text-xs mb-3">
                  <div>
                    <div className="font-bold text-slate-800">{match.matchFactors.skill}</div>
                    <div className="text-slate-400">Skill</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{match.matchFactors.distance}</div>
                    <div className="text-slate-400">Distance</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{match.matchFactors.availability}</div>
                    <div className="text-slate-400">Available</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{match.matchFactors.price}</div>
                    <div className="text-slate-400">Price</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{match.matchFactors.trust}</div>
                    <div className="text-slate-400">Trust</div>
                  </div>
                </div>

                {/* KaamScore */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">KaamScore: {match.kaamScore}/100</span>
                  <button
                    onClick={() => navigate(`/customer/worker/${match.workerId}`)}
                    className="text-teal-600 font-semibold hover:underline"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

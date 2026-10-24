import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, MapPin, Clock, DollarSign, Sparkles,
  Loader2, CheckCircle, XCircle, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';

export default function JobNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?._id) return;
      try {
        setLoading(true);
        const data = await api.getJobs({ role: 'worker' });
        setJobs(data || []);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [user?._id]);

  const handleAcceptJob = async (jobId, amount) => {
    try {
      await api.acceptJob(jobId, amount, 'I can do this job');
      toast.success('Job accepted! Waiting for customer response');
      navigate(`/worker/negotiate/${jobId}`);
    } catch (error) {
      console.error('Failed to accept job:', error);
      toast.error('Failed to accept job');
    }
  };

  const handleCounterOffer = (jobId) => {
    navigate(`/worker/negotiate/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 md:pb-8">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Nearby Jobs</h1>
            <p className="text-xs text-slate-500">
              Jobs matching your skills and location
            </p>
          </div>
          <span className="badge badge-teal">{jobs.length} New</span>
        </div>

        {jobs.length === 0 ? (
          <div className="card p-8 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 mb-1">No jobs available</h3>
            <p className="text-sm text-slate-500">
              Check back later for new job opportunities
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="card p-4 border-l-4 border-l-teal-600">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge-teal text-xs">
                        {job.serviceId?.name || 'Service'}
                      </span>
                      {job.matchScore && (
                        <span className="text-xs font-bold text-teal-700">
                          {job.matchScore}% Match
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">
                      {job.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {job.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location?.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {job.preferredTime?.date 
                        ? new Date(job.preferredTime.date).toLocaleDateString()
                        : 'Flexible'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="text-xs text-slate-500">Budget:</span>
                      <span className="font-bold text-slate-800 ml-1">
                        ₹{job.budget}
                      </span>
                    </div>
                  </div>
                  {job.estimatedPriceRange && (
                    <div className="text-xs text-slate-500">
                      Fair: ₹{job.estimatedPriceRange.min} - ₹{job.estimatedPriceRange.max}
                    </div>
                  )}
                </div>

                {/* Urgency Badge */}
                <div className="mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    job.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                    job.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                    job.urgency === 'low' ? 'bg-green-100 text-green-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {job.urgency?.toUpperCase() || 'NORMAL'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptJob(job._id, job.budget)}
                    className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Accept ₹{job.budget}
                  </button>
                  <button
                    onClick={() => handleCounterOffer(job._id)}
                    className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Counter Offer
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

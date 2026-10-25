import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Wallet,
  Star,
  Users,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Bell,
  PhoneCall,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import StarRating from '../../components/StarRating';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkerData = async () => {
      if (!user?._id) return;

      // Offline demo mode: no real JWT token → skip API calls, use stored user data
      const token = localStorage.getItem('sevasaathi_token');
      if (!token) {
        setWorker(user);
        setIsAvailable(user?.available ?? true);
        setBookings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [workerData, bookingsData] = await Promise.all([
          api.getWorker(user._id),
          api.getWorkerBookings(user._id)
        ]);
        setWorker(workerData);
        setIsAvailable(workerData?.available ?? true);
        setBookings(bookingsData || []);
      } catch (error) {
        console.error('Failed to fetch worker data:', error);
        // Graceful fallback to user context data
        setWorker(user);
        setIsAvailable(user?.available ?? true);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkerData();
  }, [user?._id]);

  // Active jobs for this worker
  const activeJobs = bookings.filter(
    (b) => ['accepted', 'en_route'].includes(b.status)
  );

  const pendingOffersCount = bookings.filter(
    (b) => b.status === 'pending'
  ).length;

  const handleToggleAvailability = async () => {
    try {
      const nextState = !isAvailable;
      await api.toggleWorkerAvailability(user._id);
      setIsAvailable(nextState);
      if (nextState) {
        toast.success('You are now ONLINE & receiving job alerts! 🟢');
      } else {
        toast('You are now OFFLINE. Enjoy your rest! 🔴');
      }
    } catch (error) {
      toast.error('Failed to update availability');
    }
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
        {/* Profile & Availability Card */}
        <div className="card p-5 bg-gradient-to-r from-slate-900 to-teal-950 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-full ${worker?.avatarColor || 'bg-teal-600'} text-white font-bold text-xl flex items-center justify-center border-2 border-teal-400`}
              >
                {worker?.initials || 'WK'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-bold">{worker?.name || 'Worker'}</h2>
                  {worker?.aadhaarVerified && (
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                  )}
                </div>
                <p className="text-xs text-teal-300">{worker?.skills?.[0] || 'Service'} • {worker?.city || 'Location'}</p>
                <div className="flex items-center gap-1 mt-1">
                  <StarRating rating={worker?.rating || 0} size="sm" readonly />
                  <span className="text-xs text-slate-300 ml-1">({worker?.reviewCount || 0})</span>
                </div>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-slate-300 mb-1 font-medium">
                {isAvailable ? 'Available' : 'Busy / Off'}
              </span>
              <button
                type="button"
                onClick={handleToggleAvailability}
                className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAvailable ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAvailable ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3.5 text-center">
            <p className="text-xs text-slate-500 font-medium">Today's Jobs</p>
            <p className="text-xl font-black text-slate-800 mt-1">3</p>
          </div>
          <div className="card p-3.5 text-center">
            <p className="text-xs text-slate-500 font-medium">This Week</p>
            <p className="text-xl font-black text-teal-700 mt-1">₹4,850</p>
          </div>
          <div className="card p-3.5 text-center">
            <p className="text-xs text-slate-500 font-medium">Rating</p>
            <p className="text-xl font-black text-amber-500 mt-1">4.8 ★</p>
          </div>
        </div>

        {/* Pending Job Offers Alert Banner */}
        <Link
          to="/worker/jobs"
          className="card p-4 bg-amber-50 border border-amber-200 flex items-center justify-between hover:bg-amber-100/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                {pendingOffersCount} New Job Request{pendingOffersCount > 1 ? 's' : ''}!
              </h4>
              <p className="text-xs text-amber-800">Customers nearby need your service right now</p>
            </div>
          </div>
          <span className="btn-primary text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700">
            View Offers
          </span>
        </Link>

        {/* Active Jobs in Progress */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" /> Active Job Assignment
          </h3>

          {activeJobs.length === 0 ? (
            <div className="card p-6 text-center text-slate-400 text-xs">
              No current job in progress. Check job offers to accept new bookings.
            </div>
          ) : (
            activeJobs.map((job) => (
              <div key={job._id || job.id} className="card p-4 sm:p-5 border-l-4 border-l-teal-600 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="badge badge-teal text-[11px] mb-1">{job.serviceId?.name || 'Service'}</span>
                    <h4 className="font-bold text-slate-800 text-base">{job.customerId?.name || 'Customer'}</h4>
                  </div>
                  <span className="font-bold text-teal-700 text-sm">₹{job.budget}</span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Scheduled for {job.time}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/worker/arrival-otp/${job._id || job.id}`)}
                    className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1"
                  >
                    Enter Arrival OTP
                  </button>
                  <button
                    onClick={() => navigate(`/worker/complete-otp/${job._id || job.id}`)}
                    className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1"
                  >
                    Complete Job
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Nav Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/worker/earnings"
            className="card card-hover p-4 flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Earnings</p>
              <p className="text-[11px] text-slate-500">Weekly payouts & bank</p>
            </div>
          </Link>

          <Link
            to="/worker/reviews"
            className="card card-hover p-4 flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Reviews</p>
              <p className="text-[11px] text-slate-500">Ratings & feedback</p>
            </div>
          </Link>

          <Link
            to="/worker/referral"
            className="card card-hover p-4 flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Refer & Earn</p>
              <p className="text-[11px] text-slate-500">₹100 per friend</p>
            </div>
          </Link>

          <Link
            to="/ivr"
            className="card card-hover p-4 flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">IVR Mode</p>
              <p className="text-[11px] text-slate-500">Basic phone simulator</p>
            </div>
          </Link>
        </div>

        {/* Weekly Earnings Visual Bar */}
        <div className="card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800 text-sm">This Week's Activity</h4>
            <span className="text-xs text-teal-700 font-semibold">Total ₹4,850</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1">
            {[
              { day: 'Mon', h: 'h-12', val: '₹600' },
              { day: 'Tue', h: 'h-16', val: '₹850' },
              { day: 'Wed', h: 'h-8', val: '₹400' },
              { day: 'Thu', h: 'h-20', val: '₹1100' },
              { day: 'Fri', h: 'h-14', val: '₹700' },
              { day: 'Sat', h: 'h-24', val: '₹1200' },
              { day: 'Sun', h: 'h-0', val: '₹0' },
            ].map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-full max-w-[28px] ${bar.h || 'h-1'} bg-teal-600 rounded-t-md hover:bg-teal-700 transition-all`}
                  title={bar.val}
                />
                <span className="text-[10px] text-slate-400 font-medium">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

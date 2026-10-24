import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  PhoneCall,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [statsData, activityData] = await Promise.all([
          api.getAdminStats(),
          api.getAdminActivity()
        ]);
        setStats(statsData);
        setActivity(activityData || []);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const statCards = stats ? [
    { label: 'Registered Workers', value: stats.totalWorkers || 0, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Active Today', value: stats.activeWorkers || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Aadhaar Pending', value: stats.pendingVerification || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Customers', value: (stats.totalCustomers || 0).toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Bookings Today', value: stats.bookingsToday || 0, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Open Disputes', value: stats.openDisputes || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ] : [];

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

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Console</h1>
            <p className="text-xs text-slate-500">
              National marketplace monitoring, safety audits, and worker moderation
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/admin/workers"
              className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Verify Workers
            </Link>
            <Link
              to="/admin/disputes"
              className="btn-secondary py-2 px-3.5 text-xs flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" /> Disputes
            </Link>
            <Link
              to="/ivr"
              className="btn-ghost border border-slate-200 py-2 px-3.5 text-xs flex items-center gap-1.5"
            >
              <PhoneCall className="w-4 h-4" /> IVR Test
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="card p-4 flex items-center gap-3.5">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue & City Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Monthly GMV Volume</h3>
              <span className="badge badge-teal text-xs">↑ 18.4% vs last month</span>
            </div>
            <p className="text-3xl font-black text-teal-800">₹23,41,000</p>
            <p className="text-xs text-slate-500">
              Direct peer-to-peer payouts processed with zero transaction commission for worker empowerment.
            </p>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Top Demand Metros</h3>
            <div className="space-y-2 text-xs">
              {[
                { city: 'Delhi-NCR', count: '1,842 requests', pct: '42%' },
                { city: 'Bengaluru', count: '1,320 requests', pct: '30%' },
                { city: 'Mumbai', count: '980 requests', pct: '22%' },
                { city: 'Hyderabad', count: '640 requests', pct: '6%' },
              ].map((c) => (
                <div key={c.city} className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{c.city}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{c.count}</span>
                    <span className="font-bold text-teal-700 w-10 text-right">{c.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Marketplace Activity Feed */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              Live Marketplace Activity Stream
            </h3>
            <span className="text-xs text-slate-400">Real-time sync</span>
          </div>

          <div className="space-y-3">
            {activity.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-4">
                No recent activity
              </div>
            ) : (
              activity.map((ev) => (
                <div key={ev._id || ev.id} className="flex items-start justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-700 font-medium">{ev.description || ev.text || 'Activity'}</span>
                  <span className="text-slate-400 whitespace-nowrap ml-4">
                    {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ev.time || 'Just now'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

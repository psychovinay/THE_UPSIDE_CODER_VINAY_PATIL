import React from 'react';
import { ShieldCheck, Clock, Users, FileText, Award, Briefcase, Star } from 'lucide-react';

export default function TrustCard({ kaamScore, breakdown }) {
  if (!kaamScore) return null;

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-amber-500';
    if (score >= 30) return 'text-blue-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return '🟢 Highly Reliable';
    if (score >= 70) return '🟢 Reliable';
    if (score >= 50) return '🟡 Growing Profile';
    if (score >= 30) return '🔵 New Worker';
    return '🔴 Needs Improvement';
  };

  return (
    <div className="card bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900">KaamScore</h3>
        </div>
        <div className={`text-2xl font-black ${getScoreColor(kaamScore)}`}>
          {kaamScore}/100
        </div>
      </div>

      <div className={`text-sm font-semibold mb-4 ${getScoreColor(kaamScore)}`}>
        {getScoreLabel(kaamScore)}
      </div>

      {breakdown && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600">Completed Jobs</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-800">{breakdown.completedJobs?.value || 0}</span>
              <span className="text-slate-400 ml-1">({breakdown.completedJobs?.weight || '30%'})</span>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-teal-600 h-1.5 rounded-full"
              style={{ width: `${(breakdown.completedJobs?.score / breakdown.completedJobs?.max) * 100 || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600">Customer Rating</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-800">{breakdown.rating?.value || 0} ⭐</span>
              <span className="text-slate-400 ml-1">({breakdown.rating?.weight || '25%'})</span>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-amber-400 h-1.5 rounded-full"
              style={{ width: `${(breakdown.rating?.score / breakdown.rating?.max) * 100 || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600">On-time Rate</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-800">{breakdown.onTimeRate?.value || '0%'}</span>
              <span className="text-slate-400 ml-1">({breakdown.onTimeRate?.weight || '20%'})</span>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full"
              style={{ width: `${(breakdown.onTimeRate?.score / breakdown.onTimeRate?.max) * 100 || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600">Repeat Customers</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-800">{Math.round((breakdown.repeatCustomers?.value || 0) * 100)}%</span>
              <span className="text-slate-400 ml-1">({breakdown.repeatCustomers?.weight || '15%'})</span>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${(breakdown.repeatCustomers?.score / breakdown.repeatCustomers?.max) * 100 || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600">Profile Complete</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-800">{breakdown.profileCompleteness?.value || '0%'}</span>
              <span className="text-slate-400 ml-1">({breakdown.profileCompleteness?.weight || '10%'})</span>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-purple-500 h-1.5 rounded-full"
              style={{ width: `${(breakdown.profileCompleteness?.score / breakdown.profileCompleteness?.max) * 100 || 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
        <p className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Composite trust score based on job history, ratings, and reliability
        </p>
      </div>
    </div>
  );
}

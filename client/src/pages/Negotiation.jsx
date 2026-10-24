import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, DollarSign, Clock, Send,
  CheckCircle, XCircle, Loader2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

export default function Negotiation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [negotiation, setNegotiation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const jobData = await api.getJob(id);
        setJob(jobData);
        
        // If there's an active negotiation, load it
        if (jobData.status === 'negotiating') {
          // In production, fetch negotiation by job ID
          // For now, we'll create a mock negotiation
          setNegotiation({
            offers: [
              {
                party: 'customer',
                amount: jobData.budget,
                message: 'This is my budget for the job',
                timestamp: new Date()
              }
            ],
            status: 'pending'
          });
          setOfferAmount(jobData.budget);
        }
      } catch (error) {
        console.error('Failed to fetch job:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSendOffer = async () => {
    if (!offerAmount) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      setSending(true);
      await api.negotiateJob(id, parseInt(offerAmount), offerMessage);
      
      // Add offer to local state
      setNegotiation(prev => ({
        ...prev,
        offers: [
          ...prev.offers,
          {
            party: 'worker', // In production, get from user role
            amount: parseInt(offerAmount),
            message: offerMessage,
            timestamp: new Date()
          }
        ]
      }));
      
      setOfferMessage('');
      toast.success('Counter-offer sent!');
    } catch (error) {
      console.error('Failed to send offer:', error);
      toast.error('Failed to send offer');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptOffer = async (negotiationId) => {
    try {
      await api.acceptOffer(id, negotiationId);
      toast.success('Offer accepted! Job confirmed.');
      navigate('/worker/dashboard');
    } catch (error) {
      console.error('Failed to accept offer:', error);
      toast.error('Failed to accept offer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Job not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 md:pb-8">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Negotiation</h1>
            <p className="text-xs text-slate-500">Job #{id.slice(-6)}</p>
          </div>
        </div>

        {/* Job Summary */}
        <div className="card p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200">
          <h3 className="font-bold text-slate-800 mb-2">{job.title}</h3>
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{job.description}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Customer Budget:</span>
            <span className="font-bold text-teal-700">₹{job.budget}</span>
          </div>
        </div>

        {/* Negotiation History */}
        {negotiation && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Offer History
            </h2>

            <div className="space-y-3">
              {negotiation.offers.map((offer, index) => (
                <div
                  key={index}
                  className={`card p-4 ${
                    offer.party === 'customer' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-teal-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        offer.party === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
                      }`}>
                        {offer.party === 'customer' ? 'Customer' : 'Worker'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(offer.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-slate-800">₹{offer.amount}</span>
                    </div>
                  </div>
                  {offer.message && (
                    <p className="text-sm text-slate-600 italic">"{offer.message}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Counter-Offer */}
        <div className="card p-4">
          <h3 className="font-bold text-slate-800 text-sm mb-3">Send Counter-Offer</h3>
          
          <div className="space-y-3">
            <div>
              <label className="label">Your Price (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="Enter your price"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Message (Optional)</label>
              <textarea
                rows={2}
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="Explain your price (e.g., includes materials, extra work required)"
                className="input-field resize-none text-sm"
              />
            </div>

            <button
              onClick={handleSendOffer}
              disabled={sending}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Counter-Offer
            </button>
          </div>
        </div>

        {/* Accept Last Offer */}
        {negotiation && negotiation.offers.length > 1 && (
          <div className="card p-4 bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-green-800 text-sm mb-1">
                  Accept Last Offer?
                </h3>
                <p className="text-xs text-green-700 mb-3">
                  Customer offered ₹{negotiation.offers[negotiation.offers.length - 1].amount}
                </p>
                <button
                  onClick={() => handleAcceptOffer(negotiation._id)}
                  className="btn-primary bg-green-600 hover:bg-green-700 py-2 text-xs w-full"
                >
                  Accept & Confirm Job
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Price Comparison */}
        {job.estimatedPriceRange && (
          <div className="card p-4 bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-800 text-sm mb-1">Fair Price Range</h3>
                <p className="text-xs text-amber-700">
                  Local fair price: ₹{job.estimatedPriceRange.min} - ₹{job.estimatedPriceRange.max}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

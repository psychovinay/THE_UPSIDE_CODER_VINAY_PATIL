import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Briefcase, Shield, ChevronDown, ChevronUp, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';
import { SERVICES } from '../data/mockData';

const ROLES = [
  {
    id: 'customer',
    label: 'Customer',
    desc: 'Book home services near you',
    icon: <User className="w-5 h-5" />,
  },
  {
    id: 'worker',
    label: 'Worker',
    desc: 'Find jobs & earn more',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    id: 'admin',
    label: 'Admin',
    desc: 'Platform moderation',
    icon: <Shield className="w-5 h-5" />,
  },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin, register } = useAuth();

  const preselect = location.state?.role || 'customer';

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState(preselect);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  
  // Worker registration fields
  const [skills, setSkills] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [fixedRate, setFixedRate] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [workerLocation, setWorkerLocation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(true);

  const validatePhone = (p) => /^[6-9]\d{9}$/.test(p.replace(/\D/g, ''));

  const navigateForRole = (userRole) => {
    if (userRole === 'customer') navigate('/customer');
    else if (userRole === 'worker') navigate('/worker');
    else navigate('/admin');
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!pin || pin.length !== 4) {
      setError('Please enter your 4-digit PIN.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(cleanPhone, pin, role);
      setLoading(false);
      if (result && result.success) {
        toast.success(`Welcome back, ${result.user?.name || 'User'}! 👋`);
        navigateForRole(role);
      } else {
        setError(result?.error || 'Invalid credentials. Please try a demo account.');
      }
    } catch (err) {
      setLoading(false);
      setError('Login failed. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!pin || pin.length !== 4) {
      setError('Please enter your 4-digit PIN.');
      return;
    }

    if (!name || name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    // Customer-specific validation
    if (role === 'customer') {
      if (!city || city.trim().length < 2) {
        setError('Please enter your city.');
        return;
      }
    }

    // Worker-specific validation
    if (role === 'worker') {
      if (!skills || skills.trim().length < 2) {
        setError('Please enter your skills.');
        return;
      }
      if (!serviceId) {
        setError('Please select a service category.');
        return;
      }
      if (!workerLocation || workerLocation.trim().length < 2) {
        setError('Please enter your location.');
        return;
      }
    }

    setLoading(true);
    try {
      const userData = {
        phone: cleanPhone,
        pin,
        role,
        name,
        city,
        pincode,
      };

      // Add worker-specific fields
      if (role === 'worker') {
        userData.skills = skills.split(',').map(s => s.trim());
        userData.serviceId = serviceId;
        userData.hourlyRate = hourlyRate ? Number(hourlyRate) : null;
        userData.fixedRate = fixedRate ? Number(fixedRate) : null;
        userData.experience = experience;
        userData.bio = bio;
        userData.languages = languages.split(',').map(l => l.trim());
        userData.workingHours = workingHours;
        userData.location = workerLocation;
      }

      const result = await register(userData);
      setLoading(false);
      if (result && result.success) {
        toast.success(`Registration successful! Welcome, ${result.user?.name || 'User'}! 🎉`);
        navigateForRole(role);
      } else {
        setError(result?.error || 'Registration failed.');
      }
    } catch (err) {
      setLoading(false);
      setError('Registration failed. Please try again.');
    }
  };

  const handleInstantDemoLogin = (demo) => {
    setRole(demo.role);
    setPhone(demo.phone);
    setPin(demo.pin);
    setError('');
    
    // Instant login
    demoLogin(demo);
    toast.success(`Logged in as ${demo.name} (${demo.role.toUpperCase()})! 🚀`);
    navigateForRole(demo.role);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-8 px-4">
      {/* Brand Logo */}
      <div className="mb-6 text-center">
        <h1
          className="text-3xl font-black text-slate-900 cursor-pointer tracking-tight"
          onClick={() => navigate('/')}
        >
          Seva<span className="text-teal-600">Saathi</span>
        </h1>
        <p className="text-slate-500 text-xs mt-1 font-medium">
          Har kaam ke liye, ek saathi
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
        {/* Login/Register Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              !isRegister
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              isRegister
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div>
          <label className="label mb-2">Select Account Type</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id);
                  setError('');
                  // Reset all fields when switching roles
                  setName('');
                  setCity('');
                  setPincode('');
                  setSkills('');
                  setServiceId('');
                  setHourlyRate('');
                  setFixedRate('');
                  setExperience('');
                  setBio('');
                  setLanguages('');
                  setWorkingHours('');
                  setWorkerLocation('');
                  
                  // Auto-fill default demo account for role
                  const defaultAcc = DEMO_ACCOUNTS.find((a) => a.role === r.id);
                  if (defaultAcc) {
                    setPhone(defaultAcc.phone);
                    setPin(defaultAcc.pin);
                  }
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  role === r.id
                    ? 'border-teal-600 bg-teal-50/60 text-teal-800 font-bold ring-2 ring-teal-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200'
                }`}
              >
                <span className={role === r.id ? 'text-teal-600' : 'text-slate-400'}>
                  {r.icon}
                </span>
                <span className="text-xs mt-1">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Phone Input */}
        <div>
          <label className="label">Mobile Number</label>
          <input
            type="tel"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="Enter 10-digit mobile number"
            className="input-field text-sm font-medium"
          />
        </div>

        {/* Registration Fields */}
        {isRegister && (
          <>
            {/* Name Input */}
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your full name"
                className="input-field text-sm font-medium"
              />
            </div>

            {/* City Input (Customer only) */}
            {role === 'customer' && (
              <div>
                <label className="label">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your city"
                  className="input-field text-sm font-medium"
                />
              </div>
            )}

            {/* PIN Code Input (Customer only) */}
            {role === 'customer' && (
              <div>
                <label className="label">PIN Code (Optional)</label>
                <input
                  type="tel"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="Enter your PIN code"
                  className="input-field text-sm font-medium"
                />
              </div>
            )}

            {/* Worker Registration Fields */}
            {role === 'worker' && (
              <>
                <div>
                  <label className="label">Skills *</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => {
                      setSkills(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g., Wiring, Fan Installation (comma separated)"
                    className="input-field text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="label">Service Category *</label>
                  <select
                    value={serviceId}
                    onChange={(e) => {
                      setServiceId(e.target.value);
                      setError('');
                    }}
                    className="input-field text-sm font-medium"
                  >
                    <option value="">Select a service</option>
                    {SERVICES.map(s => (
                      <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="e.g., 350"
                    className="input-field text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="label">Fixed Rate (₹)</label>
                  <input
                    type="number"
                    value={fixedRate}
                    onChange={(e) => setFixedRate(e.target.value)}
                    placeholder="e.g., 500 (if not hourly)"
                    className="input-field text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="label">Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g., 5 years"
                    className="input-field text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="label">Bio</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your expertise..."
                    className="input-field text-sm font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="label">Languages (comma separated)</label>
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="e.g., Hindi, English"
                    className="input-field text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="label">Working Hours</label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="e.g., 9 AM - 6 PM"
                    className="input-field text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="label">Location *</label>
                  <input
                    type="text"
                    value={workerLocation}
                    onChange={(e) => {
                      setWorkerLocation(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g., Karol Bagh, New Delhi"
                    className="input-field text-sm font-medium"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* PIN Input */}
        <div>
          <label className="label">4-Digit Security PIN *</label>
          <OTPInput
            length={4}
            value={pin}
            onChange={(v) => {
              setPin(v);
              setError('');
            }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
            {error}
          </div>
        )}

        {/* Login/Register Button */}
        <button
          type="button"
          onClick={isRegister ? handleRegister : handleLogin}
          disabled={loading}
          className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2 shadow"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {isRegister ? 'Registering…' : 'Logging in…'}
            </>
          ) : (
            <>
              {isRegister ? 'Register' : 'Sign In'} as {role.charAt(0).toUpperCase() + role.slice(1)}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          Want to offer services?{' '}
          <button
            type="button"
            className="text-teal-600 font-semibold hover:underline"
            onClick={() => navigate('/worker/register')}
          >
            Register as Worker Partner
          </button>
        </p>
      </div>

      {/* 1-Click Demo Accounts Selector */}
      <div className="w-full max-w-md mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
          onClick={() => setShowDemo(!showDemo)}
        >
          <span className="flex items-center gap-1.5 text-teal-700">
            <Sparkles className="w-4 h-4" /> 1-Click Instant Demo Login
          </span>
          {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDemo && (
          <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50/50">
            {DEMO_ACCOUNTS.map((demo) => (
              <div
                key={demo.id}
                className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-teal-400 transition-all"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 text-xs">{demo.name}</span>
                    <span
                      className={`badge text-[10px] ${
                        demo.role === 'customer'
                          ? 'badge-teal'
                          : demo.role === 'worker'
                          ? 'badge-amber'
                          : 'badge-slate'
                      }`}
                    >
                      {demo.role.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Phone: {demo.phone} • PIN: {demo.pin}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleInstantDemoLogin(demo)}
                  className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap bg-teal-600 hover:bg-teal-700 shadow-sm"
                >
                  Login ➔
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

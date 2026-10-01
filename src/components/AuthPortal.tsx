import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Building,
  ArrowRight,
  Shield,
  Users,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { UserAccount, UserRole, TicketTier } from '../types';
import { getStoredAccounts, saveUserAccount, saveStoredSession } from '../utils/storage';

interface AuthPortalProps {
  onLogin: (user: UserAccount) => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('host');

  // Input states (initialized strictly empty - no silent defaults)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [ticketTier, setTicketTier] = useState<TicketTier>('General');

  // Inline Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    setServerError(null);

    // Full name validation on signup
    if (authMode === 'signup') {
      if (!fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      } else if (fullName.trim().length < 2) {
        newErrors.fullName = 'Name must be at least 2 characters';
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanEmail = email.trim().toLowerCase();
    const accounts = getStoredAccounts();

    if (authMode === 'signup') {
      // Reject duplicate emails
      const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
      if (existing) {
        setErrors((prev) => ({
          ...prev,
          email: 'An account with this email address already exists. Please sign in instead.',
        }));
        return;
      }

      // Create new account
      const newUser: UserAccount = {
        id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: fullName.trim(),
        email: cleanEmail,
        password: password,
        role: selectedRole,
        profileCompleted: selectedRole === 'participant', // Hosts must complete mandatory profile
        company: company.trim() || undefined,
        ticketTier: selectedRole === 'participant' ? ticketTier : undefined,
        avatarSeed: fullName.trim().slice(0, 2).toUpperCase(),
        registeredEventIds: [],
      };

      saveUserAccount(newUser);
      saveStoredSession(newUser);
      onLogin(newUser);
    } else {
      // Sign In: must match existing email AND password
      const matched = accounts.find(
        (a) => a.email.toLowerCase() === cleanEmail && a.password === password
      );

      if (!matched) {
        setServerError('Invalid email or password. Please verify your credentials and try again.');
        return;
      }

      saveStoredSession(matched);
      onLogin(matched);
    }
  };

  // Demo helpers for easy manual testing
  const handleFillDemoHost = () => {
    setAuthMode('signin');
    setSelectedRole('host');
    setEmail('eleanor.vance@cityevents.org');
    setPassword('password123');
    setErrors({});
    setServerError(null);
  };

  const handleFillDemoParticipant = () => {
    setAuthMode('signin');
    setSelectedRole('participant');
    setEmail('marcus.chen@community.org');
    setPassword('password123');
    setErrors({});
    setServerError(null);
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col justify-between p-4 sm:p-6 select-none relative">
      {/* Top Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-extrabold text-xs text-white">
            EV
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wider">
              Eventora
            </h1>
            <p className="text-[11px] text-neutral-400">Public Events Management Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>PORTAL READY</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {authMode === 'signin' ? 'Sign In to Eventora' : 'Create an Account'}
            </h2>
            <p className="text-xs text-neutral-400">
              {selectedRole === 'host'
                ? 'Host & manage public assemblies, cultural festivals, wellness camps & athletic games.'
                : 'Discover and participate in verified public events and access your digital pass.'}
            </p>
          </div>

          {/* Role Segmented Selector */}
          <div className="grid grid-cols-2 p-1 bg-black border border-neutral-800 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('host');
                setServerError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                selectedRole === 'host'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Event Host</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('participant');
                setServerError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                selectedRole === 'participant'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Participant</span>
            </button>
          </div>

          {/* Sign In vs Sign Up Tabs */}
          <div className="flex border-b border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrors({});
                setServerError(null);
              }}
              className={`pb-2.5 px-4 font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
                authMode === 'signin'
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrors({});
                setServerError(null);
              }}
              className={`pb-2.5 px-4 font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
                authMode === 'signup'
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {authMode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: '' });
                    }}
                    placeholder="Enter your full name"
                    className={`w-full pl-9 pr-3 py-2 bg-black border rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none ${
                      errors.fullName
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-neutral-800 focus:border-neutral-500'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.fullName}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                    setServerError(null);
                  }}
                  placeholder="name@example.com"
                  className={`w-full pl-9 pr-3 py-2 bg-black border rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none ${
                    errors.email
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-neutral-800 focus:border-neutral-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                    setServerError(null);
                  }}
                  placeholder="Minimum 6 characters"
                  className={`w-full pl-9 pr-3 py-2 bg-black border rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none ${
                    errors.password
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-neutral-800 focus:border-neutral-500'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Extra field for participant signup */}
            {authMode === 'signup' && selectedRole === 'participant' && (
              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Organization / Affiliation (Optional)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. City Transit League or Student"
                    className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg mt-2"
            >
              <span>{authMode === 'signup' ? 'Complete Registration' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>

          {/* Quick Demo Credentials Toolbar */}
          <div className="pt-4 border-t border-neutral-800 space-y-2">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
              Quick Test Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleFillDemoHost}
                className="py-1.5 px-2 bg-neutral-800/80 hover:bg-neutral-800 text-[11px] text-neutral-300 font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer truncate"
                title="Fill Host: eleanor.vance@cityevents.org / password123"
              >
                Demo Host Login
              </button>
              <button
                type="button"
                onClick={handleFillDemoParticipant}
                className="py-1.5 px-2 bg-neutral-800/80 hover:bg-neutral-800 text-[11px] text-neutral-300 font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer truncate"
                title="Fill Participant: marcus.chen@community.org / password123"
              >
                Demo Participant Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-900 pt-3">
        <span>EVENTORA EVENT PLATFORM</span>
        <span>LOCAL STORAGE PERSISTED</span>
      </footer>
    </div>
  );
};

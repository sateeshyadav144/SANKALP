import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SankalpLogo } from '../components/common/SankalpLogo';
import {
  Lock,
  Mail,
  User,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  BookOpen,
  Zap,
  Loader2,
  Check,
  SquarePen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import campusGateImg from '../assets/campus_gate.jpg';

type AuthMode = 'register' | 'login' | 'forgot';

export const AuthPage: React.FC = () => {
  const { signIn, signUp, signInAsGuest, resetPassword } = useAuth();
  // Register is active by default as shown in the approved reference design
  const [mode, setMode] = useState<AuthMode>('register');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Client-side input validation
  const validateForm = (): boolean => {
    setErrorMsg(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid student email address.');
      return false;
    }

    if (!password) {
      setErrorMsg('Please enter a password.');
      return false;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return false;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please re-enter your password.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await signUp({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          roll_number: '21CS' + Math.floor(100 + Math.random() * 900),
          department: 'Computer Science & Engineering',
          semester: '6th Semester',
        });

        if (res && (res as any).session) {
          // Logged in automatically
        } else {
          setSuccessMsg(
            'Account created successfully! If email verification is enabled in your Supabase project, please check your inbox to confirm, or sign in now.'
          );
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }
      } else if (mode === 'login') {
        await signIn(email.trim(), password);
      } else if (mode === 'forgot') {
        await resetPassword(email.trim());
        setSuccessMsg('Password reset instructions have been dispatched to your email.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('user already registered')) {
        setErrorMsg('An account with this email already exists. Please Sign In instead.');
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg('Invalid email or password. Please double check your credentials.');
      } else {
        setErrorMsg(msg || 'Authentication failed. Please verify your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020B1A] text-[#F4F7FF] flex flex-col justify-between relative overflow-hidden py-5 px-4 sm:px-6 lg:px-12 selection:bg-[#00D9FF]/30 selection:text-[#00D9FF]">
      {/* =================================================================== */}
      {/* BACKGROUND AESTHETICS: Midnight Ribbon Waves & Glowing Filaments   */}
      {/* =================================================================== */}
      {/* Top fluid wave ribbon matching the reference design */}
      <div className="absolute top-0 left-0 right-0 h-72 pointer-events-none overflow-hidden z-0 opacity-70">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0,64 C280,140 520,20 800,100 C1080,180 1260,70 1440,90 L1440,0 L0,0 Z"
            fill="url(#top-wave-grad)"
            opacity="0.45"
          />
          <path
            d="M0,90 C320,180 640,40 960,130 C1200,190 1340,110 1440,120 L1440,0 L0,0 Z"
            fill="url(#top-wave-subtle)"
            opacity="0.25"
          />
          <defs>
            <linearGradient id="top-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#087BFF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#713CFF" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="top-wave-subtle" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#087BFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#020B1A" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom right curved glowing light trails matching the reference */}
      <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] pointer-events-none overflow-hidden z-0 opacity-80">
        <svg
          className="w-full h-full"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="480"
            cy="480"
            r="380"
            stroke="url(#arc-grad-1)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          <circle
            cx="480"
            cy="480"
            r="300"
            stroke="url(#arc-grad-2)"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          <circle
            cx="480"
            cy="480"
            r="220"
            stroke="#00D9FF"
            strokeWidth="1"
            strokeOpacity="0.25"
          />
          <defs>
            <linearGradient id="arc-grad-1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D9FF" />
              <stop offset="100%" stopColor="#087BFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="arc-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#087BFF" />
              <stop offset="100%" stopColor="#713CFF" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Ambient background glow diffusions */}
      <div className="absolute top-1/4 right-1/3 w-[450px] h-[450px] bg-[#087BFF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#00D9FF]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* =================================================================== */}
      {/* TOP HEADER: SANKALP Logo & Back to Home Action                     */}
      {/* =================================================================== */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-20 mb-3 sm:mb-6">
        {/* SANKALP Logo with Unified Emblem */}
        <div className="flex items-center gap-3">
          <SankalpLogo size={42} glow={true} />
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-wider leading-none">
              SANKALP
            </h1>
            <p className="text-[11px] sm:text-xs text-[#9BAFCB] font-medium tracking-normal mt-0.5">
              Smart Campus Ecosystem
            </p>
          </div>
        </div>

        {/* Top Right "Back to Home" Button */}
        <div>
          <button
            type="button"
            onClick={() => signInAsGuest()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#051122]/90 hover:bg-[#081F3D] border border-[#17365C] text-xs font-semibold text-[#F4F7FF] transition-all shadow-md group"
            title="Explore Demo Campus Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#F4F7FF] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* MAIN SPLIT-SCREEN CONTAINER                                         */}
      {/* =================================================================== */}
      <main className="w-full max-w-7xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 py-2">
        {/* =================================================================== */}
        {/* LEFT SECTION: Branding, Headings & Campus Photograph                 */}
        {/* =================================================================== */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-span-7 flex flex-col justify-center space-y-5 max-w-2xl"
        >
          {/* Pill Badge: Join SANKALP */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 shadow-[0_0_12px_rgba(0,217,255,0.12)]">
              <GraduationCap className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span className="text-xs font-semibold text-[#00D9FF] tracking-wide">
                Join SANKALP
              </span>
            </div>
          </div>

          {/* Main Headings */}
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Create Your Account
            </h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#087BFF] to-[#8B5CF6]">
              Start Your Journey
            </h3>
            <p className="text-xs sm:text-sm text-[#9BAFCB] pt-1">
              Your smart campus companion for a better tomorrow.
            </p>

            {/* Subtle Gradient Accent Line matching reference */}
            <div className="w-20 h-1 bg-gradient-to-r from-[#00D9FF] via-[#087BFF] to-[#8B5CF6] rounded-full mt-3" />
          </div>

          {/* Campus Photograph Container with Vibrant Glowing Cyan Border */}
          <div className="relative w-full rounded-2xl overflow-hidden border-2 border-[#00D9FF]/70 shadow-[0_0_28px_rgba(0,217,255,0.28)] bg-[#030E1F] group">
            <div className="relative aspect-[16/9.2] w-full overflow-hidden">
              <img
                src={campusGateImg}
                alt="Buddha Group of Institutions - Bodhi Gate"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-102"
                loading="eager"
              />
              {/* Subtle ambient bottom gradient for seamless edge blending */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020B1A]/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Three Compact Benefit Items Below Photograph */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-xs sm:text-sm font-medium text-[#F4F7FF]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#00D9FF] shrink-0" />
              <span>Smart Learning</span>
            </div>

            <div className="hidden sm:block h-3.5 w-[1px] bg-[#17365C]" />

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00D9FF] shrink-0" />
              <span>Secure & Reliable</span>
            </div>

            <div className="hidden sm:block h-3.5 w-[1px] bg-[#17365C]" />

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#087BFF] shrink-0 fill-[#087BFF]/20" />
              <span>Future Ready</span>
            </div>
          </div>
        </motion.div>

        {/* =================================================================== */}
        {/* RIGHT SECTION: Glass-Style Registration & Authentication Card       */}
        {/* =================================================================== */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-span-5 w-full"
        >
          <div className="rounded-3xl bg-[#061730]/85 backdrop-blur-2xl border border-[#17365C]/80 p-6 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.55)] relative space-y-6">
            {/* Top Switcher Tabs: Sign In & Register (Register Active by Default) */}
            <div className="flex items-center rounded-2xl bg-[#030C1C] p-1.5 border border-[#142844] shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-[#0080ff] to-[#7928ca] text-white shadow-md'
                    : 'text-[#9BAFCB] hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-[#0080ff] to-[#7928ca] text-white shadow-md'
                    : 'text-[#9BAFCB] hover:text-white'
                }`}
              >
                <SquarePen className="w-4 h-4" />
                <span>Register</span>
              </button>
            </div>

            {/* Form Title & Subtitle matching reference */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {mode === 'register' && 'Student Sign Up'}
                {mode === 'login' && 'Student Sign In'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs sm:text-sm text-[#9BAFCB]">
                {mode === 'register' && 'Create your account to access your dashboard.'}
                {mode === 'login' && 'Enter your campus credentials to access your dashboard.'}
                {mode === 'forgot' && 'Enter your student email to receive recovery instructions.'}
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </motion.div>
            )}

            {/* Success Message Alert */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300"
              >
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </motion.div>
            )}

            {/* Form Fields Container */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <AnimatePresence mode="wait">
                {mode === 'register' ? (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5"
                  >
                    {/* 1. Full Name */}
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAFCB]" />
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#041021]/90 border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#5A7394] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]/30 transition"
                      />
                    </div>

                    {/* 2. Student Email Address */}
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAFCB]" />
                      <input
                        type="email"
                        required
                        placeholder="Student Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#041021]/90 border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#5A7394] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]/30 transition"
                      />
                    </div>

                    {/* 3. Password */}
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAFCB]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#041021]/90 border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#5A7394] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]/30 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9BAFCB] hover:text-[#F4F7FF] transition"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* 4. Confirm Password */}
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAFCB]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#041021]/90 border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#5A7394] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]/30 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9BAFCB] hover:text-[#F4F7FF] transition"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                ) : mode === 'login' ? (
                  <motion.div
                    key="login-fields"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5"
                  >
                    {/* Student Email Address */}
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAFCB]" />
                      <input
                        type="email"
                        required
                        placeholder="Student Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#041021]/90 border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#5A7394] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]/30 transition"
                      />
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAFCB]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#041021]/90 border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#5A7394] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]/30 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9BAFCB] hover:text-[#F4F7FF] transition"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-xs text-[#00D9FF] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="forgot-fields"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5"
                  >
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAFCB]" />
                      <input
                        type="email"
                        required
                        placeholder="Student Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#041021]/90 border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#5A7394] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]/30 transition"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Submit Button: Cyan -> Blue -> Violet gradient with Right Arrow */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#00D9FF] via-[#087BFF] to-[#8B5CF6] hover:opacity-95 transition-all shadow-lg shadow-[#087BFF]/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : mode === 'register' ? (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </motion.button>
              </div>
            </form>

            {/* Footer Links & Security Badge */}
            <div className="pt-2 border-t border-[#17365C]/80 space-y-3 text-center">
              {/* Already have an account? Sign In / Register toggle */}
              <p className="text-xs text-[#9BAFCB]">
                {mode === 'register' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[#00D9FF] font-semibold hover:underline"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[#00D9FF] font-semibold hover:underline"
                    >
                      Register
                    </button>
                  </>
                )}
              </p>

              {/* Security Shield Badge */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#9BAFCB]">
                <ShieldCheck className="w-4 h-4 text-[#00D6B5]" />
                <span>Your data is safe with us</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Clean Bottom Copyright / Campus Tagline */}
      <footer className="w-full max-w-7xl mx-auto text-center text-[11px] text-[#9BAFCB]/60 font-mono py-1 z-20">
        SANKALP • Smart Campus Ecosystem
      </footer>
    </div>
  );
};

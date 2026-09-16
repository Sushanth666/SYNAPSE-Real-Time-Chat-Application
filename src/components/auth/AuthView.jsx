import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Shield, Sparkles, ArrowRight, UserPlus, LogIn, Mail, Lock, Eye, EyeOff, User as UserIcon, Briefcase, Sun, Moon, CheckCircle2, BarChart2, Mic, Activity, CheckCheck, AlertTriangle, X, UserCheck } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';
export const AuthView = () => {
    const { login, register, allUsers } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [forgotNotice, setForgotNotice] = useState(null);
    const [authPopup, setAuthPopup] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            const failData = {
                type: 'login_failed',
                title: 'Email Required',
                message: 'Please enter your email address to sign in.'
            };
            setError({
                code: 'MISSING_FIELD',
                title: failData.title,
                message: failData.message
            });
            setAuthPopup(failData);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            const failData = {
                type: 'login_failed',
                title: 'Invalid Email Format',
                message: 'Please enter a valid email address (e.g. alex@example.com).'
            };
            setError({
                code: 'INVALID_EMAIL',
                title: failData.title,
                message: failData.message
            });
            setAuthPopup(failData);
            return;
        }

        if (!password) {
            const failData = {
                type: 'login_failed',
                title: 'Password Required',
                message: 'Please enter your password to continue.'
            };
            setError({
                code: 'MISSING_FIELD',
                title: failData.title,
                message: failData.message
            });
            setAuthPopup(failData);
            return;
        }

        setSubmitting(true);
        try {
            await login(trimmedEmail, password, {
                onSuccess: async (authUser) => {
                    setAuthPopup({
                        type: 'login_success',
                        title: 'Login Successful!',
                        message: `Welcome back, ${authUser.name}! Connecting to your workspace...`,
                        user: authUser
                    });
                    // Show popup for 1.2 seconds before navigating for fast 1-2s loading
                    await new Promise(r => setTimeout(r, 1200));
                }
            });
        }
        catch (err) {
            const errCode = err.code || (err.message?.toLowerCase().includes('not registered') ? 'EMAIL_NOT_REGISTERED' : err.message?.toLowerCase().includes('password') ? 'INCORRECT_PASSWORD' : 'AUTH_ERROR');
            
            if (errCode === 'EMAIL_NOT_REGISTERED') {
                const failData = {
                    type: 'login_failed',
                    code: 'EMAIL_NOT_REGISTERED',
                    title: 'Email Not Registered',
                    message: `No account was found for "${trimmedEmail}". Would you like to create a new account?`,
                    actionLabel: `Register as ${trimmedEmail} →`,
                    onAction: () => {
                        setMode('register');
                        setEmail(trimmedEmail);
                        setError(null);
                        setAuthPopup(null);
                    }
                };
                setError(failData);
                setAuthPopup(failData);
            } else if (errCode === 'INCORRECT_PASSWORD') {
                const failData = {
                    type: 'login_failed',
                    code: 'INCORRECT_PASSWORD',
                    title: 'Incorrect Password',
                    message: 'The password you entered does not match our records. Please try again.',
                    actionLabel: 'Reset password via email',
                    onAction: () => {
                        handleForgotPassword(e);
                        setAuthPopup(null);
                    }
                };
                setError(failData);
                setAuthPopup(failData);
            } else {
                const failData = {
                    type: 'login_failed',
                    code: 'AUTH_ERROR',
                    title: 'Sign In Failed',
                    message: err.message || 'Unable to sign in. Please check your credentials and try again.'
                };
                setError(failData);
                setAuthPopup(failData);
            }
        }
        finally {
            setSubmitting(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName) {
            const failData = {
                type: 'login_failed',
                title: 'Name Required',
                message: 'Please enter your full display name.'
            };
            setError({
                code: 'MISSING_FIELD',
                title: failData.title,
                message: failData.message
            });
            setAuthPopup(failData);
            return;
        }

        if (!trimmedEmail) {
            const failData = {
                type: 'login_failed',
                title: 'Email Required',
                message: 'Please enter your email address.'
            };
            setError({
                code: 'MISSING_FIELD',
                title: failData.title,
                message: failData.message
            });
            setAuthPopup(failData);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            const failData = {
                type: 'login_failed',
                title: 'Invalid Email Format',
                message: 'Please enter a valid email address (e.g. maya@example.com).'
            };
            setError({
                code: 'INVALID_EMAIL',
                title: failData.title,
                message: failData.message
            });
            setAuthPopup(failData);
            return;
        }

        if (!password) {
            const failData = {
                type: 'login_failed',
                title: 'Password Required',
                message: 'Please enter a secure password for your new account.'
            };
            setError({
                code: 'MISSING_FIELD',
                title: failData.title,
                message: failData.message
            });
            setAuthPopup(failData);
            return;
        }

        if (password.length < 6) {
            const failData = {
                type: 'login_failed',
                title: 'Password Too Short',
                message: 'Password must be at least 6 characters long for account security.'
            };
            setError({
                code: 'PASSWORD_TOO_SHORT',
                title: failData.title,
                message: failData.message
            });
            setAuthPopup(failData);
            return;
        }

        if (!confirmPassword) {
            const failData = {
                type: 'login_failed',
                title: 'Confirm Password Required',
                message: 'Please re-enter your password in the confirm password field.'
            };
            setError({
                code: 'MISSING_CONFIRM_PASSWORD',
                title: failData.title,
                message: failData.message
            });
            setAuthPopup(failData);
            return;
        }

        if (password !== confirmPassword) {
            const failData = {
                type: 'login_failed',
                title: 'Passwords Do Not Match',
                message: 'The password and confirm password must match exactly. Please enter the same password in both fields.'
            };
            setError({
                code: 'PASSWORD_MISMATCH',
                title: failData.title,
                message: failData.message
            });
            setAuthPopup(failData);
            return;
        }

        setSubmitting(true);
        try {
            await register(trimmedName, trimmedEmail, null, bio.trim() || 'Team Member', password, {
                autoLogin: true,
                onSuccess: async (newUser) => {
                    setAuthPopup({
                        type: 'register_success',
                        title: 'Account Created Successfully!',
                        message: `Welcome to Synapse, ${newUser.name}! Setting up your workspace...`,
                        user: newUser
                    });
                    // Display popup briefly then proceed to chat workspace
                    await new Promise(r => setTimeout(r, 1200));
                    setAuthPopup(null);
                }
            });
        }
        catch (err) {
            const errCode = err.code || (err.message?.toLowerCase().includes('already') ? 'EMAIL_ALREADY_EXISTS' : 'REGISTER_ERROR');
            if (errCode === 'EMAIL_ALREADY_EXISTS') {
                const failData = {
                    type: 'login_failed',
                    code: 'EMAIL_ALREADY_EXISTS',
                    title: 'Email Already Registered',
                    message: `An account with "${trimmedEmail}" is already registered. Please sign in instead.`,
                    actionLabel: `Sign In as ${trimmedEmail} →`,
                    onAction: () => {
                        setMode('login');
                        setEmail(trimmedEmail);
                        setError(null);
                        setAuthPopup(null);
                    }
                };
                setError(failData);
                setAuthPopup(failData);
            } else {
                const failData = {
                    type: 'login_failed',
                    code: 'REGISTER_ERROR',
                    title: 'Registration Failed',
                    message: err.message || 'Unable to create account. Please try again.'
                };
                setError(failData);
                setAuthPopup(failData);
            }
        }
        finally {
            setSubmitting(false);
        }
    };

    const handleForgotPassword = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setForgotNotice('A password reset link has been dispatched to your email address.');
        setTimeout(() => setForgotNotice(null), 5000);
    };
    return (<div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* LEFT COLUMN: Modern Product Showcase (visible on large screens) */}
      <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 bg-gradient-to-br from-brand-900 via-indigo-950 to-slate-950 text-white overflow-hidden border-r border-slate-200/10">
        {/* Glow background meshes */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none"/>

        {/* Top Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/synapse-logo.png" alt="Synapse" className="w-11 h-11 rounded-2xl shadow-xl shadow-cyan-500/30 ring-1 ring-cyan-400/40 object-cover"/>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Synapse
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-200">
                  v2.0
                </span>
              </span>
              <p className="text-xs text-cyan-200/90 font-medium">Instant state. Seamless conversations.</p>
            </div>
          </div>
        </div>

        {/* Center: Live Product Showcase Card */}
        <div className="relative z-10 my-auto py-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-xs font-medium text-brand-200 mb-4 shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300"/>
            <span>Next-Gen Full-Duplex WebSockets</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white mb-4">
            Connect, chat & collaborate in real time.
          </h2>

          <p className="text-sm text-indigo-100/70 max-w-md mb-8 leading-relaxed">
            Experience sub-millisecond message delivery, live interactive polls, voice notes with waveforms, and optimistic state synchronization.
          </p>

          {/* Interactive Chat Mockup Card */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3 max-w-md">
            {/* Mock message 1 */}
            <div className="flex items-start gap-2.5">
              <Avatar name="Sarah Connor" size="sm" status="online"/>
              <div className="bg-slate-800/80 border border-white/5 rounded-2xl rounded-tl-sm px-3.5 py-2 text-xs text-slate-200 max-w-[80%] shadow-sm">
                <span className="font-semibold text-brand-300 block text-[11px] mb-0.5">Sarah Connor</span>
                Hey team! Staging latency is under 12ms with the new WebSocket cluster. 🚀
                <span className="text-[10px] text-slate-400 block text-right mt-1">10:42 AM</span>
              </div>
            </div>

            {/* Mock Poll Card */}
            <div className="ml-10 bg-brand-950/60 border border-brand-500/30 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-brand-300 font-semibold text-[11px]">
                <BarChart2 className="w-3.5 h-3.5 text-brand-400"/>
                <span>Poll: Deploy Canary to Production?</span>
              </div>
              <div className="space-y-1">
                <div className="bg-brand-500/20 rounded-md p-1.5 flex justify-between text-[10px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-brand-500/30 w-[85%]"/>
                  <span className="relative z-10 font-medium text-white">Yes, proceed (85%)</span>
                  <span className="relative z-10 text-brand-200">17 votes</span>
                </div>
              </div>
            </div>

            {/* Mock message 2 (Sent by Me) */}
            <div className="flex items-start justify-end gap-2">
              <div className="bg-brand-600 rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs text-white max-w-[80%] shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Mic className="w-3.5 h-3.5 text-white"/>
                  </div>
                  <div className="flex items-center gap-0.5 h-4">
                    {[40, 70, 100, 50, 80, 40, 90, 60].map((h, i) => (<div key={i} className="w-0.5 bg-white/90 rounded-full" style={{ height: `${h}%` }}/>))}
                  </div>
                  <span className="text-[10px] font-mono text-white/80">0:14</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-indigo-200 mt-0.5">
                  <span>10:44 AM</span>
                  <CheckCheck className="w-3 h-3 text-emerald-300"/>
                </div>
              </div>
            </div>

            {/* Live Typing indicator */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-indigo-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              <span>Alex Johnson is typing</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                <span className="w-1 h-1 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                <span className="w-1 h-1 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center -space-x-2">
            {allUsers.slice(0, 4).map((u) => (<Avatar key={u.id} name={u.name} size="xs" className="ring-2 ring-slate-900"/>))}
            <div className="w-7 h-7 rounded-full bg-brand-600 ring-2 ring-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
              +18
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-200 font-medium">
            <Activity className="w-4 h-4 text-emerald-400"/>
            <span>22 teammates online now</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Login & Signup Form */}
      <div className="w-full lg:w-[52%] flex flex-col justify-between p-6 sm:p-12 md:p-16 relative overflow-y-auto">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-8">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2">
            <img src="/synapse-logo.png" alt="Synapse" className="w-8 h-8 rounded-xl shadow-md object-cover ring-1 ring-cyan-500/30"/>
            <span className="font-bold text-lg text-slate-900 dark:text-white">Synapse</span>
          </div>

          <div className="hidden lg:block"/>

          {/* Top Actions: Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button type="button" onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 shadow-sm transition-all text-xs font-medium" title="Toggle Light / Dark Mode">
              {theme === 'dark' ? (<>
                  <Sun className="w-3.5 h-3.5 text-amber-400"/>
                  <span>Light Mode</span>
                </>) : (<>
                  <Moon className="w-3.5 h-3.5 text-indigo-500"/>
                  <span>Dark Mode</span>
                </>)}
            </button>
          </div>
        </div>

        {/* Main Form Center Box */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          {/* Form Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {mode === 'login'
            ? 'Sign in to access your direct chats, group channels, and files.'
            : 'Join Synapse to collaborate with your team in real time.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-200/70 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button id="tab-login" data-testid="tab-login" type="button" onClick={() => { setMode('login'); setError(null); setConfirmPassword(''); setShowConfirmPassword(false); }} className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${mode === 'login'
            ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-300 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
              <LogIn className="w-4 h-4"/>
              <span>Sign In</span>
            </button>
            <button id="tab-register" data-testid="tab-register" type="button" onClick={() => { setMode('register'); setError(null); setConfirmPassword(''); setShowConfirmPassword(false); }} className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${mode === 'register'
            ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-300 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
              <UserPlus className="w-4 h-4"/>
              <span>Register</span>
            </button>
          </div>



          {/* Notification / Error / Success Banner */}
          {error && (
            <div id="auth-status-banner" className={`p-4 rounded-2xl border text-xs shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
              error.type === 'success'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-100'
                : error.code === 'EMAIL_NOT_REGISTERED'
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-100'
                : 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800/80 text-rose-900 dark:text-rose-100'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-xl mt-0.5 flex-shrink-0 ${
                  error.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : error.code === 'EMAIL_NOT_REGISTERED'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}>
                  {error.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  {error.title && (
                    <div className="font-bold text-xs mb-0.5 tracking-tight flex items-center gap-1.5">
                      <span>{error.title}</span>
                    </div>
                  )}
                  <p className={`text-xs leading-relaxed ${
                    error.type === 'success'
                      ? 'text-emerald-800 dark:text-emerald-200'
                      : error.code === 'EMAIL_NOT_REGISTERED'
                      ? 'text-amber-800 dark:text-amber-200'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}>
                    {typeof error === 'string' ? error : error.message}
                  </p>

                  {/* One-click Action Button */}
                  {error.actionLabel && error.onAction && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={error.onAction}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 ${
                          error.code === 'EMAIL_NOT_REGISTERED'
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-brand-600 hover:bg-brand-500 text-white'
                        }`}
                      >
                        {error.code === 'EMAIL_NOT_REGISTERED' && <UserPlus className="w-3.5 h-3.5" />}
                        {error.code === 'EMAIL_ALREADY_EXISTS' && <LogIn className="w-3.5 h-3.5" />}
                        <span>{error.actionLabel}</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0"
                  title="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Forgot notice toast */}
          {forgotNotice && (<div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500"/>
              <span className="font-medium">{forgotNotice}</span>
            </div>)}

          {/* FORM: LOGIN */}
          {mode === 'login' ? (<form id="login-form" data-testid="login-form" onSubmit={handleLogin} className="space-y-4">

              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  <input id="login-email" data-testid="login-email" type="email" placeholder="alex@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }} className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none transition-all border ${
                    (error?.code === 'EMAIL_NOT_REGISTERED' || error?.code === 'INVALID_EMAIL')
                      ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}/>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button type="button" onClick={handleForgotPassword} className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  <input id="login-password" data-testid="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }} className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none transition-all border ${
                    error?.code === 'INCORRECT_PASSWORD'
                      ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input id="remember-me" data-testid="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"/>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Remember this device</span>
                </label>
              </div>

              <button id="btn-login-submit" data-testid="btn-login-submit" type="submit" disabled={submitting} className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <span>{submitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4"/>
              </button>
            </form>) : (
        /* FORM: REGISTER */
        <form id="register-form" data-testid="register-form" onSubmit={handleRegister} className="space-y-3 sm:space-y-3.5">
              <div>
                <label htmlFor="register-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  <input id="register-name" data-testid="register-name" type="text" placeholder="Maya Lin" value={name} onChange={(e) => { setName(e.target.value); if (error) setError(null); }} className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none transition-all border ${
                    (error?.code === 'MISSING_FIELD' && !name.trim())
                      ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}/>
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  <input id="register-email" data-testid="register-email" type="email" placeholder="maya@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }} className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none transition-all border ${
                    (error?.code === 'EMAIL_ALREADY_EXISTS' || error?.code === 'INVALID_EMAIL')
                      ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}/>
                </div>
              </div>

              <div>
                <label htmlFor="register-bio" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role / Bio Headline <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  <input id="register-bio" data-testid="register-bio" type="text" placeholder="e.g. Lead Designer • Design Systems" value={bio} onChange={(e) => setBio(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"/>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="register-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {password && (
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                      password.length >= 6 ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {password.length >= 6 ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Min length met</span>
                        </>
                      ) : (
                        <span>Min 6 characters ({password.length}/6)</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  <input id="register-password" data-testid="register-password" type={showPassword ? 'text' : 'password'} placeholder="Create a secure password (min. 6 characters)" value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }} className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none transition-all border ${
                    (error?.code === 'PASSWORD_TOO_SHORT' || (error?.code === 'MISSING_FIELD' && !password))
                      ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="register-confirm-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </label>
                  {confirmPassword && (
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                      password === confirmPassword ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {password === confirmPassword ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  <input
                    id="register-confirm-password"
                    data-testid="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password to confirm"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error?.code === 'PASSWORD_MISMATCH' || error?.code === 'MISSING_CONFIRM_PASSWORD') {
                        setError(null);
                      }
                    }}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none transition-all border ${
                      confirmPassword && password === confirmPassword
                        ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                        : (error?.code === 'PASSWORD_MISMATCH' || (confirmPassword && password !== confirmPassword))
                        ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              <button id="btn-register-submit" data-testid="btn-register-submit" type="submit" disabled={submitting} className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1">
                <span>{submitting ? 'Creating Profile...' : 'Create Free Account'}</span>
                <ArrowRight className="w-4 h-4"/>
              </button>
            </form>)}

          {/* Bottom Switcher */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'login' ? (<>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setMode('register'); setError(null); setConfirmPassword(''); setShowConfirmPassword(false); }} className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                    Create an account
                  </button>
                </>) : (<>
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setMode('login'); setError(null); setConfirmPassword(''); setShowConfirmPassword(false); }} className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                    Sign in here
                  </button>
                </>)}
            </p>
          </div>
        </div>

        {/* Footer Legal */}
        <div className="text-center pt-6">
          <p className="text-[11px] text-slate-400 dark:text-slate-600">
            Protected by enterprise-grade encryption • Synapse © 2026
          </p>
        </div>
      </div>

      {/* POPUPS: LOGIN SUCCESS, ACCOUNT CREATED SUCCESSFULLY & LOGIN FAILED MODALS (Rendered via Portal into document.body) */}
      {authPopup && typeof document !== 'undefined' && createPortal(
        <div id="auth-popup-backdrop" data-testid="auth-popup-backdrop" className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md transition-opacity duration-200" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* SUCCESS POPUP (Login Successful or Account Created Successfully) */}
          {(authPopup.type === 'login_success' || authPopup.type === 'register_success') && (
            <div id={`popup-${authPopup.type}`} data-testid={`popup-${authPopup.type}`} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 text-center overflow-hidden animate-modal-in" style={{ zIndex: 1000000 }}>
              {/* Close Button */}
              <button
                id="popup-success-close"
                type="button"
                onClick={() => {
                  if (authPopup.type === 'register_success') {
                    setMode('login');
                    setAuthPopup(null);
                  } else {
                    setAuthPopup(null);
                  }
                }}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-20"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Background gradient decorative glow */}
              <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                authPopup.type === 'login_success' ? 'bg-emerald-500/20' : 'bg-cyan-500/25'
              }`} />
              <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                authPopup.type === 'login_success' ? 'bg-teal-500/20' : 'bg-indigo-500/25'
              }`} />

              {/* Glowing Icon Badge + Synapse Logo */}
              <div className="relative z-10 mx-auto mb-5 flex flex-col items-center gap-3">
                {/* App Logo */}
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
                  <img
                    src="/synapse-logo.png"
                    alt="Synapse"
                    className="w-8 h-8 rounded-xl shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/40 object-cover animate-avatar-glow"
                  />
                  <div className="text-left">
                    <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Synapse</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">Real-Time Messaging</span>
                  </div>
                </div>

                {/* Status Icon */}
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${
                  authPopup.type === 'login_success'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-emerald-500/30 ring-4 ring-emerald-500/20'
                    : 'bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 text-white shadow-cyan-500/30 ring-4 ring-cyan-500/20'
                } animate-pop`}>
                  {authPopup.type === 'login_success' ? (
                    <CheckCircle2 className="w-10 h-10" />
                  ) : (
                    <Sparkles className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
                  )}
                </div>
              </div>

              {/* User Avatar + Status Pill (if user object present) */}
              {authPopup.user && (
                <div id="popup-user-badge" className="relative z-10 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 mb-3.5">
                  <Avatar name={authPopup.user.name} avatar={authPopup.user.avatar} size="xs" status="online" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {authPopup.user.name}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
              )}

              {/* Title & Description */}
              <h3 id="popup-title" className="relative z-10 text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                {authPopup.title}
              </h3>
              <p id="popup-message" className="relative z-10 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {authPopup.message}
              </p>

              {/* Action button if present (e.g. Proceed to Sign In) */}
              {authPopup.actionLabel && authPopup.onAction && (
                <div className="relative z-10 mb-4">
                  <button
                    id="popup-action-btn"
                    type="button"
                    onClick={authPopup.onAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-500/25 transition-all active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{authPopup.actionLabel}</span>
                  </button>
                </div>
              )}

              {/* 5-Second Countdown Progress Bar */}
              <div className="relative z-10 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${
                    authPopup.type === 'login_success'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                  }`}
                  style={{
                    animation: `countdown-shrink ${authPopup.type === 'login_success' ? '1.2s' : '1.5s'} linear forwards`
                  }}
                />
              </div>
              <p className="relative z-10 text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                {authPopup.type === 'login_success' ? 'Connecting to chat workspace...' : 'Redirecting to Sign In in 1 to 2 seconds...'}
              </p>
            </div>
          )}

          {/* FAILED POPUP (Login Failed Modal) */}
          {authPopup.type === 'login_failed' && (
            <div id="popup-login_failed" data-testid="popup-login_failed" className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-rose-500/30 text-left overflow-hidden animate-modal-in" style={{ zIndex: 1000000 }}>
              {/* Close Icon Button */}
              <button
                id="popup-failed-close"
                type="button"
                onClick={() => setAuthPopup(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Glowing Alert Icon */}
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0 shadow-sm shadow-rose-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Authentication Alert
                  </span>
                  <h3 id="popup-failed-title" className="text-lg font-bold text-slate-900 dark:text-white">
                    {authPopup.title || 'Login Failed'}
                  </h3>
                </div>
              </div>

              {/* Message Details */}
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 mb-5">
                <p id="popup-failed-message" className="text-xs sm:text-sm text-rose-800 dark:text-rose-200 leading-relaxed font-medium">
                  {authPopup.message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                {authPopup.actionLabel && authPopup.onAction && (
                  <button
                    id="popup-failed-action-btn"
                    type="button"
                    onClick={authPopup.onAction}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {authPopup.code === 'EMAIL_NOT_REGISTERED' && <UserPlus className="w-4 h-4" />}
                    {authPopup.code === 'EMAIL_ALREADY_EXISTS' && <LogIn className="w-4 h-4" />}
                    <span>{authPopup.actionLabel}</span>
                  </button>
                )}
                <button
                  id="popup-failed-dismiss-btn"
                  type="button"
                  onClick={() => setAuthPopup(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>);
};

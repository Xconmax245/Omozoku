'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebounce } from 'use-debounce';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Check, X, AlertCircle, Loader2 } from 'lucide-react';

const signUpSchema = z.object({
  name: z.string().min(2, 'Display name must be at least 2 characters').max(30),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20)
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores allowed.'),
  email: z.string().email('Please enter a valid email address.').max(254),
  password: z
    .string()
    .min(8, 'Your password must contain at least 8 characters.')
    .regex(/[A-Z]/, 'Must contain an uppercase letter.')
    .regex(/[a-z]/, 'Must contain a lowercase letter.')
    .regex(/[0-9]/, 'Must contain a number.')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character.'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the Terms and Privacy Policy.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});

type SignUpValues = z.infer<typeof signUpSchema>;

function calculatePasswordStrength(password: string) {
  let score = 0;
  if (!password) return score;
  if (password.length > 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score; // 0 to 5
}

export default function SignUpPageClient() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
  });

  const watchUsername = watch('username');
  const watchPassword = watch('password');
  const [debouncedUsername] = useDebounce(watchUsername, 500);

  // Check username availability
  useEffect(() => {
    async function checkUsername() {
      if (!debouncedUsername || debouncedUsername.length < 3 || !/^[a-z0-9_]+$/.test(debouncedUsername)) {
        setUsernameStatus('idle');
        return;
      }
      setUsernameStatus('checking');
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(debouncedUsername)}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('taken');
        }
      } catch {
        setUsernameStatus('idle');
      }
    }
    checkUsername();
  }, [debouncedUsername]);

  // Caps lock detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === 'function' && e.getModifierState('CapsLock')) {
        setCapsLock(true);
      } else {
        setCapsLock(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const strengthScore = calculatePasswordStrength(watchPassword || '');
  const strengthLabel = ['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'][strengthScore] || 'Weak';
  const strengthColor =
    strengthScore <= 1 ? 'bg-red-500' :
    strengthScore === 2 ? 'bg-orange-500' :
    strengthScore === 3 ? 'bg-yellow-400' : 'bg-green-500';

  const onSubmit = async (data: SignUpValues) => {
    if (usernameStatus === 'taken') return;
    
    setIsSubmitting(true);
    setServerError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        setServerError(result.error || 'Something went wrong.');
        setIsSubmitting(false);
        return;
      }

      // Registration successful — auto-sign-in the user
      const signInRes = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (signInRes?.ok) {
        router.push('/');
      } else {
        // Auto sign-in failed — redirect to sign-in page so they can try manually
        router.push('/auth/signin?registered=true');
      }
    } catch (err) {
      setServerError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#0a0a0c' }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-6 hover:scale-105 transition-transform active:scale-95">
            <Image src="/images/logo.png" alt="OmoZoku" width={48} height={48} className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(255,45,85,0.3)] mx-auto" priority />
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-white mb-2 tracking-tight">Create your account</h1>
          <p className="text-text-secondary text-sm">Join the tribe and build your watchlist.</p>
        </div>

        <div className="bg-bg-surface/60 backdrop-blur-2xl border border-border-subtle p-8 rounded-[2rem] shadow-2xl">
          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <p>{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Display Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-text-secondary mb-1.5 ml-1">
                Display Name <span className="text-accent">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="Choose a display name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                {...register('name')}
              />
              {errors.name && (
                <p id="name-error" className="text-red-400 text-xs mt-1.5 ml-1 flex items-center gap-1">
                  <X size={12} /> {errors.name.message}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-text-secondary mb-1.5 ml-1">
                Username <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  placeholder="Choose a unique username"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all text-sm ${
                    usernameStatus === 'taken' ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:border-accent/50 focus:ring-accent/50'
                  }`}
                  aria-invalid={!!errors.username || usernameStatus === 'taken'}
                  aria-describedby="username-message"
                  {...register('username', {
                    onChange: (e) => {
                      e.target.value = e.target.value.toLowerCase().trim();
                    }
                  })}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 size={16} className="text-white/50 animate-spin" />}
                  {usernameStatus === 'available' && !errors.username && <Check size={16} className="text-green-500" />}
                  {usernameStatus === 'taken' && <X size={16} className="text-red-500" />}
                </div>
              </div>
              <p id="username-message" className={`text-xs mt-1.5 ml-1 flex items-center gap-1 ${
                usernameStatus === 'taken' || errors.username ? 'text-red-400' : usernameStatus === 'available' ? 'text-green-400' : 'text-text-secondary'
              }`}>
                {errors.username ? <><X size={12} /> {errors.username.message}</> :
                 usernameStatus === 'taken' ? <><X size={12} /> That username is already taken. Try another one.</> :
                 usernameStatus === 'available' ? <><Check size={12} /> Username is available.</> :
                 'Lowercase letters, numbers, underscores.'}
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-text-secondary mb-1.5 ml-1">
                Email Address <span className="text-accent">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email address"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email', {
                  onChange: (e) => { e.target.value = e.target.value.toLowerCase().trim(); }
                })}
              />
              {errors.email && (
                <p id="email-error" className="text-red-400 text-xs mt-1.5 ml-1 flex items-center gap-1">
                  <X size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-text-secondary mb-1.5 ml-1 flex justify-between">
                <span>Password <span className="text-accent">*</span></span>
                {capsLock && <span className="text-yellow-500 text-xs flex items-center gap-1"><AlertCircle size={12}/> Caps Lock on</span>}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a secure password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-11 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm"
                  aria-invalid={!!errors.password}
                  aria-describedby="password-message"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/80 transition-colors rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Strength Meter */}
              {watchPassword && !errors.password && (
                <div className="mt-2 ml-1">
                  <div className="flex gap-1 h-1 w-full rounded-full overflow-hidden bg-white/10">
                    <div className={`h-full ${strengthScore >= 1 ? strengthColor : 'bg-transparent'} transition-all w-1/4`} />
                    <div className={`h-full ${strengthScore >= 2 ? strengthColor : 'bg-transparent'} transition-all w-1/4`} />
                    <div className={`h-full ${strengthScore >= 3 ? strengthColor : 'bg-transparent'} transition-all w-1/4`} />
                    <div className={`h-full ${strengthScore >= 4 ? strengthColor : 'bg-transparent'} transition-all w-1/4`} />
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1 text-right font-medium">{strengthLabel}</p>
                </div>
              )}

              {errors.password && (
                <p id="password-message" className="text-red-400 text-xs mt-1.5 ml-1 flex items-start gap-1">
                  <X size={12} className="shrink-0 mt-0.5" /> <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text-secondary mb-1.5 ml-1">
                Confirm Password <span className="text-accent">*</span>
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm your password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-red-400 text-xs mt-1.5 ml-1 flex items-center gap-1">
                  <X size={12} /> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    {...register('terms')}
                  />
                  <div className="w-5 h-5 border-2 border-white/20 rounded peer-checked:bg-accent peer-checked:border-accent transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-black" />
                  <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                </div>
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  I agree to the <Link href="/terms" className="text-white hover:underline decoration-white/30 underline-offset-4">Terms of Service</Link> and <Link href="/privacy" className="text-white hover:underline decoration-white/30 underline-offset-4">Privacy Policy</Link>.
                </span>
              </label>
              {errors.terms && (
                <p className="text-red-400 text-xs mt-1.5 ml-8 flex items-center gap-1">
                  <X size={12} /> {errors.terms.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting || usernameStatus === 'taken'}
              className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[#0a0a0c] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(255,45,85,0.2)] disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-white font-semibold hover:underline decoration-accent underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

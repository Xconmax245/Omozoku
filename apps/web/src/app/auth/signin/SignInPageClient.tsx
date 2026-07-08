'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, X, AlertCircle, Loader2, Check } from 'lucide-react';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address.').max(254),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean().optional(),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl') || '/';
  // Prevent redirect loops: never send users back to /search or auth pages after login
  const callbackUrl = (
    rawCallback.startsWith('/auth') ||
    rawCallback.startsWith('/search') ||
    rawCallback === ''
  ) ? '/' : rawCallback;
  const registered = searchParams.get('registered') === 'true';
  const urlError = searchParams.get('error');

  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(
    urlError === 'CredentialsSignin' ? 'Invalid email or password.' : ''
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
  });

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

  const onSubmit = async (data: SignInValues) => {
    setIsSubmitting(true);
    setServerError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });

      if (!res) {
        // signIn returned nothing — likely a fetch failure or network error
        setServerError('Could not reach the authentication server. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (res.error) {
        setServerError('Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      if (res.ok) {
        router.push(callbackUrl);
        return;
      }

      // Catch-all: response doesn't match expected shape, but we shouldn't hang
      console.warn('[auth] Unexpected signIn response:', res);
      setServerError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    } catch (err) {
      console.error('[auth] signIn threw an error:', err);
      setServerError('An unexpected error occurred. Please try again.');
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
            <Image src="/images/logo.png" alt="OmoZoku" width={64} height={64} className="h-16 w-auto object-contain drop-shadow-md" priority />
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-white mb-2 tracking-tight">Welcome back</h1>
          <p className="text-text-secondary text-sm">Sign in to your OmoZoku account.</p>
        </div>

        <div className="bg-bg-surface/60 backdrop-blur-2xl border border-border-subtle p-8 rounded-[2rem] shadow-2xl">
          <AnimatePresence>
            {registered && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex gap-3 text-green-400 text-sm">
                  <Check size={18} className="shrink-0" />
                  <p>Account created successfully! Please sign in.</p>
                </div>
              </motion.div>
            )}
            
            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-sm">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{serverError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Address */}
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
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-11 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
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
              {errors.password && (
                <p id="password-error" className="text-red-400 text-xs mt-1.5 ml-1 flex items-start gap-1">
                  <X size={12} className="shrink-0 mt-0.5" /> <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Layout line: Remember Me + Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    {...register('rememberMe')}
                  />
                  <div className="w-[18px] h-[18px] border-2 border-white/20 rounded peer-checked:bg-accent peer-checked:border-accent transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-black" />
                  <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                </div>
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors select-none">
                  Remember me
                </span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-accent hover:text-white transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[#0a0a0c] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(255,45,85,0.2)] disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Continue'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-white font-semibold hover:underline decoration-accent underline-offset-4">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

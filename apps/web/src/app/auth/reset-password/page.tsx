'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

const schema = z.object({
  password: z
    .string()
    .min(8, 'At least 8 characters.')
    .regex(/[A-Z]/, 'Must contain an uppercase letter.')
    .regex(/[a-z]/, 'Must contain a lowercase letter.')
    .regex(/[0-9]/, 'Must contain a number.')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character.'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  if (!token || !email) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
        <p className="text-white font-semibold mb-2">Invalid reset link</p>
        <p className="text-text-secondary text-sm mb-6">This link is missing required parameters.</p>
        <Link href="/auth/forgot-password" className="text-accent hover:underline text-sm">Request a new link</Link>
      </div>
    );
  }

  const onSubmit = async (data: FormValues) => {
    setServerError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password: data.password }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push('/auth/signin'), 3000);
      } else {
        const body = await res.json();
        setServerError(body.error || 'Something went wrong. Your link may have expired.');
      }
    } catch {
      setServerError('Network error. Please try again.');
    }
  };

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center gap-4 py-4"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Password updated!</p>
            <p className="text-text-secondary text-sm">Redirecting you to sign in...</p>
          </div>
        </motion.div>
      ) : (
        <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <AnimatePresence>
            {serverError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-sm">
                  <AlertCircle size={18} className="shrink-0" /><p>{serverError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {[
            { id: 'password', label: 'New Password', key: 'password' as const },
            { id: 'confirmPassword', label: 'Confirm Password', key: 'confirmPassword' as const },
          ].map(({ id, label, key }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-semibold text-text-secondary mb-1.5 ml-1">
                {label} <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <input
                  id={id}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={label}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-11 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm"
                  {...register(key)}
                />
                {key === 'password' && (
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/80 transition-colors rounded">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
              {errors[key] && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors[key]?.message}</p>}
            </div>
          ))}

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[#0a0a0c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,45,85,0.2)] disabled:shadow-none flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-3xl font-display font-extrabold text-white mb-2 tracking-tight">Reset Password</h1>
          <p className="text-text-secondary text-sm">Enter your new password below.</p>
        </div>
        <div className="bg-bg-surface/60 backdrop-blur-2xl border border-border-subtle p-8 rounded-[2rem] shadow-2xl">
          <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-white/40" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <div className="mt-6 text-center">
          <Link href="/auth/signin" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors">
            <ArrowLeft size={16} />Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

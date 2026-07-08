'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email address.').max(254),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      if (res.ok) {
        setSubmittedEmail(data.email);
        setSent(true);
      } else {
        const body = await res.json();
        setServerError(body.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
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
          <h1 className="text-3xl font-display font-extrabold text-white mb-2 tracking-tight">Forgot Password?</h1>
          <p className="text-text-secondary text-sm text-center max-w-xs">
            {sent ? 'Check your inbox.' : "No worries — enter your email and we'll send you a reset link."}
          </p>
        </div>

        <div className="bg-bg-surface/60 backdrop-blur-2xl border border-border-subtle p-8 rounded-[2rem] shadow-2xl">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center gap-4 py-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">Reset link sent!</p>
                  <p className="text-text-secondary text-sm">
                    We&apos;ve sent a password reset link to{' '}
                    <span className="text-white font-medium">{submittedEmail}</span>.
                    Check your inbox (and spam folder).
                  </p>
                </div>
                <p className="text-text-secondary text-xs mt-2">
                  Didn&apos;t receive it?{' '}
                  <button
                    onClick={() => setSent(false)}
                    className="text-accent hover:underline"
                  >
                    Try again
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-sm">
                        <AlertCircle size={18} className="shrink-0" />
                        <p>{serverError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-text-secondary mb-1.5 ml-1">
                    Email Address <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30">
                      <Mail size={16} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your account email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm"
                      aria-invalid={!!errors.email}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[#0a0a0c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,45,85,0.2)] disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Send Reset Link'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

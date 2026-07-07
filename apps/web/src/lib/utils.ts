import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes without conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Map a score (0–100) to the correct tier color token */
export function scoreColor(score: number | null): string {
  if (score === null) return 'text-text-secondary';
  if (score >= 8) return 'text-score-green';
  if (score >= 5) return 'text-score-amber';
  return 'text-score-red';
}

export function scoreBg(score: number | null): string {
  if (score === null) return 'bg-bg-elevated';
  if (score >= 8) return 'bg-score-green/20 text-score-green';
  if (score >= 5) return 'bg-score-amber/20 text-score-amber';
  return 'bg-score-red/20 text-score-red';
}

/** Hash a string for cache keys */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/** Format large numbers (e.g. 1234567 → "1.2M") */
export function formatNumber(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Convert a score out of 10 to 0–100 for internal comparisons */
export function normalizeScore(score: number | null): number | null {
  if (score === null) return null;
  return Math.round(score * 10);
}

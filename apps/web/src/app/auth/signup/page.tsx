import { Metadata } from 'next';
import SignUpPageClient from './SignUpPageClient';

export const metadata: Metadata = {
  title: 'Sign Up - OmoZoku',
  description: 'Join the OmoZoku tribe and unlock your anime journey.',
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}

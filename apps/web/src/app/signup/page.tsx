import { AuthShell } from '@/components/auth-shell';
import { SignupForm } from '@/features/auth/signup-form';

export default function SignupPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <AuthShell>
      <SignupForm token={searchParams.token ?? ''} />
    </AuthShell>
  );
}

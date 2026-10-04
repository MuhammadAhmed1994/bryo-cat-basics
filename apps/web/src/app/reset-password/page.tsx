import { AuthShell } from '@/components/auth-shell';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <AuthShell>
      <ResetPasswordForm token={searchParams.token ?? ''} />
    </AuthShell>
  );
}

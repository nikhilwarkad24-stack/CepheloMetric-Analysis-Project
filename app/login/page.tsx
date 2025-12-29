
import { Logo } from '@/components/icons';
import { LoginForm } from '@/components/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 font-bold mb-4">
            <Logo className="w-10 h-10 text-primary" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Ceph Studio</h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

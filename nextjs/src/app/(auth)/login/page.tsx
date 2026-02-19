import { UserAuthForm } from '@/components/user-auth-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Welcome Back!
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to sign in to your account.
        </p>
      </div>
      <UserAuthForm variant="login" />
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link
          href="/register"
          className="hover:text-primary underline underline-offset-4"
        >
          Don&apos;t have an account? Sign Up
        </Link>
      </p>
    </div>
  );
}

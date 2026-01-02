import { UserAuthForm } from '@/components/user-auth-form';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Create an Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details below to create your account and join the fun.
        </p>
      </div>
      <UserAuthForm variant="register" />
      <p className="px-8 text-center text-sm text-muted-foreground">
         <Link
          href="/login"
          className="hover:text-primary underline underline-offset-4"
        >
          Already have an account? Sign In
        </Link>
      </p>
    </div>
  );
}

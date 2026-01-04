"use client";

/**
 * Email Verification Page
 * Spec Reference: 01-authentication.md - Email Verification
 * 
 * Users land here after clicking the verification link in their email
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email. The link may have expired.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your verification request...'}
            {status === 'success' && 'Your email has been verified'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <p className="text-center text-muted-foreground">{message}</p>
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full"
              >
                Go to Login
              </Button>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-center text-muted-foreground">{message}</p>
              <div className="flex gap-2 w-full">
                <Button 
                  onClick={() => router.push('/login')} 
                  variant="outline"
                  className="flex-1"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => router.push('/profile')} 
                  className="flex-1"
                >
                  Go to Profile
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                If your link expired, you can request a new verification email from your profile page.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Authentication API - Email Verification
 * Spec Reference: 01-authentication.md - Email Verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify the token
    // Spec: 01-authentication.md - User clicks verification link, System marks user as verified
    const result = await verifyEmailToken(token);

    if (!result.success) {
      // Spec: 01-authentication.md - Expired/invalid verification token → show failure
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Email verified successfully. You can now login.',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}

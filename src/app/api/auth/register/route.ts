/**
 * Authentication API - Register
 * Spec Reference: 01-authentication.md - Registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createUser, 
  checkUserExists, 
  createVerificationToken 
} from '@/lib/db';

// Password policy: minimum 8 characters
// Spec: 01-authentication.md - password meets minimum security policy
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if username/email already exists
    // Spec: 01-authentication.md - Registration with existing email/username → reject
    const { usernameExists, emailExists } = await checkUserExists(username, email);

    if (usernameExists) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    if (emailExists) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser(username, email, password);

    // Create verification token
    // Spec: 01-authentication.md - System sends a verification email
    const verificationToken = await createVerificationToken(user.id);

    // In a real implementation, send email here
    // For now, return the token for testing purposes
    console.log(`Verification token for ${email}: ${verificationToken.token}`);

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
      // Remove in production - only for development/testing
      verificationToken: verificationToken.token,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

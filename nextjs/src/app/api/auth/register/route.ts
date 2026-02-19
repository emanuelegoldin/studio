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
import { sendVerificationEmail, isEmailConfigured } from '@/lib/email';

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

    // Send verification email
    // In production and when SMTP is configured, send actual email
    // For development without SMTP config, log to console only
    if (isEmailConfigured()) {
      const emailResult = await sendVerificationEmail(
        email,
        username,
        verificationToken.token
      );
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        // Continue even if email fails - user can resend later
      }
    } else {
      // Development mode without SMTP - log token to console
      console.log(`[DEV] Verification token for ${email}: ${verificationToken.token}`);
      console.log(`[DEV] Verification URL: ${process.env.APP_BASE_URL || 'http://localhost:9002'}/verify?token=${verificationToken.token}`);
    }

    const response: { message: string; userId: string; verificationToken?: string } = {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };

    // Only include token in development for testing purposes (when email not configured)
    if (process.env.NODE_ENV !== 'production' && !isEmailConfigured()) {
      response.verificationToken = verificationToken.token;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

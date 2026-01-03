/**
 * Authentication Utility
 * Helper functions for authentication in API routes
 * Spec Reference: 01-authentication.md - Access Control
 */

import { cookies } from 'next/headers';
import { findSessionByToken, findUserById } from '@/lib/db';
import type { User } from '@/lib/db/types';

/**
 * Get the current authenticated user from the session
 * Spec: 01-authentication.md - Authentication required for any user-specific operations
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await findSessionByToken(sessionToken);
    if (!session) {
      return null;
    }

    const user = await findUserById(session.userId);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

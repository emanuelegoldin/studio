/**
 * Profile API
 * Spec Reference: 02-user-profile-and-privacy.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserProfile, updateUserProfile, getPublicUserProfile } from '@/lib/db';

/**
 * GET /api/profile - Get current user's profile
 * GET /api/profile?userId=xxx - Get another user's public profile
 * Spec: 02-user-profile-and-privacy.md - View own profile, Viewing Other Users
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId && userId !== currentUser.id) {
      // Get another user's public profile
      // Spec: 02-user-profile-and-privacy.md - only public fields are shown
      const publicProfile = await getPublicUserProfile(userId);
      
      if (!publicProfile) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ profile: publicProfile, isOwner: false });
    }

    // Get own profile (full access)
    const profile = await getUserProfile(currentUser.id);
    
    return NextResponse.json({
      profile,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        emailVerified: currentUser.emailVerifiedAt !== null,
      },
      isOwner: true,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile - Update current user's profile
 * Spec: 02-user-profile-and-privacy.md - User can update their own profile fields
 */
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { displayName, bio, avatarUrl, displayNamePublic, bioPublic, avatarPublic } = body;

    // Spec: 02-user-profile-and-privacy.md - Only the profile owner can edit their profile
    const updatedProfile = await updateUserProfile(currentUser.id, {
      displayName,
      bio,
      avatarUrl,
      displayNamePublic,
      bioPublic,
      avatarPublic,
    });

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

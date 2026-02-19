/**
 * Team Provided Resolutions API
 * Spec Reference: 04-bingo-teams.md - Member-Provided Resolutions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  isTeamMember,
  createTeamProvidedResolution, 
  getTeamProvidedResolutionsByUser,
  getTeamProvidedResolutionsForUser,
  checkAllResolutionsProvided,
  getTeamMembers,
} from '@/lib/db';

/**
 * GET /api/teams/[teamId]/resolutions - Get resolutions status
 * Returns resolutions created by the user and for the user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { teamId } = await params;

    // Optional query: return resolutions targeted to a given toUserId
    // Spec: 09-bingo-card-editing.md - Replacement Options
    const toUserId = request.nextUrl.searchParams.get('toUserId');

    // Check if user is a member
    const isMember = await isTeamMember(teamId, currentUser.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    if (toUserId) {
      const resolutions = await getTeamProvidedResolutionsForUser(teamId, toUserId);
      return NextResponse.json({ resolutions });
    }

    // Get resolutions created by the user
    const createdByUser = await getTeamProvidedResolutionsByUser(teamId, currentUser.id);
    
    // Get resolutions created for the user
    const createdForUser = await getTeamProvidedResolutionsForUser(teamId, currentUser.id);
    
    // Get all team members
    const members = await getTeamMembers(teamId);
    
    // Check overall status
    const status = await checkAllResolutionsProvided(teamId);
    
    return NextResponse.json({
      createdByUser,
      createdForUser,
      members,
      status,
    });
  } catch (error) {
    console.error('Get resolutions error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[teamId]/resolutions - Create resolution for another member
 * Spec: 04-bingo-teams.md - Each member can create a resolution for each other member
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { teamId } = await params;
    const body = await request.json();
    const { toUserId, text } = body;

    if (!toUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Resolution text is required' },
        { status: 400 }
      );
    }

    // Spec: 04-bingo-teams.md - A member cannot create a "for myself" entry
    if (toUserId === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot create a resolution for yourself' },
        { status: 400 }
      );
    }

    const resolution = await createTeamProvidedResolution(
      teamId, 
      currentUser.id, 
      toUserId, 
      text
    );
    
    if (!resolution) {
      return NextResponse.json(
        { error: 'Failed to create resolution. Check that both users are team members.' },
        { status: 400 }
      );
    }

    // Get updated status
    const status = await checkAllResolutionsProvided(teamId);
    
    return NextResponse.json({ resolution, status }, { status: 201 });
  } catch (error) {
    console.error('Create resolution error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

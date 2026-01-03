/**
 * Team Detail API
 * Spec Reference: 04-bingo-teams.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTeamWithMembers, isTeamMember } from '@/lib/db';

/**
 * GET /api/teams/[teamId] - Get a specific team's details
 */
export async function GET(
  _request: NextRequest,
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

    // Check if user is a member of the team
    const isMember = await isTeamMember(teamId, currentUser.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    const team = await getTeamWithMembers(teamId);
    
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

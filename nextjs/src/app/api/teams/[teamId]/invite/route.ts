/**
 * Team Invitation API
 * Spec Reference: 04-bingo-teams.md - Invitations / Joining
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createTeamInvitation, isTeamLeader } from '@/lib/db';

/**
 * POST /api/teams/[teamId]/invite - Create team invitation
 * Spec: 04-bingo-teams.md - Team leader can invite users
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
    const { email } = body;

    // Check if user is team leader
    // Spec: 04-bingo-teams.md - Only team leader can invite
    const isLeader = await isTeamLeader(teamId, currentUser.id);
    if (!isLeader) {
      return NextResponse.json(
        { error: 'Only the team leader can invite users' },
        { status: 403 }
      );
    }

    const invitation = await createTeamInvitation(teamId, currentUser.id, email);
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      invitation,
      inviteUrl: `/join/${invitation.inviteCode}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

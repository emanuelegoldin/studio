/**
 * Team Join API
 * Spec Reference: 04-bingo-teams.md - Invitations / Joining
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isUserVerified } from '@/lib/auth';
import { joinTeamByInviteCode, getTeamWithMembers, ensureBingoCardForUser } from '@/lib/db';

/**
 * POST /api/teams/[teamId]/join - Join a team using invite code
 * Spec: 04-bingo-teams.md - Invited users can accept/join the team
 * Requires email verification
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

    // Check if user has verified their email
    // Unverified users can only write resolutions and update their profiles
    if (!isUserVerified(currentUser)) {
      return NextResponse.json(
        { error: 'Email verification required. Please verify your email before joining a team.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    const result = await joinTeamByInviteCode(inviteCode, currentUser.id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get full team data
    const teamWithMembers = result.team 
      ? await getTeamWithMembers(result.team.id)
      : null;

    // Spec: 04-bingo-teams.md - Joining After Start
    if (result.team?.status === 'started') {
      const cardResult = await ensureBingoCardForUser(result.team.id, currentUser.id);
      if (cardResult && 'error' in cardResult && cardResult.error) {
        return NextResponse.json(
          { error: cardResult.error },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ 
      message: 'Successfully joined the team',
      team: teamWithMembers,
    });
  } catch (error) {
    console.error('Join team error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

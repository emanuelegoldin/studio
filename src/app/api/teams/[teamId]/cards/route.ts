/**
 * Team Bingo Cards API
 * Spec Reference: 05-bingo-card-generation.md, 06-bingo-gameplay.md, 08-visibility-and-updates.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  isTeamMember,
  getTeamBingoCards,
  getBingoCard,
} from '@/lib/db';

/**
 * GET /api/teams/[teamId]/cards - Get all bingo cards for the team
 * Spec: 08-visibility-and-updates.md - A team member can view bingo cards of other members
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Check if user is a member
    // Spec: 08-visibility-and-updates.md - Only team members can view team cards
    const isMember = await isTeamMember(teamId, currentUser.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    if (userId) {
      // Get specific user's card
      const card = await getBingoCard(teamId, userId);
      return NextResponse.json({ card });
    }

    // Get all cards for the team
    const cards = await getTeamBingoCards(teamId, currentUser.id);
    
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Get cards error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

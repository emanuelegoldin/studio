/**
 * Team Start Bingo API
 * Spec Reference: 04-bingo-teams.md - Start Conditions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  startBingoGame, 
  isTeamLeader,
  getTeamWithMembers,
} from '@/lib/db';
import { generateBingoCardsForTeam } from '@/lib/db/bingo-card-repository';

/**
 * POST /api/teams/[teamId]/start - Start the bingo game
 * Spec: 04-bingo-teams.md - Team leader can start bingo once all members created resolutions
 */
export async function POST(
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

    // Check if user is team leader
    // Spec: 04-bingo-teams.md - Only team leader can start game
    const isLeader = await isTeamLeader(teamId, currentUser.id);
    if (!isLeader) {
      return NextResponse.json(
        { error: 'Only the team leader can start the game' },
        { status: 403 }
      );
    }

    // Start the game (validates all conditions)
    const result = await startBingoGame(teamId, currentUser.id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Generate bingo cards for all members
    // Spec: 05-bingo-card-generation.md - Cards generated automatically at start
    await generateBingoCardsForTeam(teamId);

    // Get updated team data
    const team = await getTeamWithMembers(teamId);

    return NextResponse.json({ 
      message: 'Bingo game started successfully',
      team,
    });
  } catch (error) {
    console.error('Start game error:', error);
    return NextResponse.json(
      { error: 'An error occurred while starting the game' },
      { status: 500 }
    );
  }
}

/**
 * Teams API
 * Spec Reference: 04-bingo-teams.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  createTeam, 
  getTeamsForUser, 
  getTeamWithMembers,
  setTeamResolution,
  isTeamLeader,
} from '@/lib/db';

/**
 * GET /api/teams - Get all teams for current user
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const teams = await getTeamsForUser(currentUser.id);
    
    // Get full team data with members for each team
    const teamsWithMembers = await Promise.all(
      teams.map(team => getTeamWithMembers(team.id))
    );
    
    return NextResponse.json({ 
      teams: teamsWithMembers.filter(t => t !== null) 
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams - Create a new team
 * Spec: 04-bingo-teams.md - A user can create a team and becomes team leader
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const team = await createTeam(name.trim(), currentUser.id);
    const teamWithMembers = await getTeamWithMembers(team.id);
    
    return NextResponse.json({ team: teamWithMembers }, { status: 201 });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teams - Update team (set resolution, etc.)
 * Spec: 04-bingo-teams.md - Team leader can set team resolution
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
    const { teamId, teamResolutionText } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Check if user is team leader
    // Spec: 04-bingo-teams.md - Only team leader can set team resolution
    const isLeader = await isTeamLeader(teamId, currentUser.id);
    if (!isLeader) {
      return NextResponse.json(
        { error: 'Only the team leader can update team settings' },
        { status: 403 }
      );
    }

    if (teamResolutionText !== undefined) {
      if (!teamResolutionText || teamResolutionText.trim().length === 0) {
        return NextResponse.json(
          { error: 'Team resolution text is required' },
          { status: 400 }
        );
      }

      const team = await setTeamResolution(teamId, currentUser.id, teamResolutionText);
      
      if (!team) {
        return NextResponse.json(
          { error: 'Failed to update team resolution' },
          { status: 500 }
        );
      }

      const teamWithMembers = await getTeamWithMembers(teamId);
      return NextResponse.json({ team: teamWithMembers });
    }

    return NextResponse.json({ error: 'No update parameters provided' }, { status: 400 });
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

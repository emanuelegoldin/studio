import { getCurrentUser } from "@/lib/auth";
import { getTeamWithMembers, isTeamMember } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/teams/[teamId]/members - Get all team member's usernames
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
    
    const isMember = await isTeamMember(teamId, currentUser.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      );
    }
    
    // Get full team data with members for each team
    const teamWithMembers = await getTeamWithMembers(teamId);
    const members: Record<string, string> = Object.fromEntries(
      (teamWithMembers?.members ?? []).map((m) => [m.user.id, m.user.username])
    );
    return NextResponse.json({ 
      members
    });
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
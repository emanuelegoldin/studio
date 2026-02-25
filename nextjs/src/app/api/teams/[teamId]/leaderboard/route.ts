/**
 * Team Leaderboard API
 * Spec Reference: 12-team-tabs.md
 *
 * Returns persisted leaderboard data for a team from the
 * team_leaderboard table (joined with users for display info).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isTeamMember, getTeamLeaderboard } from "@/lib/db";

// ── Route handler ─────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { teamId } = await params;

    const isMember = await isTeamMember(teamId, currentUser.id);
    if (!isMember) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 });
    }

    const leaderboard = await getTeamLeaderboard(teamId);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

"use client";

/**
 * Cards Tab — Team Detail Page
 * Spec Reference: 06-bingo-gameplay.md, 08-visibility-and-updates.md
 *
 * Displays every team member's bingo card. The current user can interact
 * with their own card (mark cells completed, undo, etc.). Other cards
 * are view-only.
 */

import { useMemo } from "react";
import { BingoCard } from "@/components/bingo-card";
import { TeamMembersProvider } from "@/components/team-members-context";
import { TeamWsProvider } from "@/components/team-ws-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { Team, BingoCardData } from "./types";

interface CardsTabProps {
  team: Team;
  cards: BingoCardData[];
  currentUserId: string;
  onCellUpdate: (cellId: string, newState: "pending" | "completed") => void;
  onRefresh: () => void;
}

export function CardsTab({ team, cards, currentUserId, onCellUpdate, onRefresh }: CardsTabProps) {
  // Build the userId → username map once from the already-loaded team data.
  const membersMap = useMemo(
    () =>
      Object.fromEntries(
        team.members.map((m) => [m.user.userId, m.user.username])
      ),
    [team.members]
  );

  if (team.status === "forming") {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h3 className="text-xl font-semibold font-headline mb-2">Game Not Started Yet</h3>
          <p className="text-muted-foreground">
            The team leader will start the game once everyone has proposed resolutions for each
            other.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No bingo cards available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TeamWsProvider teamId={team.id} onRefresh={onRefresh}>
    <TeamMembersProvider members={membersMap}>
    <div className="space-y-8">
      <h2 className="text-2xl font-bold font-headline">Bingo Cards</h2>

      {team.members.map((member, index) => {
        const card = cards.find((c) => c.userId === member.user.userId);
        const isCurrentUser = member.user.userId === currentUserId;

        return (
          <div key={member.user.userId}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {/* Clickable avatar → profile page */}
                  <Link href={`/profile/${member.user.userId}`}>
                    <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarFallback>
                        {(member.user.displayName || member.user.username)?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <CardTitle className="font-headline text-xl">
                    {member.user.displayName || member.user.username}
                    {isCurrentUser && " (You)"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {card ? (
                  <BingoCard
                    cells={card.cells}
                    isOwner={isCurrentUser}
                    teamId={team.id}
                    currentUserId={currentUserId}
                    onCellUpdate={isCurrentUser ? onCellUpdate : undefined}
                    onRefresh={onRefresh}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No bingo card available
                  </p>
                )}
              </CardContent>
            </Card>
            {index < team.members.length - 1 && <Separator className="my-8" />}
          </div>
        );
      })}
    </div>
    </TeamMembersProvider>
    </TeamWsProvider>
  );
}

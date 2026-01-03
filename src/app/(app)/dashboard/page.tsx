"use client";

/**
 * Dashboard Page
 * Spec Reference: 00-system-overview.md - Primary Flows
 */

import { useState, useEffect, useCallback } from 'react';
import { BingoCard } from "@/components/bingo-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Plus } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface BingoCell {
  id: string;
  cardId: string;
  position: number;
  resolutionText: string;
  isJoker: boolean;
  isEmpty: boolean;
  sourceType: string;
  sourceUserId: string | null;
  state: 'to_complete' | 'completed';
  proof: {
    id: string;
    status: 'pending' | 'approved' | 'declined';
  } | null;
}

interface BingoCardData {
  id: string;
  teamId: string;
  userId: string;
  gridSize: number;
  cells: BingoCell[];
}

interface TeamMember {
  membership: {
    id: string;
    teamId: string;
    userId: string;
    role: 'leader' | 'member';
  };
  user: {
    id: string;
    userId: string;
    username: string;
    displayName: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  status: 'forming' | 'started';
  members: TeamMember[];
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeCards, setActiveCards] = useState<{ team: Team; card: BingoCardData }[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      // Get current user
      const profileRes = await fetch('/api/profile');
      const profileData = await profileRes.json();
      
      if (!profileRes.ok) {
        setIsLoading(false);
        return;
      }
      
      setCurrentUserId(profileData.user?.id || '');

      // Get teams
      const teamsRes = await fetch('/api/teams');
      const teamsData = await teamsRes.json();
      
      if (teamsRes.ok) {
        const userTeams = teamsData.teams || [];
        setTeams(userTeams);

        // Get cards for started teams
        const cardsPromises = userTeams
          .filter((t: Team) => t.status === 'started')
          .map(async (team: Team) => {
            const cardsRes = await fetch(`/api/teams/${team.id}/cards?userId=${profileData.user.id}`);
            const cardsData = await cardsRes.json();
            if (cardsRes.ok && cardsData.card) {
              return { team, card: cardsData.card };
            }
            return null;
          });

        const cards = await Promise.all(cardsPromises);
        setActiveCards(cards.filter((c): c is { team: Team; card: BingoCardData } => c !== null));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCellUpdate = async (teamId: string, cellId: string, newState: 'to_complete' | 'completed') => {
    try {
      const response = await fetch(`/api/cells/${cellId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      });

      if (response.ok) {
        // Refresh the specific card
        const cardsRes = await fetch(`/api/teams/${teamId}/cards?userId=${currentUserId}`);
        const cardsData = await cardsRes.json();
        if (cardsRes.ok && cardsData.card) {
          setActiveCards(prev => 
            prev.map(item => 
              item.team.id === teamId 
                ? { ...item, card: cardsData.card }
                : item
            )
          );
        }
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update cell",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="container mx-auto">
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold font-headline mb-2">Welcome to Resolution Bingo!</h2>
            <p className="text-muted-foreground mb-6">
              Join or create a team to start playing.
            </p>
            <Button asChild>
              <Link href="/teams">
                <Plus className="mr-2 h-4 w-4" /> Get Started
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeCards.length === 0) {
    return (
      <div className="container mx-auto">
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold font-headline mb-2">No Active Games</h2>
            <p className="text-muted-foreground mb-6">
              You're part of {teams.length} team{teams.length > 1 ? 's' : ''}, but no games have started yet.
            </p>
            <Button asChild>
              <Link href="/teams">View Your Teams</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8">
      {activeCards.map(({ team, card }) => (
        <Card key={team.id} className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Your Bingo Card for "{team.name}"
            </CardTitle>
            <CardDescription>
              Complete your resolutions to get a BINGO! Click on a cell to mark it as completed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BingoCard 
              cells={card.cells} 
              isOwner={true}
              onCellUpdate={(cellId, newState) => handleCellUpdate(team.id, cellId, newState)}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

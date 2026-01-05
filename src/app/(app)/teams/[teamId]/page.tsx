"use client";

/**
 * Team Detail Page
 * Spec Reference: 04-bingo-teams.md, 05-bingo-card-generation.md, 06-bingo-gameplay.md
 */

import { useState, useEffect, useCallback } from 'react';
import { BingoCard } from "@/components/bingo-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Crown, Send, Settings, Swords, Copy, UserPlus, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  membership: {
    id: string;
    teamId: string;
    userId: string;
    role: 'leader' | 'member';
    joinedAt: string;
  };
  user: {
    id: string;
    userId: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  leaderUserId: string;
  teamResolutionText: string | null;
  status: 'forming' | 'started';
  members: TeamMember[];
}

interface BingoCell {
  id: string;
  cardId: string;
  position: number;
  resolutionText: string;
  isJoker: boolean;
  isEmpty: boolean;
  sourceType: string;
  sourceUserId: string | null;
  state: 'pending' | 'completed' | 'pending_review' | 'accomplished';
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

interface TeamProvidedResolution {
  id: string;
  teamId: string;
  fromUserId: string;
  toUserId: string;
  text: string;
}

export default function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { toast } = useToast();
  const [teamId, setTeamId] = useState<string>('');
  const [team, setTeam] = useState<Team | null>(null);
  const [cards, setCards] = useState<BingoCardData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  
  // Team resolution dialog
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [teamResolutionText, setTeamResolutionText] = useState('');
  const [isSavingResolution, setIsSavingResolution] = useState(false);
  
  // Invite dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Member resolutions dialog
  const [memberResolutionsOpen, setMemberResolutionsOpen] = useState(false);
  const [memberResolutions, setMemberResolutions] = useState<Record<string, string>>({});
  const [isSavingMemberResolutions, setIsSavingMemberResolutions] = useState(false);
  const [existingResolutions, setExistingResolutions] = useState<TeamProvidedResolution[]>([]);

  useEffect(() => {
    params.then(p => setTeamId(p.teamId));
  }, [params]);

  const loadTeam = useCallback(async () => {
    if (!teamId) return;
    
    try {
      // Get current user
      const profileRes = await fetch('/api/profile');
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.user) {
        setCurrentUserId(profileData.user.id);
      }

      // Get team details
      const response = await fetch(`/api/teams/${teamId}`);
      const data = await response.json();
      
      if (response.ok) {
        setTeam(data.team);
        setTeamResolutionText(data.team.teamResolutionText || '');
        
        // Get bingo cards if game started
        if (data.team.status === 'started') {
          const cardsRes = await fetch(`/api/teams/${teamId}/cards`);
          const cardsData = await cardsRes.json();
          if (cardsRes.ok) {
            setCards(cardsData.cards || []);
          }
        }
        
        // Get existing member-provided resolutions
        const resRes = await fetch(`/api/teams/${teamId}/resolutions`);
        const resData = await resRes.json();
        if (resRes.ok) {
          setExistingResolutions(resData.createdByUser || []);
          const initial: Record<string, string> = {};
          (resData.createdByUser || []).forEach((r: TeamProvidedResolution) => {
            initial[r.toUserId] = r.text;
          });
          setMemberResolutions(initial);
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load team",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [teamId, toast]);

  useEffect(() => {
    if (teamId) {
      loadTeam();
    }
  }, [teamId, loadTeam]);

  const isLeader = team?.leaderUserId === currentUserId;
  const leader = team?.members.find(m => m.membership.role === 'leader');

  const handleSaveTeamResolution = async () => {
    if (!teamResolutionText.trim()) return;
    
    setIsSavingResolution(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          teamResolutionText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTeam(data.team);
        setResolutionDialogOpen(false);
        toast({
          title: "Success",
          description: "Team resolution saved",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save resolution",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSavingResolution(false);
    }
  };

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteCode(data.invitation.inviteCode);
        toast({
          title: "Success",
          description: "Invite link created",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create invite",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveMemberResolutions = async () => {
    setIsSavingMemberResolutions(true);
    try {
      // Save resolutions for each member
      for (const [toUserId, text] of Object.entries(memberResolutions)) {
        if (text.trim() && toUserId !== currentUserId) {
          await fetch(`/api/teams/${teamId}/resolutions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toUserId, text }),
          });
        }
      }
      
      setMemberResolutionsOpen(false);
      toast({
        title: "Success",
        description: "Resolutions saved",
      });
      loadTeam(); // Reload to get updated status
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSavingMemberResolutions(false);
    }
  };

  const handleStartBingo = async () => {
    setIsStarting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/start`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Bingo game started!",
        });
        loadTeam(); // Reload to show cards
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to start game",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleCellUpdate = async (cellId: string, newState: 'pending' | 'completed') => {
    try {
      const response = await fetch(`/api/cells/${cellId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      });

      if (response.ok) {
        // Refresh cards
        const cardsRes = await fetch(`/api/teams/${teamId}/cards`);
        const cardsData = await cardsRes.json();
        if (cardsRes.ok) {
          setCards(cardsData.cards || []);
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

  if (!team) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Team not found</h1>
        <p className="text-muted-foreground">The team you are looking for does not exist.</p>
        <Button asChild variant="link"><Link href="/teams">Back to Teams</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="font-headline text-3xl">{team.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Crown className="h-4 w-4 text-amber-500" />
              Team Leader: {leader?.user.displayName || leader?.user.username || 'Unknown'}
            </CardDescription>
            {team.teamResolutionText && (
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-semibold text-foreground">Team Goal:</span> {team.teamResolutionText}
              </p>
            )}
            <div className="mt-2">
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                team.status === 'started' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {team.status === 'started' ? 'Game Started' : 'Forming Team'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isLeader && team.status === 'forming' && (
              <>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" /> Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Members</DialogTitle>
                      <DialogDescription>
                        Create an invite link to share with your friends.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {!inviteCode ? (
                        <Button onClick={handleCreateInvite} disabled={isCreatingInvite}>
                          {isCreatingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Generate Invite Link
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Label>Invite Link</Label>
                          <div className="flex gap-2">
                            <Input 
                              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`}
                              readOnly
                            />
                            <Button onClick={copyInviteLink} variant="outline">
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" /> Set Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Team Resolution</DialogTitle>
                      <DialogDescription>
                        Set the team goal that will appear in the center of everyone's bingo card.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Textarea
                        placeholder="e.g., Complete a team charity walk"
                        value={teamResolutionText}
                        onChange={(e) => setTeamResolutionText(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveTeamResolution} disabled={isSavingResolution || !teamResolutionText.trim()}>
                        {isSavingResolution && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button onClick={handleStartBingo} disabled={isStarting}>
                  {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Swords className="h-4 w-4 mr-2" /> Start Bingo
                </Button>
              </>
            )}
            {team.status === 'forming' && (
              <Dialog open={memberResolutionsOpen} onOpenChange={setMemberResolutionsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Send className="h-4 w-4 mr-2"/> Propose Resolutions
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Propose Resolutions</DialogTitle>
                    <DialogDescription>
                      Create a resolution for each team member.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                    {team.members
                      .filter(m => m.user.userId !== currentUserId)
                      .map(member => (
                        <div key={member.user.userId} className="space-y-2">
                          <Label>For {member.user.displayName || member.user.username}</Label>
                          <Input
                            placeholder="e.g., Learn to cook a new dish"
                            value={memberResolutions[member.user.userId] || ''}
                            onChange={(e) => setMemberResolutions({
                              ...memberResolutions,
                              [member.user.userId]: e.target.value,
                            })}
                          />
                        </div>
                      ))}
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveMemberResolutions} disabled={isSavingMemberResolutions}>
                      {isSavingMemberResolutions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Resolutions
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>
      
      {team.status === 'forming' && (
        <Card>
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-semibold font-headline mb-2">Game Not Started Yet</h3>
            <p className="text-muted-foreground">
              {isLeader 
                ? "Set the team resolution and ensure all members have proposed resolutions for each other, then start the game."
                : "The team leader will start the game once everyone has proposed resolutions for each other."}
            </p>
          </CardContent>
        </Card>
      )}

      {team.status === 'started' && cards.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold font-headline">Team Members & Bingo Cards</h2>
          {team.members.map((member, index) => {
            const card = cards.find(c => c.userId === member.user.userId);
            const isCurrentUser = member.user.userId === currentUserId;
            
            return (
              <div key={member.user.userId}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(member.user.displayName || member.user.username)?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
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
                        onCellUpdate={isCurrentUser ? handleCellUpdate : undefined}
                      />
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No bingo card available</p>
                    )}
                  </CardContent>
                </Card>
                {index < team.members.length - 1 && <Separator className="my-8"/>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

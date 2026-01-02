import { BingoCard } from "@/components/bingo-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { teams, users } from "@/lib/data";
import { Crown, Send, Settings, Swords } from "lucide-react";
import Link from "next/link";

export default function TeamDetailPage({ params }: { params: { teamId: string } }) {
  const team = teams.find(t => t.id === params.teamId);
  const currentUser = users[0];

  if (!team) {
    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold">Team not found</h1>
            <p className="text-muted-foreground">The team you are looking for does not exist.</p>
            <Button asChild variant="link"><Link href="/teams">Back to Teams</Link></Button>
        </div>
    );
  }

  const isLeader = team.leader.id === currentUser.id;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
            <div>
                <CardTitle className="font-headline text-3xl">{team.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Team Leader: {team.leader.name}
                </CardDescription>
                 <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-semibold text-foreground">Team Goal:</span> {team.teamResolution.text}
                 </p>
            </div>
            <div className="flex gap-2">
                {isLeader && (
                    <>
                        <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
                        <Button variant="default"><Swords className="h-4 w-4 mr-2" /> Start Bingo</Button>
                    </>
                )}
                {!isLeader && (
                    <Button variant="outline"><Send className="h-4 w-4 mr-2"/>Propose Resolutions</Button>
                )}
            </div>
        </CardHeader>
      </Card>
      
      <div className="space-y-8">
        <h2 className="text-2xl font-bold font-headline">Team Members & Bingo Cards</h2>
        {team.members.map((member, index) => (
          <div key={member.user.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.user.avatar.imageUrl} alt={member.user.name} data-ai-hint={member.user.avatar.imageHint} />
                    <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="font-headline text-xl">{member.user.name}{member.user.id === currentUser.id && " (You)"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <BingoCard resolutions={member.bingoCard} />
              </CardContent>
            </Card>
            {index < team.members.length - 1 && <Separator className="my-8"/>}
          </div>
        ))}
      </div>
    </div>
  );
}

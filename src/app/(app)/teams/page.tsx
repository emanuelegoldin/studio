import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { users, teams } from "@/lib/data";
import { Plus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TeamsPage() {
  const currentUser = users[0];
  const myTeams = teams.filter(team => team.members.some(member => member.user.id === currentUser.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          My Teams
        </h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create New Team
        </Button>
      </div>
      
      {myTeams.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myTeams.map(team => (
            <Card key={team.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary"/>
                    {team.name}
                </CardTitle>
                <CardDescription>Led by {team.leader.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm font-medium mb-2">Team Members:</p>
                <div className="flex items-center space-x-2">
                   <div className="flex -space-x-2 overflow-hidden">
                        {team.members.map(member => (
                            <Avatar key={member.user.id} className="inline-block h-8 w-8 rounded-full border-2 border-card">
                                <AvatarImage src={member.user.avatar.imageUrl} alt={member.user.name} data-ai-hint={member.user.avatar.imageHint} />
                                <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {team.members.length} members
                    </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/teams/${team.id}`}>View Team Bingo</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold font-headline">No Teams Yet</h3>
          <p className="text-muted-foreground mt-2 mb-4">You're not part of any team. Create one to get started!</p>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Team
          </Button>
        </div>
      )}
    </div>
  );
}

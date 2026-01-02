import { BingoCard } from "@/components/bingo-card";
import { teams } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
    // For demonstration, we'll show the bingo card for the first user in the first team.
    const myTeam = teams[0];
    const me = myTeam.members[0];

    if (!me || !myTeam) {
        return <div>Could not find your team data.</div>
    }

  return (
    <div className="container mx-auto">
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">
                    Your Bingo Card for "{myTeam.name}"
                </CardTitle>
                <CardDescription>
                    Complete your resolutions to get a BINGO! Click on a completed task to request validation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <BingoCard resolutions={me.bingoCard} />
            </CardContent>
        </Card>
    </div>
  );
}

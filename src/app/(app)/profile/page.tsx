"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { users, type Resolution } from "@/lib/data";
import { Plus, Trash2 } from 'lucide-react';
import { UserAvatarButton } from '@/components/user-avatar-button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


function ProfileForm() {
    const user = users[0];
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Profile Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatar.imageUrl} alt={user.name} data-ai-hint={user.avatar.imageHint} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline">Change Photo</Button>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={user.name} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user.email} />
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch id="public-profile" />
                    <Label htmlFor="public-profile">Make my profile public</Label>
                </div>
            </CardContent>
            <CardFooter>
                <Button>Save Changes</Button>
            </CardFooter>
        </Card>
    );
}

function ResolutionsManager() {
    const [resolutions, setResolutions] = useState<Resolution[]>(users[0].resolutions);
    const [newResolution, setNewResolution] = useState("");

    const handleAddResolution = () => {
        if (newResolution.trim()) {
            const newRes: Resolution = {
                id: `res-${Date.now()}`,
                text: newResolution,
                isCompleted: false,
                status: 'tocomplete'
            };
            setResolutions([...resolutions, newRes]);
            setNewResolution("");
        }
    };
    
    const handleDeleteResolution = (id: string) => {
        setResolutions(resolutions.filter(res => res.id !== id));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">My Personal Resolutions</CardTitle>
                <CardDescription>Add, edit, or delete your personal resolutions. These can be used to fill your bingo cards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input 
                        placeholder="e.g., Run a marathon"
                        value={newResolution}
                        onChange={(e) => setNewResolution(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddResolution()}
                    />
                    <Button onClick={handleAddResolution}><Plus className="h-4 w-4 mr-2"/>Add</Button>
                </div>
                <Separator />
                <ul className="space-y-2">
                    {resolutions.map(res => (
                        <li key={res.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                            <span className="text-sm">{res.text}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteResolution(res.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                     {resolutions.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground py-4">You haven't added any resolutions yet.</p>
                     )}
                </ul>
            </CardContent>
        </Card>
    )
}

export default function ProfilePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Settings
            </h1>

            <Tabs defaultValue="profile">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="resolutions">Resolutions</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-6">
                    <ProfileForm />
                </TabsContent>
                <TabsContent value="resolutions" className="mt-6">
                    <ResolutionsManager />
                </TabsContent>
                <TabsContent value="password" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Change Password</CardTitle>
                            <CardDescription>Update your password here. It's a good idea to use a strong, unique password.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Update Password</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

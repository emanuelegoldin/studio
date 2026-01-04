"use client";

/**
 * Profile Page
 * Spec Reference: 02-user-profile-and-privacy.md, 03-personal-resolutions.md
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
}

interface Resolution {
  id: string;
  ownerUserId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

function ProfileForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [displayNamePublic, setDisplayNamePublic] = useState(true);
  const [bioPublic, setBioPublic] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setDisplayName(data.profile?.displayName || '');
        setBio(data.profile?.bio || '');
        setDisplayNamePublic(data.profile?.displayNamePublic ?? true);
        setBioPublic(data.profile?.bioPublic ?? false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          bio,
          displayNamePublic,
          bioPublic,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
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
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Verification email sent successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to resend verification email",
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
      setIsResendingVerification(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Profile Information</CardTitle>
        <CardDescription>Update your personal details here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl">{user?.username?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.username}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {user?.emailVerified ? (
              <p className="text-sm text-green-600 font-medium mt-1">✓ Email Verified</p>
            ) : (
              <div className="mt-1">
                <p className="text-sm text-amber-600 font-medium">⚠ Email Not Verified</p>
                <p className="text-xs text-muted-foreground">You need to verify your email to create or join teams.</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs mt-1"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                >
                  {isResendingVerification ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input 
            id="displayName" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
          <div className="flex items-center space-x-2">
            <Switch 
              id="displayNamePublic" 
              checked={displayNamePublic}
              onCheckedChange={setDisplayNamePublic}
            />
            <Label htmlFor="displayNamePublic" className="text-sm text-muted-foreground">
              Make display name public
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea 
            id="bio" 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about yourself..."
            rows={3}
          />
          <div className="flex items-center space-x-2">
            <Switch 
              id="bioPublic" 
              checked={bioPublic}
              onCheckedChange={setBioPublic}
            />
            <Label htmlFor="bioPublic" className="text-sm text-muted-foreground">
              Make bio public
            </Label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}

function ResolutionsManager() {
  const { toast } = useToast();
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [newResolution, setNewResolution] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadResolutions = useCallback(async () => {
    try {
      const response = await fetch('/api/resolutions');
      const data = await response.json();
      
      if (response.ok) {
        setResolutions(data.resolutions || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load resolutions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadResolutions();
  }, [loadResolutions]);

  const handleAddResolution = async () => {
    if (!newResolution.trim()) return;
    
    setIsAdding(true);
    try {
      const response = await fetch('/api/resolutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newResolution }),
      });

      const data = await response.json();

      if (response.ok) {
        setResolutions([data.resolution, ...resolutions]);
        setNewResolution("");
        toast({
          title: "Success",
          description: "Resolution added",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add resolution",
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
      setIsAdding(false);
    }
  };
  
  const handleDeleteResolution = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/resolutions?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setResolutions(resolutions.filter(res => res.id !== id));
        toast({
          title: "Success",
          description: "Resolution deleted",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete resolution",
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
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

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
            onKeyDown={(e) => e.key === 'Enter' && !isAdding && handleAddResolution()}
            disabled={isAdding}
          />
          <Button onClick={handleAddResolution} disabled={isAdding || !newResolution.trim()}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><Plus className="h-4 w-4 mr-2"/>Add</>
            )}
          </Button>
        </div>
        <Separator />
        <ul className="space-y-2">
          {resolutions.map(res => (
            <li key={res.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
              <span className="text-sm">{res.text}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                onClick={() => handleDeleteResolution(res.id)}
                disabled={deletingId === res.id}
              >
                {deletingId === res.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </li>
          ))}
          {resolutions.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">You haven't added any resolutions yet.</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
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

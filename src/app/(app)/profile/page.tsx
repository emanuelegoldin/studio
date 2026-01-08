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
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useSetAppHeaderTitle } from "@/components/app-header-title";
import { UserProfile } from '@/lib/db';

interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
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
      // From api/profile/page.tsx lines 47-56
      const data: {
      profile: UserProfile,
      user: {
        id: string,
        username: string,
        email: string,
        emailVerified: boolean,
      },
      isOwner: boolean,
    } = await response.json();
      
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
            <AvatarFallback className="text-2xl">{String.fromCodePoint(user?.username?.codePointAt(0) || 63)}</AvatarFallback>
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

export default function ProfilePage() {
  useSetAppHeaderTitle("Settings");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileForm />
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

"use client";

/**
 * Public Profile Page
 * Spec Reference: 02-user-profile-and-privacy.md
 *
 * Displays a user's public profile (username, display name if public, bio if public).
 * If the viewer is the profile owner, redirects to the editable profile page.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSetAppHeaderTitle } from "@/components/app-header-title";
import type { PublicUserProfile } from "@/lib/db";

interface ProfileResponse {
  profile: PublicUserProfile;
  isOwner: boolean;
  /** Only present when isOwner is true */
  user?: {
    id: string;
    username: string;
    email: string;
    emailVerified: boolean;
  };
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  useSetAppHeaderTitle("Profile");

  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      const data: ProfileResponse = await response.json();

      if (data.isOwner) {
        // Redirect owners to the editable profile page
        router.replace("/profile");
        return;
      }

      if (response.ok && data.profile) {
        setProfile(data.profile);
      } else {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, router, toast]);

  useEffect(() => {
    if (userId) loadProfile();
  }, [userId, loadProfile]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">User not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar & username */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {String.fromCodePoint(profile.username.codePointAt(0) ?? 63)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-lg">{profile.username}</p>
              {profile.displayName && (
                <p className="text-sm text-muted-foreground">
                  {profile.displayName}
                </p>
              )}
            </div>
          </div>

          {/* Bio (only shown if the user made it public) */}
          {profile.bio && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-1">Bio</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

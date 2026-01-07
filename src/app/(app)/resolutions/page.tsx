"use client";

/**
 * Resolutions Page
 * Spec Reference: 02-user-profile-and-privacy.md, 03-personal-resolutions.md
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSetAppHeaderTitle } from "@/components/app-header-title";

interface Resolution {
  id: string;
  ownerUserId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
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

export default function ResolutionsPage() {
  useSetAppHeaderTitle("Resolutions");

  return (
    <div className="space-y-6">
      <ResolutionsManager />
    </div>
  );
}

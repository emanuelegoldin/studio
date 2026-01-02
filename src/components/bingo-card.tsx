"use client";

import { useState } from "react";
import type { Resolution } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Star, Check, Hourglass, ThumbsUp, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";

interface BingoSquareProps {
  resolution: Resolution;
  onUpdate: (resolution: Resolution, status: Resolution['status']) => void;
}

const statusConfig = {
    tocomplete: { icon: null, color: "bg-card hover:bg-secondary/50", text: "text-card-foreground" },
    pending: { icon: <Hourglass className="h-4 w-4 text-amber-500" />, color: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-800 dark:text-amber-300" },
    completed: { icon: <Check className="h-4 w-4 text-green-500" />, color: "bg-green-100 dark:bg-green-900/50", text: "text-green-800 dark:text-green-300 line-through" },
    rejected: { icon: <X className="h-4 w-4 text-red-500" />, color: "bg-red-100 dark:bg-red-900/50", text: "text-red-800 dark:text-red-300" },
};

function BingoSquare({ resolution, onUpdate }: BingoSquareProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isJoker = resolution.id === "joker";
  
  const config = statusConfig[resolution.status] || statusConfig.tocomplete;

  const handleClick = () => {
    if (isJoker || resolution.status !== 'tocomplete') return;
    setIsModalOpen(true);
  };

  const handleValidationRequest = () => {
    onUpdate(resolution, 'pending');
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isJoker || resolution.status !== 'tocomplete'}
        className={cn(
          "relative flex flex-col items-center justify-center aspect-square p-2 rounded-lg border shadow-sm text-center transition-all duration-300",
          config.color,
          isJoker ? "bg-primary text-primary-foreground cursor-default" : "cursor-pointer",
          resolution.status === 'tocomplete' && !isJoker ? "hover:scale-105 hover:shadow-md" : ""
        )}
      >
        {isJoker && <Star className="h-8 w-8 mb-1" />}
        <p className={cn("text-xs md:text-sm font-medium", config.text)}>
          {resolution.text}
        </p>
        <div className="absolute top-1 right-1">
          {resolution.status !== 'tocomplete' && !isJoker && config.icon}
        </div>
        {!isJoker && resolution.proposer && (
            <Badge variant="outline" className="absolute bottom-1 right-1 text-xs">
              {resolution.proposer}
            </Badge>
        )}
      </button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">Complete Resolution?</DialogTitle>
            <DialogDescription>
              You are about to mark "{resolution.text}" as completed. Please provide proof for your team to verify.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <Textarea placeholder="Add a comment or a link to your proof (e.g., photo, screenshot)..." />
             <Button variant="outline" size="sm">Upload File</Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleValidationRequest}><ThumbsUp className="mr-2 h-4 w-4" />Request Validation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BingoCard({ resolutions: initialResolutions }: { resolutions: Resolution[] }) {
  const [resolutions, setResolutions] = useState<Resolution[]>(initialResolutions);

  const handleUpdateResolution = (updatedResolution: Resolution, status: Resolution['status']) => {
    setResolutions(currentResolutions => 
      currentResolutions.map(res => 
        res.id === updatedResolution.id ? { ...res, status: status } : res
      )
    );
  };

  return (
    <div className="grid grid-cols-5 grid-rows-5 gap-2 md:gap-4">
      {resolutions.map((res) => (
        <BingoSquare key={res.id} resolution={res} onUpdate={handleUpdateResolution} />
      ))}
    </div>
  );
}

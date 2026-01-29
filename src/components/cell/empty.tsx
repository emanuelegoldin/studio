import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { CellSourceType } from "@/lib/db";
import { Loader2 } from "lucide-react";

interface EmptyCellProps {
    editMode: boolean,
    isOwner: boolean,
    setEditMode: (editMode: boolean) => void
}

type EditOption = {
  key: string;
  label: string;
  resolutionText: string;
  resolutionId: string | null;
  teamProvidedResolutionId: string | null;
  sourceType: CellSourceType;
  sourceUserId: string | null;
  isEmpty: boolean;
};

export const EmptyCell = ({
    editMode,
    isOwner
}: EmptyCellProps) => {
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isEditOptionsLoading, setIsEditOptionsLoading] = useState(false);
    const [editOptions, setEditOptions] = useState<EditOption[]>([]); // Makes sense ot have it at the Card level (multiple cells uses this information)
    const [editFilter, setEditFilter] = useState('');
    // const [usernames, setUsernames] = useState<Record<string,string>>({});  // TODO: add endpoint to get team members' usernames // Makes sense ot have it at the Card level (multiple cells uses this information)
    // const [editMode, setEditMode] = useState<boolean>(false)

    // TODO: set which modal to show to parent
    const handleClick = () => {
    if (editMode) {
      setShowDialog(true);
      return;
    }
  };
const canInteract = Boolean(editMode && isOwner);
    return (
      <button
        onClick={handleClick}
        disabled={!canInteract}
        className={cn(
          "relative flex flex-col items-center justify-center aspect-square p-2 rounded-lg border shadow-sm text-center transition-all duration-300",
          "bg-card hover:bg-secondary/50",
          "bg-muted cursor-not-allowed",
          canInteract ? "cursor-pointer hover:scale-105 hover:shadow-md" : "cursor-default"
        )}
      >
        <p className={cn("text-xs md:text-sm font-medium", "text-card-foreground")}>
          Empty
        </p>
      </button>
    )
}
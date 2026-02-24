import { cn } from "@/lib/utils"
import { Star } from "lucide-react"
import { Cell } from "./cell"

export const JokerCell = () => {
    return(
      <Cell 
        cellClassName={cn(
          "relative flex flex-col items-center justify-center aspect-square p-2 rounded-lg border shadow-sm text-center transition-all duration-300",
          "bg-card hover:bg-secondary/50",                      // By default PENDING color
          "bg-primary text-primary-foreground cursor-default"   // isJoker
        )}
        isDisabled={true}
        onClick={() => {}}>
        <Star className="h-8 w-8 mb-1" />
        <p className={cn("text-xs md:text-sm font-medium",
            "text-card-foreground",
            "text-primary-foreground"   // isJoker
          )}>
          Joker
        </p>
      </Cell>
    )
}
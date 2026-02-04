import { PropsWithChildren } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"

interface CellDialogProps {
    title?: string,
    description?: string,
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void
}

export const CellDialog = ({
    title,
    description,
    isOpen,
    setIsOpen,
    children
} : PropsWithChildren<CellDialogProps>) => {
    return(
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
                {title && <DialogTitle className="font-headline">{title}</DialogTitle>}
                {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          {children}
          </DialogContent>
        </Dialog>
    )
}
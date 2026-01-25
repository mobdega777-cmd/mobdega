import { Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BillModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableNumber: number;
  onSelectMode: (mode: 'single' | 'split') => void;
}

const BillModeModal = ({ open, onOpenChange, tableNumber, onSelectMode }: BillModeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Mesa {tableNumber}</DialogTitle>
          <DialogDescription className="text-center">
            Como você deseja a comanda?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full h-20 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => onSelectMode('single')}
          >
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="font-semibold">Comanda Única</p>
              <p className="text-xs text-muted-foreground">Todos pagam juntos no final</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full h-20 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => onSelectMode('split')}
          >
            <User className="w-8 h-8 text-primary" />
            <div>
              <p className="font-semibold">Comandas Separadas</p>
              <p className="text-xs text-muted-foreground">Cada pessoa paga sua conta</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillModeModal;

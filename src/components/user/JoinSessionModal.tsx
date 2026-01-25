import { Users, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface JoinSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableNumber: number;
  hostName: string | null;
  billMode: 'single' | 'split';
  participantsCount: number;
  onJoin: () => void;
  onCancel: () => void;
}

const JoinSessionModal = ({ 
  open, 
  onOpenChange, 
  tableNumber, 
  hostName, 
  billMode,
  participantsCount,
  onJoin,
  onCancel
}: JoinSessionModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Mesa {tableNumber} Ocupada
          </DialogTitle>
          <DialogDescription className="text-center">
            Esta mesa já possui uma sessão ativa
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Aberta por:</span>
              <span className="font-medium">{hostName || 'Cliente'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tipo de comanda:</span>
              <div className="flex items-center gap-1">
                {billMode === 'single' ? (
                  <>
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">Única</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">Separada</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pessoas na mesa:</span>
              <span className="font-medium">{participantsCount}</span>
            </div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            {billMode === 'single' 
              ? 'Todos os pedidos serão somados em uma única conta.'
              : 'Cada pessoa terá sua própria conta individual.'}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={onJoin} className="flex-1">
            Juntar-se à Mesa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinSessionModal;

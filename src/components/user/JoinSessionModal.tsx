import { Users, User, UserPlus, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface JoinSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableNumber: number;
  tableName?: string | null;
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
  tableName,
  hostName, 
  billMode,
  participantsCount,
  onJoin,
  onCancel
}: JoinSessionModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
            <UtensilsCrossed className="w-7 h-7 text-orange-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            Mesa {tableNumber} Ocupada
          </DialogTitle>
          {tableName && (
            <p className="text-center text-sm text-muted-foreground">{tableName}</p>
          )}
          <DialogDescription className="text-center">
            Deseja entrar nesta mesa?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Session info card */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3 border">
            {/* Host */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Aberta por
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{hostName || 'Cliente'}</span>
                <Badge variant="secondary" className="text-xs">Host</Badge>
              </div>
            </div>
            
            {/* Bill mode */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                {billMode === 'single' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                Tipo de comanda
              </span>
              <Badge 
                variant="outline" 
                className={billMode === 'single' 
                  ? 'border-blue-500 text-blue-600 bg-blue-500/10' 
                  : 'border-orange-500 text-orange-600 bg-orange-500/10'
                }
              >
                {billMode === 'single' ? 'Única' : 'Separada'}
              </Badge>
            </div>
            
            {/* Participants */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Pessoas na mesa
              </span>
              <span className="font-semibold text-lg">{participantsCount}</span>
            </div>
          </div>
          
          {/* Explanation */}
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <p className="text-center text-sm text-foreground/80">
              {billMode === 'single' 
                ? '💳 Todos os pedidos serão somados em uma única conta.'
                : '📋 Cada pessoa terá sua própria conta individual.'}
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={onJoin} className="flex-1 gap-2">
            <UserPlus className="w-4 h-4" />
            Juntar-se à Mesa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinSessionModal;

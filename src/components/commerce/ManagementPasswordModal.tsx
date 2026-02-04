import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, AlertCircle, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ManagementPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPassword: string;
  commerceEmail?: string;
}

const ManagementPasswordModal = ({
  isOpen,
  onClose,
  onSuccess,
  correctPassword,
  commerceEmail,
}: ManagementPasswordModalProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === correctPassword) {
      setError(false);
      setPassword("");
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleForgotPassword = async () => {
    if (!commerceEmail) {
      toast({
        variant: "destructive",
        title: "Email não encontrado",
        description: "Não foi possível encontrar o email do comércio.",
      });
      return;
    }

    setSendingRecovery(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(commerceEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao enviar email",
          description: error.message,
        });
      } else {
        toast({
          title: "Email enviado!",
          description: `Enviamos um link de recuperação para ${commerceEmail}. Verifique também a pasta de SPAM ou lixo eletrônico.`,
        });
        handleClose();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setSendingRecovery(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Acesso Gestão
          </DialogTitle>
          <DialogDescription>
            Digite a senha de gestão para acessar todas as funcionalidades.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="management-password">Senha de Gestão</Label>
            <div className="relative">
              <Input
                id="management-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Digite a senha"
                className={error ? "border-destructive" : ""}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Senha incorreta
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={sendingRecovery}
              className="text-sm text-primary hover:underline disabled:opacity-50 inline-flex items-center gap-1"
            >
              {sendingRecovery ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="w-3 h-3" />
                  Esqueci a senha
                </>
              )}
            </button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!password}>
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManagementPasswordModal;

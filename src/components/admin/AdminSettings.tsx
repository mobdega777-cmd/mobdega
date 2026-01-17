import { useState } from "react";
import { 
  Settings, 
  Key, 
  Shield, 
  Save,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const AdminSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Preencha todos os campos',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'As senhas não coincidem',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'A senha deve ter pelo menos 6 caracteres',
      });
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar senha',
        description: error.message,
      });
    } else {
      toast({
        title: 'Senha alterada com sucesso!',
        description: 'Use sua nova senha no próximo login.',
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setIsChangingPassword(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as configurações do sistema
        </p>
      </div>

      {/* Account Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Informações da Conta
          </CardTitle>
          <CardDescription>
            Dados do administrador master
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label>ID do Usuário</Label>
              <Input 
                value={user?.id || ''} 
                disabled 
                className="bg-muted/50 font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Último acesso</Label>
            <Input 
              value={user?.last_sign_in_at 
                ? new Date(user.last_sign_in_at).toLocaleString('pt-BR')
                : '-'
              } 
              disabled 
              className="bg-muted/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Atualize a senha de acesso ao painel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-500">Atenção</p>
              <p className="text-sm text-muted-foreground">
                Após alterar a senha, você precisará usar a nova senha no próximo login.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
            </div>
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={isChangingPassword}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Versão</p>
              <p className="text-lg font-semibold text-foreground">1.0.0</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Ambiente</p>
              <p className="text-lg font-semibold text-foreground">Produção</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold text-green-500">Online</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, KeyRound, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoMobdega from "@/assets/logo-mobdega.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isValidPassword = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  useEffect(() => {
    // Check if user came from password reset email
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setHasSession(true);
      } else {
        // Try to get session from URL hash (Supabase puts it there after email click)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (!error) {
            setHasSession(true);
          }
        }
      }
      
      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async () => {
    if (!isValidPassword) {
      toast({
        variant: "destructive",
        title: "Senha inválida",
        description: "A senha deve atender todos os requisitos.",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        variant: "destructive",
        title: "Senhas não conferem",
        description: "A confirmação de senha deve ser igual à senha.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      // Clear force_password_change flag if it exists for this commerce
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('commerces')
          .update({ force_password_change: false, temp_password_set_at: null })
          .eq('owner_id', user.id);
      }

      setIsSuccess(true);
      
      toast({
        title: "Senha alterada com sucesso!",
        description: "Você pode fazer login com sua nova senha.",
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logoMobdega} alt="Mobdega" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-destructive flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Link Inválido ou Expirado
            </CardTitle>
            <CardDescription>
              Este link de recuperação de senha não é mais válido. Solicite um novo link na página de login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="hero" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Voltar para o Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle>Senha Alterada!</CardTitle>
              <CardDescription>
                Sua senha foi alterada com sucesso. Você será redirecionado...
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <img src={logoMobdega} alt="Mobdega" className="h-16 mx-auto mb-4" />
            <CardTitle className="flex items-center justify-center gap-2">
              <KeyRound className="w-5 h-5" />
              Nova Senha
            </CardTitle>
            <CardDescription>
              Crie uma nova senha para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">A senha deve conter:</p>
              <ul className="space-y-1">
                <li className={`flex items-center gap-2 ${hasMinLength ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <Check className={`w-4 h-4 ${hasMinLength ? 'opacity-100' : 'opacity-30'}`} />
                  Mínimo 8 caracteres
                </li>
                <li className={`flex items-center gap-2 ${hasUpperCase ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <Check className={`w-4 h-4 ${hasUpperCase ? 'opacity-100' : 'opacity-30'}`} />
                  Uma letra maiúscula
                </li>
                <li className={`flex items-center gap-2 ${hasLowerCase ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <Check className={`w-4 h-4 ${hasLowerCase ? 'opacity-100' : 'opacity-30'}`} />
                  Uma letra minúscula
                </li>
                <li className={`flex items-center gap-2 ${hasNumber ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <Check className={`w-4 h-4 ${hasNumber ? 'opacity-100' : 'opacity-30'}`} />
                  Um número
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-destructive">As senhas não conferem</p>
              )}
              {passwordsMatch && (
                <p className="text-sm text-green-500 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Senhas conferem
                </p>
              )}
            </div>

            <Button 
              variant="hero" 
              className="w-full" 
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !isValidPassword || !passwordsMatch}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

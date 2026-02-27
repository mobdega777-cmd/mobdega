import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Store, Eye, EyeOff, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchAddressByCep, formatCep } from "@/lib/viaCepService";
import { formatCurrency, formatPercentage } from "@/lib/formatCurrency";
import { getFeatureLabels } from "@/lib/planFeatures";
type AuthMode = "login" | "register";
type UserType = "user" | "commerce";
type DocumentType = "cpf" | "cnpj";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  type: string;
  features: string[];
  description: string | null;
  allowed_menu_items: string[];
}

const AuthModal = ({ isOpen, onClose, initialMode = "login" }: AuthModalProps) => {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [userType, setUserType] = useState<UserType>("user");
  const [documentType, setDocumentType] = useState<DocumentType>("cpf");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<{ type: string; value: number; message?: string } | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    cep: "",
    city: "",
    neighborhood: "",
    address: "",
    number: "",
    complement: "",
    password: "",
    confirmPassword: "",
    // Commerce specific
    tradeName: "",
    ownerName: "",
    document: "",
    plan: "basic",
    couponCode: "", // New coupon field
  });

  // Fetch plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      const { data } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (data) {
        setPlans(data.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          type: p.type,
          features: Array.isArray(p.features) ? p.features as string[] : [],
          description: p.description,
          allowed_menu_items: Array.isArray(p.allowed_menu_items) ? p.allowed_menu_items as string[] : []
        })));
      }
      setLoadingPlans(false);
    };
    
    if (isOpen && mode === 'register' && userType === 'commerce') {
      fetchPlans();
    }
  }, [isOpen, mode, userType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle CEP with formatting and auto-lookup
    if (name === 'cep') {
      const formatted = formatCep(value);
      setFormData(prev => ({ ...prev, cep: formatted }));
      
      // Auto-lookup when 8 digits entered
      if (formatted.replace(/\D/g, '').length === 8) {
        handleCepLookup(formatted);
      }
      return;
    }

    // Handle coupon code - validate when user types
    if (name === 'couponCode') {
      const upperValue = value.toUpperCase();
      setFormData(prev => ({ ...prev, couponCode: upperValue }));
      if (upperValue.length >= 3) {
        validateCoupon(upperValue);
      } else {
        setCouponValid(null);
        setCouponDiscount(null);
      }
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const validateCoupon = async (code: string) => {
    setValidatingCoupon(true);
    setCouponValid(null);
    
    const { data: coupon, error } = await supabase
      .from('discount_coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error || !coupon) {
      setCouponValid(false);
      setCouponDiscount(null);
      setValidatingCoupon(false);
      return;
    }

    // Check if coupon is within valid dates
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      setCouponValid(false);
      setCouponDiscount(null);
      setValidatingCoupon(false);
      return;
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      setCouponValid(false);
      setCouponDiscount(null);
      setValidatingCoupon(false);
      return;
    }

    // Check max uses
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      setCouponValid(false);
      setCouponDiscount(null);
      setValidatingCoupon(false);
      return;
    }

    // Check if coupon applies to selected plan
    if (coupon.plan_ids && coupon.plan_ids.length > 0) {
      // Get the plan ID for the selected plan type
      const { data: planData } = await supabase
        .from('plans')
        .select('id')
        .eq('type', formData.plan as 'basic' | 'startup' | 'business')
        .eq('is_active', true)
        .single();
      
      if (planData && !coupon.plan_ids.includes(planData.id)) {
        setCouponValid(false);
        setCouponDiscount(null);
        setValidatingCoupon(false);
        return;
      }
    }

    setCouponValid(true);
    setCouponDiscount({
      type: coupon.discount_type,
      value: coupon.discount_value,
      message: (coupon as any).custom_message || null
    });
    setValidatingCoupon(false);
  };

  const handleCepLookup = async (cep: string) => {
    setLoadingCep(true);
    const address = await fetchAddressByCep(cep);
    setLoadingCep(false);
    
    if (address) {
      setFormData(prev => ({
        ...prev,
        city: address.city,
        neighborhood: address.neighborhood,
        address: address.street,
      }));
    }
  };

  const resetForm = () => {
    setMode("login");
    setUserType("user");
    setStep(1);
    setFormData({
      name: "",
      email: "",
      whatsapp: "",
      cep: "",
      city: "",
      neighborhood: "",
      address: "",
      number: "",
      complement: "",
      password: "",
      confirmPassword: "",
      tradeName: "",
      ownerName: "",
      document: "",
      plan: "basic",
      couponCode: "",
    });
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCommerceRegister = async () => {
    if (!formData.email || !formData.password || !formData.tradeName || !formData.ownerName || !formData.document) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the user account - triggers will auto-create role and profile
      const { error: signUpError } = await signUp(formData.email, formData.password, {
        full_name: formData.ownerName,
        user_type: 'commerce',
      });

      if (signUpError) {
        setIsSubmitting(false);
        return;
      }

      // Wait a moment for the auth to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the user that was just created
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro ao criar conta",
          description: "Não foi possível obter os dados do usuário.",
        });
        setIsSubmitting(false);
        return;
      }

      // Get the plan ID based on selected plan type
      const { data: planData } = await supabase
        .from('plans')
        .select('id')
        .eq('type', formData.plan as 'basic' | 'startup' | 'business')
        .eq('is_active', true)
        .single();

      // 2. Create the commerce record
      const { error: commerceError } = await supabase
        .from('commerces')
        .insert({
          owner_id: user.id,
          fantasy_name: formData.tradeName,
          owner_name: formData.ownerName,
          document: formData.document.replace(/\D/g, ''),
          document_type: documentType,
          email: formData.email,
          phone: formData.whatsapp,
          address: formData.address,
          address_number: formData.number,
          cep: formData.cep,
          city: formData.city,
          neighborhood: formData.neighborhood,
          complement: formData.complement,
          status: 'pending',
          plan_id: planData?.id || null,
          coupon_code: formData.couponCode || null,
          login_password: formData.password,
        });

      if (commerceError) {
        console.error('Error creating commerce:', commerceError);
        toast({
          variant: "destructive",
          title: "Erro ao criar comércio",
          description: commerceError.message,
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Update profile with additional data (trigger creates basic profile)
      await supabase
        .from('profiles')
        .update({
          phone: formData.whatsapp,
          address: formData.address,
          address_number: formData.number,
          cep: formData.cep,
          city: formData.city,
          neighborhood: formData.neighborhood,
          complement: formData.complement,
        })
        .eq('user_id', user.id);

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu comércio foi registrado e está aguardando aprovação.",
      });

      handleClose();
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserRegister = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Trigger will auto-create role and profile
      const { error: signUpError } = await signUp(formData.email, formData.password, {
        full_name: formData.name,
        user_type: 'user',
      });

      if (signUpError) {
        setIsSubmitting(false);
        return;
      }

      // Wait a moment for auth to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update profile with additional data (trigger creates basic profile)
        await supabase.from('profiles').update({
          phone: formData.whatsapp,
          address: formData.address,
          address_number: formData.number,
          cep: formData.cep,
          city: formData.city,
          neighborhood: formData.neighborhood,
          complement: formData.complement,
        }).eq('user_id', user.id);
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já está logado.",
      });

      handleClose();
      navigate('/minha-conta');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    setIsSubmitting(true);

    try {
      let emailToUse = formData.email;
      let isCommerceLogin = userType === 'commerce';

      // If commerce login with document, lookup email using secure RPC function
      if (userType === 'commerce' && formData.email) {
        // Check if input looks like a document (numbers only or formatted)
        const cleanInput = formData.email.replace(/\D/g, '');
        if (cleanInput.length >= 11) {
          // Lookup email by document using secure RPC function
          const { data: email, error } = await supabase
            .rpc('get_commerce_email_by_document', { p_document: cleanInput });
          
          if (error) {
            console.error('Error looking up commerce email:', error);
            toast({
              variant: "destructive",
              title: "Erro ao buscar comércio",
              description: "Ocorreu um erro ao buscar o comércio.",
            });
            setIsSubmitting(false);
            return;
          }
          
          if (email) {
            emailToUse = email;
          } else {
            toast({
              variant: "destructive",
              title: "Comércio não encontrado",
              description: "Não encontramos um comércio com este documento.",
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      if (!emailToUse || !formData.password) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Por favor, preencha email/documento e senha.",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await signIn(emailToUse, formData.password);
      if (!error) {
        // Redirect based on user type first, then close
        if (isCommerceLogin) {
          handleClose();
          navigate('/commerce');
        } else {
          handleClose();
          navigate('/minha-conta');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast({
        variant: "destructive",
        title: "Email obrigatório",
        description: "Por favor, informe seu email para recuperar a senha.",
      });
      return;
    }

    setSendingResetEmail(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
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
          description: "Verifique sua caixa de entrada para redefinir sua senha. Caso não encontre, verifique também a pasta de SPAM ou lixo eletrônico.",
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setSendingResetEmail(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {showForgotPassword 
                  ? "Recuperar senha" 
                  : mode === "login" 
                    ? "Bem-vindo de volta!" 
                    : "Criar conta"}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6">
              {/* Forgot Password Form */}
              {showForgotPassword ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <p className="text-sm text-muted-foreground">
                    Digite seu email cadastrado para receber o link de recuperação de senha.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-12"
                    />
                  </div>

                  <Button 
                    variant="hero" 
                    className="w-full" 
                    size="lg"
                    onClick={handleForgotPassword}
                    disabled={sendingResetEmail}
                  >
                    {sendingResetEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link de recuperação"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Lembrou a senha?{" "}
                    <button 
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-primary hover:underline"
                    >
                      Voltar ao login
                    </button>
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Mode Toggle */}
                  <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
                    <button
                      onClick={() => { setMode("login"); setStep(1); }}
                      className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                        mode === "login"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => { setMode("register"); setStep(1); }}
                      className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                        mode === "register"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Cadastro
                    </button>
                  </div>

              {/* Login Form */}
              {mode === "login" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  {/* User Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">
                      Tipo de acesso
                    </Label>
                    <RadioGroup
                      value={userType}
                      onValueChange={(v) => setUserType(v as UserType)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="user" id="login-user" />
                        <Label htmlFor="login-user" className="flex items-center gap-2 cursor-pointer">
                          <User className="w-4 h-4" />
                          Usuário
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="commerce" id="login-commerce" />
                        <Label htmlFor="login-commerce" className="flex items-center gap-2 cursor-pointer">
                          <Store className="w-4 h-4" />
                          Comércio
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Email/Document Field */}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">
                      {userType === "user" ? "Email" : "CPF ou CNPJ"}
                    </Label>
                    <Input
                      id="login-email"
                      name="email"
                      type={userType === "user" ? "email" : "text"}
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={userType === "user" ? "seu@email.com" : "000.000.000-00"}
                      className="h-12"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
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

                  <Button 
                    variant="hero" 
                    className="w-full" 
                    size="lg"
                    onClick={handleLogin}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Esqueceu sua senha?{" "}
                    <button 
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-primary hover:underline"
                    >
                      Recuperar
                    </button>
                  </p>
                </motion.div>
              )}

              {/* Register Form */}
              {mode === "register" && step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">
                      Quero me cadastrar como:
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setUserType("user")}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          userType === "user"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <User className={`w-8 h-8 mx-auto mb-3 ${userType === "user" ? "text-primary" : "text-muted-foreground"}`} />
                        <div className={`font-medium ${userType === "user" ? "text-primary" : "text-foreground"}`}>
                          Usuário
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Quero fazer pedidos
                        </p>
                      </button>
                      <button
                        onClick={() => setUserType("commerce")}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          userType === "commerce"
                            ? "border-secondary bg-secondary/5"
                            : "border-border hover:border-secondary/50"
                        }`}
                      >
                        <Store className={`w-8 h-8 mx-auto mb-3 ${userType === "commerce" ? "text-secondary" : "text-muted-foreground"}`} />
                        <div className={`font-medium ${userType === "commerce" ? "text-secondary" : "text-foreground"}`}>
                          Comércio
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Quero vender
                        </p>
                      </button>
                    </div>
                  </div>

                  <Button
                    variant={userType === "commerce" ? "success" : "hero"}
                    className="w-full"
                    size="lg"
                    onClick={() => setStep(2)}
                  >
                    Continuar
                  </Button>
                </motion.div>
              )}

              {/* Register Step 2 - User */}
              {mode === "register" && step === 2 && userType === "user" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setStep(1)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ← Voltar
                    </button>
                    <span className="text-sm text-muted-foreground">Dados pessoais</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Seu nome completo"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="seu@email.com"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="(11) 99999-9999"
                        className="h-11"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <div className="relative">
                          <Input
                            id="cep"
                            name="cep"
                            value={formData.cep}
                            onChange={handleInputChange}
                            placeholder="00000-000"
                            className="h-11"
                            maxLength={9}
                          />
                          {loadingCep && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="São Paulo"
                          className="h-11"
                          readOnly={loadingCep}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleInputChange}
                        placeholder="Centro"
                        className="h-11"
                        readOnly={loadingCep}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Rua, Avenida..."
                        className="h-11"
                        readOnly={loadingCep}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="number">Número</Label>
                        <Input
                          id="number"
                          name="number"
                          value={formData.number}
                          onChange={handleInputChange}
                          placeholder="123"
                          className="h-11"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                          id="complement"
                          name="complement"
                          value={formData.complement}
                          onChange={handleInputChange}
                          placeholder="Apto 12"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          className="h-11 pr-12"
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
                  </div>

                  <Button 
                    variant="hero" 
                    className="w-full" 
                    size="lg"
                    onClick={handleUserRegister}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
                  </Button>
                </motion.div>
              )}

              {/* Register Step 2 - Commerce */}
              {mode === "register" && step === 2 && userType === "commerce" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setStep(1)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ← Voltar
                    </button>
                    <span className="text-sm text-muted-foreground">Dados do comércio</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tradeName">Nome fantasia</Label>
                      <Input
                        id="tradeName"
                        name="tradeName"
                        value={formData.tradeName}
                        onChange={handleInputChange}
                        placeholder="Adega Premium"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Nome do proprietário</Label>
                      <Input
                        id="ownerName"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        placeholder="João Silva"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Tipo de documento</Label>
                      <RadioGroup
                        value={documentType}
                        onValueChange={(v) => setDocumentType(v as DocumentType)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cpf" id="doc-cpf" />
                          <Label htmlFor="doc-cpf" className="cursor-pointer">CPF</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cnpj" id="doc-cnpj" />
                          <Label htmlFor="doc-cnpj" className="cursor-pointer">CNPJ</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document">
                        {documentType === "cpf" ? "CPF" : "CNPJ"}
                      </Label>
                      <Input
                        id="document"
                        name="document"
                        value={formData.document}
                        onChange={handleInputChange}
                        placeholder={documentType === "cpf" ? "000.000.000-00" : "00.000.000/0001-00"}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commerce-email">Email</Label>
                      <Input
                        id="commerce-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contato@suaadega.com"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commerce-whatsapp">WhatsApp</Label>
                      <Input
                        id="commerce-whatsapp"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="(11) 99999-9999"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <Button variant="success" className="w-full" size="lg" onClick={() => setStep(3)}>
                    Continuar para endereço
                  </Button>
                </motion.div>
              )}

              {/* Register Step 3 - Commerce Address & Plan */}
              {mode === "register" && step === 3 && userType === "commerce" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setStep(2)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ← Voltar
                    </button>
                    <span className="text-sm text-muted-foreground">Endereço e Plano</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="commerce-cep">CEP</Label>
                        <div className="relative">
                          <Input
                            id="commerce-cep"
                            name="cep"
                            value={formData.cep}
                            onChange={handleInputChange}
                            placeholder="00000-000"
                            className="h-11"
                            maxLength={9}
                          />
                          {loadingCep && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commerce-city">Cidade</Label>
                        <Input
                          id="commerce-city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="São Paulo"
                          className="h-11"
                          readOnly={loadingCep}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commerce-neighborhood">Bairro</Label>
                      <Input
                        id="commerce-neighborhood"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleInputChange}
                        placeholder="Centro"
                        className="h-11"
                        readOnly={loadingCep}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commerce-address">Endereço</Label>
                      <Input
                        id="commerce-address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Rua, Avenida..."
                        className="h-11"
                        readOnly={loadingCep}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commerce-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="commerce-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          className="h-11 pr-12"
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

                    {/* Plans */}
                    <div className="space-y-3 pt-2">
                      <Label>Escolha seu plano</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {loadingPlans ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : plans.length > 0 ? (
                          plans.map((plan) => (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, plan: plan.type })}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                formData.plan === plan.type
                                  ? "border-secondary bg-secondary/5"
                                  : "border-border hover:border-secondary/50"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className={`font-semibold ${formData.plan === plan.type ? "text-secondary" : "text-foreground"}`}>
                                    {plan.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {plan.allowed_menu_items.length > 0 
                                      ? getFeatureLabels(plan.allowed_menu_items).slice(0, 4).join(" • ")
                                      : plan.description || ''}
                                    {getFeatureLabels(plan.allowed_menu_items).length > 4 && ' ...'}
                                  </div>
                                </div>
                                <div className={`font-bold ${formData.plan === plan.type ? "text-secondary" : "text-foreground"}`}>
                                  {formatCurrency(plan.price)}/mês
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          [
                            { type: "basic", name: "Básico", price: 90, features: ["PDV básico", "Até 50 produtos"] },
                            { type: "startup", name: "Startup", price: 180, features: ["PDV completo", "Delivery", "Aparecer na home"] },
                            { type: "business", name: "Business", price: 250, features: ["Tudo do Startup", "Relatórios avançados", "Prioridade no suporte"] },
                          ].map((plan) => (
                            <button
                              key={plan.type}
                              type="button"
                              onClick={() => setFormData({ ...formData, plan: plan.type })}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                formData.plan === plan.type
                                  ? "border-secondary bg-secondary/5"
                                  : "border-border hover:border-secondary/50"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className={`font-semibold ${formData.plan === plan.type ? "text-secondary" : "text-foreground"}`}>
                                    {plan.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {plan.features.join(" • ")}
                                  </div>
                                </div>
                                <div className={`font-bold ${formData.plan === plan.type ? "text-secondary" : "text-foreground"}`}>
                                  {formatCurrency(plan.price)}/mês
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Coupon Code Field */}
                    <div className="space-y-2">
                      <Label htmlFor="couponCode">Cupom de desconto (opcional)</Label>
                      <div className="relative">
                        <Input
                          id="couponCode"
                          name="couponCode"
                          value={formData.couponCode}
                          onChange={handleInputChange}
                          placeholder="CUPOM10"
                          className={`h-11 uppercase pr-12 ${
                            couponValid === true ? 'border-green-500 focus-visible:ring-green-500' : 
                            couponValid === false ? 'border-red-500 focus-visible:ring-red-500' : ''
                          }`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {validatingCoupon && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                          {!validatingCoupon && couponValid === true && <Check className="w-5 h-5 text-green-500" />}
                          {!validatingCoupon && couponValid === false && <AlertCircle className="w-5 h-5 text-red-500" />}
                        </div>
                      </div>
                      {couponValid === true && couponDiscount && (() => {
                        const selectedPlan = plans.find(p => p.type === formData.plan);
                        const originalPrice = selectedPlan?.price || 0;
                        const discountedPrice = couponDiscount.type === 'percentage'
                          ? originalPrice * (1 - couponDiscount.value / 100)
                          : Math.max(0, originalPrice - couponDiscount.value);
                        
                        return (
                          <div className="space-y-1">
                            <p className="text-xs text-green-600 font-medium">
                              ✓ Cupom válido! {couponDiscount.message 
                                ? couponDiscount.message 
                                : `Desconto de ${couponDiscount.type === 'percentage' 
                                  ? `${couponDiscount.value}%` 
                                  : formatCurrency(couponDiscount.value)}`}
                            </p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Valor original:</span>
                                <span className="text-sm text-muted-foreground line-through">{formatCurrency(originalPrice)}/mês</span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-sm font-semibold text-green-700">Você pagará:</span>
                                <span className="text-lg font-bold text-green-700">{formatCurrency(discountedPrice)}/mês</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      {couponValid === false && formData.couponCode.length >= 3 && (
                        <p className="text-xs text-red-500">
                          Cupom inválido ou expirado
                        </p>
                      )}
                      {couponValid === null && (
                        <p className="text-xs text-muted-foreground">
                          Se você possui um cupom de desconto, insira aqui
                        </p>
                      )}
                    </div>
                  </div>

                  <Button 
                    variant="success" 
                    className="w-full" 
                    size="lg"
                    onClick={handleCommerceRegister}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalizar cadastro"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Seu cadastro será analisado e você receberá um email de confirmação.
                  </p>
                </motion.div>
              )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;

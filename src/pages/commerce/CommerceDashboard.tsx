import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen,
  ShoppingCart, 
  Utensils,
  DollarSign,
  Calculator,
  Truck,
  MapPin,
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Store,
  Clock,
  AlertTriangle,
  Ban,
  Lock,
  Wallet,
  Bell,
  Camera,
  FileText,
  BookOpen,
  
  AlertTriangleIcon,
  ArrowUp,
  User,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoMobdega from "@/assets/logo-mobdega.png";
import { useStockAlerts } from "@/hooks/useStockAlerts";
import ManagementPasswordModal from "@/components/commerce/ManagementPasswordModal";

// Commerce sections
import CommerceOverview from "@/components/commerce/CommerceOverview";
import CommerceProducts from "@/components/commerce/CommerceProducts";
import CommerceCategories from "@/components/commerce/CommerceCategories";
import CommerceOrders from "@/components/commerce/CommerceOrders";
import CommerceTables from "@/components/commerce/CommerceTables";
import CommerceFinancial from "@/components/commerce/CommerceFinancial";
import CommerceCashRegister from "@/components/commerce/CommerceCashRegister";
import CommerceDelivery from "@/components/commerce/CommerceDelivery";
import CommerceSettings from "@/components/commerce/CommerceSettings";
import DeliveryZonesConfig from "@/components/commerce/DeliveryZonesConfig";
import CommercePaymentConfig from "@/components/commerce/CommercePaymentConfig";
import CommerceStockControl from "@/components/commerce/CommerceStockControl";
import CommerceCustomers from "@/components/commerce/CommerceCustomers";
import CommercePhotos from "@/components/commerce/CommercePhotos";
import CommerceContract from "@/components/commerce/CommerceContract";
import CommerceTraining from "@/components/commerce/CommerceTraining";

import CommerceCoupons from "@/components/commerce/CommerceCoupons";
import CommerceForum from "@/components/commerce/CommerceForum";
import UpgradeModal from "@/components/commerce/UpgradeModal";
import CommerceNotificationBell from "@/components/commerce/CommerceNotificationBell";

type CommerceSection = 
  | "overview" 
  | "products" 
  | "categories"
  | "stockcontrol"
  | "orders" 
  | "tables"
  | "photos"
  | "financial"
  | "coupons"
  | "customers"
  | "cashregister"
  | "delivery"
  | "deliveryzones"
  | "paymentconfig"
  | "contract"
  | "training"
  | "forum"
  | "settings";

// Ordem atualizada com Cupons entre Financeiro e Clientes
import { Ticket, MessageSquare } from "lucide-react";

const menuItems = [
  { id: "overview" as CommerceSection, label: "Visão Geral", icon: LayoutDashboard },
  { id: "cashregister" as CommerceSection, label: "Caixa/PDV", icon: Calculator, showBillRequestBadge: true },
  { id: "paymentconfig" as CommerceSection, label: "Configurar Pagamentos", icon: Wallet },
  { id: "orders" as CommerceSection, label: "Gestão Pedidos", icon: ShoppingCart, showPendingBadge: true },
  { id: "delivery" as CommerceSection, label: "Delivery", icon: Truck, showDeliveryBadge: true },
  { id: "deliveryzones" as CommerceSection, label: "Áreas de Entrega", icon: MapPin },
  { id: "tables" as CommerceSection, label: "Mesas/Comandas", icon: Utensils },
  { id: "photos" as CommerceSection, label: "Fotos", icon: Camera },
  { id: "products" as CommerceSection, label: "Produtos", icon: Package },
  { id: "categories" as CommerceSection, label: "Categorias", icon: FolderOpen },
  { id: "stockcontrol" as CommerceSection, label: "Controle Estoque", icon: Package },
  { id: "financial" as CommerceSection, label: "Financeiro", icon: DollarSign, showBadge: true },
  { id: "coupons" as CommerceSection, label: "Cupom para Clientes", icon: Ticket },
  { id: "customers" as CommerceSection, label: "Clientes", icon: Store },
  { id: "contract" as CommerceSection, label: "Contrato", icon: FileText },
  { id: "training" as CommerceSection, label: "Treinamento", icon: BookOpen },
  { id: "forum" as CommerceSection, label: "Fórum", icon: MessageSquare },
  { id: "settings" as CommerceSection, label: "Configurações", icon: Settings },
];

interface Commerce {
  id: string;
  fantasy_name: string;
  logo_url: string | null;
  email: string;
  status: string;
  plan_id: string | null;
  rejection_reason: string | null;
  coupon_code: string | null;
  force_password_change: boolean | null;
  employee_visible_menu_items: string[] | null;
  management_password: string | null;
}

interface PlanMenuConfig {
  allowed_menu_items: string[];
}

interface PlanInfo {
  type: string;
}

const CommerceDashboard = () => {
  const [activeSection, setActiveSection] = useState<CommerceSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [planConfig, setPlanConfig] = useState<PlanMenuConfig | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingDeliveryOrdersCount, setPendingDeliveryOrdersCount] = useState(0);
  const [billRequestsCount, setBillRequestsCount] = useState(0);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isEmployeeMode, setIsEmployeeMode] = useState(true); // Start in employee mode
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const isPending = commerce?.status === 'pending';
  const isRejected = commerce?.status === 'rejected';
  const isSuspended = commerce?.status === 'suspended';
  const isBlocked = isPending || isRejected || isSuspended;

  const fetchCommerce = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('commerces')
      .select('id, fantasy_name, logo_url, email, status, plan_id, rejection_reason, coupon_code, force_password_change, employee_visible_menu_items, management_password')
      .eq('owner_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching commerce:', error);
    } else if (data) {
      // If force_password_change is true, redirect to reset password
      if (data.force_password_change) {
        navigate('/reset-password');
        return;
      }
      
      setCommerce({
        id: data.id,
        fantasy_name: data.fantasy_name,
        logo_url: data.logo_url,
        email: data.email,
        status: data.status,
        plan_id: data.plan_id,
        rejection_reason: data.rejection_reason,
        coupon_code: data.coupon_code,
        force_password_change: data.force_password_change,
        employee_visible_menu_items: data.employee_visible_menu_items as string[] | null,
        management_password: data.management_password
      });
      
      // Fetch plan configuration if commerce has a plan
      if (data.plan_id) {
        const { data: planData } = await supabase
          .from('plans')
          .select('allowed_menu_items, type')
          .eq('id', data.plan_id)
          .single();
        
        if (planData) {
          setPlanConfig({
            allowed_menu_items: Array.isArray(planData.allowed_menu_items) 
              ? (planData.allowed_menu_items as string[])
              : ["overview", "settings"]
          });
          setPlanInfo({ type: planData.type });
        }
      }
    }
    setLoading(false);
  };

  const fetchPendingInvoices = async (commerceId: string) => {
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('commerce_id', commerceId)
      .eq('status', 'pending')
      .eq('payment_confirmed_by_commerce', false);
    
    setPendingInvoicesCount(count || 0);
  };

  const fetchPendingOrders = async (commerceId: string) => {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('commerce_id', commerceId)
      .eq('status', 'pending');
    
    setPendingOrdersCount(count || 0);
  };

  const fetchPendingDeliveryOrders = async (commerceId: string) => {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('commerce_id', commerceId)
      .eq('order_type', 'delivery')
      .in('status', ['pending', 'confirmed', 'preparing']);
    
    setPendingDeliveryOrdersCount(count || 0);
  };

  const fetchBillRequests = async (commerceId: string) => {
    // Fetch sessions from orders with pending payment (payment_method = 'pending')
    // This ensures we see bill requests even after table is released
    const { data: ordersData } = await supabase
      .from('orders')
      .select('session_id')
      .eq('commerce_id', commerceId)
      .eq('order_type', 'table')
      .eq('payment_method', 'pending')
      .not('session_id', 'is', null);

    if (!ordersData || ordersData.length === 0) {
      setBillRequestsCount(0);
      return;
    }

    const sessionIds = [...new Set(ordersData.map(o => o.session_id).filter(Boolean) as string[])];
    
    if (sessionIds.length === 0) {
      setBillRequestsCount(0);
      return;
    }

    const { count } = await supabase
      .from('table_participants')
      .select('*', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .eq('bill_requested', true);
    
    setBillRequestsCount(count || 0);
  };

  useEffect(() => {
    fetchCommerce();
  }, [user]);

  // Auto-navigate to training when pending approval
  useEffect(() => {
    if (isPending && activeSection === "overview") {
      setActiveSection("training");
    }
  }, [isPending]);

  // Keep plan/menu in sync after upgrades (plan_id changes)
  useEffect(() => {
    if (!commerce?.id) return;

    const channel = supabase
      .channel(`commerce-plan-sync-${commerce.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'commerces', filter: `id=eq.${commerce.id}` },
        () => fetchCommerce()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commerce?.id]);

  useEffect(() => {
    if (commerce?.id) {
      fetchPendingInvoices(commerce.id);
      fetchPendingOrders(commerce.id);
      fetchPendingDeliveryOrders(commerce.id);
      fetchBillRequests(commerce.id);

      // Subscribe to invoice changes for this commerce
      const invoicesChannel = supabase
        .channel('commerce-invoices-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'invoices', filter: `commerce_id=eq.${commerce.id}` },
          () => fetchPendingInvoices(commerce.id)
        )
        .subscribe();

      // Subscribe to order changes for this commerce
      const ordersChannel = supabase
        .channel('commerce-orders-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `commerce_id=eq.${commerce.id}` },
          () => {
            fetchPendingOrders(commerce.id);
            fetchPendingDeliveryOrders(commerce.id);
            fetchBillRequests(commerce.id); // Also refresh bill requests when orders change
          }
        )
        .subscribe();

      // Subscribe to bill request changes
      const billRequestsChannel = supabase
        .channel('commerce-bill-requests')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'table_participants' },
          () => fetchBillRequests(commerce.id)
        )
        .subscribe();

      return () => {
        supabase.removeChannel(invoicesChannel);
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(billRequestsChannel);
      };
    }
  }, [commerce?.id]);

  // Refetch commerce data when settings are changed
  useEffect(() => {
    if (activeSection === "overview") {
      fetchCommerce();
    }
  }, [activeSection]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleMenuClick = (sectionId: CommerceSection, isDisabled: boolean, isLocked: boolean) => {
    if (isLocked) {
      // Open upgrade modal for locked items
      setUpgradeModalOpen(true);
      return;
    }
    if (!isDisabled) {
      setActiveSection(sectionId);
      setSidebarOpen(false); // Close sidebar on mobile after selection
    }
  };

  // Check if a menu item is locked by plan
  const isMenuItemLocked = (itemId: string) => {
    if (!planConfig) return false;
    // Items that are always available
    const alwaysAvailable = ["overview", "settings", "contract", "training", "forum"];
    if (alwaysAvailable.includes(itemId)) return false;
    return !planConfig.allowed_menu_items.includes(itemId);
  };

  // Check if menu item is hidden by employee mode
  const isMenuItemHiddenByEmployeeMode = (itemId: string) => {
    // Training is always visible when pending approval
    if (isPending && itemId === "training") return false;
    if (!isEmployeeMode) return false; // Management mode shows all
    if (!commerce?.employee_visible_menu_items) return false; // No config = show all
    return !commerce.employee_visible_menu_items.includes(itemId);
  };

  // Handle toggle between employee and management modes
  const handleModeToggle = (checked: boolean) => {
    if (!checked) {
      // Switching to employee mode - no password needed
      setIsEmployeeMode(true);
    } else {
      // Switching to management mode - check if password is set
      if (commerce?.management_password) {
        setShowPasswordModal(true);
      } else {
        // No password set, allow direct access
        setIsEmployeeMode(false);
      }
    }
  };

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setIsEmployeeMode(false);
  };

  // Get menu items filtered by employee mode
  const getVisibleMenuItems = () => {
    if (!isEmployeeMode) return menuItems;
    return menuItems.filter(item => !isMenuItemHiddenByEmployeeMode(item.id));
  };

  const visibleMenuItems = getVisibleMenuItems();

  const getBlockedStatusInfo = () => {
    if (isPending) {
      return {
        icon: Clock,
        title: "Aguardando Aprovação",
        description: "Seu comércio está em análise. Assim que for aprovado, você terá acesso a todas as funcionalidades.",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30"
      };
    }
    if (isRejected) {
      return {
        icon: Ban,
        title: "Cadastro Rejeitado",
        description: commerce?.rejection_reason || "Seu cadastro foi rejeitado. Entre em contato para mais informações.",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30"
      };
    }
    if (isSuspended) {
      return {
        icon: AlertTriangle,
        title: "Conta Suspensa",
        description: "Sua conta foi suspensa temporariamente. Entre em contato para mais informações.",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30"
      };
    }
    return null;
  };

  const renderContent = () => {
    if (!commerce) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <Store className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl md:text-2xl font-bold mb-2">Nenhum comércio encontrado</h2>
          <p className="text-muted-foreground mb-4 text-sm md:text-base">
            Você ainda não possui um comércio cadastrado.
          </p>
          <Button onClick={() => navigate("/")}>
            Cadastrar Comércio
          </Button>
        </div>
      );
    }

    // Show blocked status screen when commerce is not approved (except for training section)
    if (isBlocked && activeSection !== "training") {
      const statusInfo = getBlockedStatusInfo();
      if (!statusInfo) return null;
      
      const StatusIcon = statusInfo.icon;
      
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <Card className={`max-w-lg w-full ${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
            <CardContent className="p-6 md:p-8">
              <StatusIcon className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 ${statusInfo.color}`} />
              <h2 className={`text-xl md:text-2xl font-bold mb-2 ${statusInfo.color}`}>
                {statusInfo.title}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                {statusInfo.description}
              </p>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <span>Todas as funcionalidades estão temporariamente bloqueadas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Allow training section when pending
    if (isBlocked && activeSection === "training") {
      return <CommerceTraining isPendingApproval={isPending} />;
    }

    // Use stock alerts hook when commerce is active
    if (commerce && !isBlocked) {
      // Note: hook is called at component level, this just documents usage
    }

    switch (activeSection) {
      case "overview":
        return <CommerceOverview commerce={commerce} />;
      case "products":
        return <CommerceProducts commerceId={commerce.id} />;
      case "categories":
        return <CommerceCategories commerceId={commerce.id} />;
      case "stockcontrol":
        return <CommerceStockControl commerceId={commerce.id} />;
      case "orders":
        return <CommerceOrders commerceId={commerce.id} />;
      case "tables":
        return <CommerceTables commerceId={commerce.id} />;
      case "photos":
        return <CommercePhotos commerceId={commerce.id} />;
      case "financial":
        return <CommerceFinancial commerceId={commerce.id} />;
      case "coupons":
        return <CommerceCoupons commerceId={commerce.id} />;
      case "customers":
        return <CommerceCustomers commerceId={commerce.id} />;
      case "cashregister":
        return <CommerceCashRegister commerceId={commerce.id} />;
      case "delivery":
        return <CommerceDelivery commerceId={commerce.id} />;
      case "deliveryzones":
        return <DeliveryZonesConfig commerceId={commerce.id} />;
      case "paymentconfig":
        return <CommercePaymentConfig commerceId={commerce.id} />;
      case "contract":
        return <CommerceContract commerceId={commerce.id} />;
      case "training":
        return <CommerceTraining />;
      case "forum":
        return <CommerceForum commerceId={commerce.id} commerceName={commerce.fantasy_name} commerceLogo={commerce.logo_url} />;
      case "settings":
        return <CommerceSettings commerce={commerce} />;
      default:
        return <CommerceOverview commerce={commerce} />;
    }
  };

  // Use stock alerts for the commerce
  useStockAlerts(commerce?.id || "");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden gradient-dark border-b border-border p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img 
            src={commerce?.logo_url || logoMobdega} 
            alt={commerce?.fantasy_name || "Mobdega"} 
            className="h-10 w-10 rounded-lg object-cover border border-border/50" 
          />
          <div className="min-w-0">
            <h1 className="font-display text-sm font-bold text-primary-foreground truncate max-w-[150px]">
              {commerce?.fantasy_name || "Meu Comércio"}
            </h1>
            <p className="text-[10px] text-primary-foreground/60">Painel</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {commerce && !isBlocked && (
            <CommerceNotificationBell 
              commerceId={commerce.id} 
              onNavigateToInvoices={() => setActiveSection("financial")}
              onNavigateToSection={(section) => setActiveSection(section as CommerceSection)}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Drawer on mobile, fixed on desktop */}
      <AnimatePresence mode="wait">
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : -280) }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`
            fixed md:sticky top-0 left-0 z-50 md:z-auto
            w-[280px] h-screen
            gradient-dark border-r border-border flex flex-col
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{ 
            transform: typeof window !== 'undefined' && window.innerWidth >= 768 
              ? 'translateX(0)' 
              : sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
          }}
        >
          {/* Logo - Desktop only */}
          <div className="p-4 border-b border-border/50 hidden md:flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <img 
                src={commerce?.logo_url || logoMobdega} 
                alt={commerce?.fantasy_name || "Mobdega"} 
                className="h-12 w-12 rounded-lg object-cover border border-border/50" 
              />
              <div className="min-w-0">
                <h1 className="font-display text-base font-bold text-primary-foreground truncate">
                  {commerce?.fantasy_name || "Meu Comércio"}
                </h1>
                <p className="text-[10px] text-primary-foreground/60">Painel</p>
              </div>
            </motion.div>
            <div className="flex items-center gap-1">
              {commerce && !isBlocked && (
                <CommerceNotificationBell 
                  commerceId={commerce.id} 
                  onNavigateToInvoices={() => setActiveSection("financial")}
                  onNavigateToSection={(section) => setActiveSection(section as CommerceSection)}
                />
              )}
              {/* Botão Upgrade - só aparece para planos basic e startup */}
              {planInfo && planInfo.type !== 'business' && !isBlocked && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setUpgradeModalOpen(true)}
                  className="gap-0.5 text-[10px] px-2 py-1 h-6 text-primary/70 hover:text-primary hover:bg-primary/10"
                >
                  <ArrowUp className="w-2.5 h-2.5" />
                  Up
                </Button>
              )}
            </div>
          </div>

          {/* Mobile close button */}
          <div className="p-4 border-b border-border/50 flex md:hidden items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={commerce?.logo_url || logoMobdega} 
                alt={commerce?.fantasy_name || "Mobdega"} 
                className="h-10 w-10 rounded-lg object-cover border border-border/50" 
              />
              <div className="min-w-0">
                <h1 className="font-display text-sm font-bold text-primary-foreground truncate">
                  {commerce?.fantasy_name || "Meu Comércio"}
                </h1>
                <p className="text-[10px] text-primary-foreground/60">Painel</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Suporte Button - always visible */}
          <div className="px-3 pt-3">
            <button
              onClick={() => window.open('https://wa.me/5511949830010?text=Olá! Preciso de suporte com meu comércio na Mobdega.', '_blank')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-green-400 hover:bg-green-500/10 border border-green-500/30 hover:border-green-500/50"
            >
              <MessageCircle className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-left font-medium text-sm">Suporte</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              // Training is accessible even when blocked (pending approval)
              const isDisabled = isBlocked && item.id !== "overview" && item.id !== "training";
              const isLocked = !isBlocked && isMenuItemLocked(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id, isDisabled, isLocked)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isLocked
                      ? "opacity-40 cursor-pointer text-primary-foreground/40 hover:opacity-50"
                      : isDisabled
                        ? "opacity-40 cursor-not-allowed text-primary-foreground/40"
                        : isActive
                          ? "gradient-primary text-primary-foreground shadow-glow-primary"
                          : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isLocked ? 'opacity-50' : ''}`} />
                  <span className={`flex-1 text-left font-medium text-sm ${isLocked ? 'opacity-60' : ''}`}>{item.label}</span>
                  {(isDisabled || isLocked) && <Lock className="w-4 h-4 text-primary-foreground/40" />}
                  {!isDisabled && !isLocked && (item as any).showBillRequestBadge && billRequestsCount > 0 && (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [0.8, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Badge variant="destructive" className="text-xs px-2 py-0.5 flex items-center gap-1 animate-pulse">
                        <AlertTriangleIcon className="w-3 h-3" />
                        {billRequestsCount}
                      </Badge>
                    </motion.div>
                  )}
                  {!isDisabled && !isLocked && item.showPendingBadge && pendingOrdersCount > 0 && (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">
                      {pendingOrdersCount}
                    </Badge>
                  )}
                  {!isDisabled && !isLocked && (item as any).showDeliveryBadge && pendingDeliveryOrdersCount > 0 && (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">
                      {pendingDeliveryOrdersCount}
                    </Badge>
                  )}
                  {!isDisabled && !isLocked && item.showBadge && pendingInvoicesCount > 0 && (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">
                      {pendingInvoicesCount}
                    </Badge>
                  )}
                  {!isDisabled && !isLocked && isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}
          </nav>

          {/* Employee/Management Toggle */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                {isEmployeeMode ? (
                  <User className="w-4 h-4 text-primary-foreground/70" />
                ) : (
                  <Shield className="w-4 h-4 text-primary" />
                )}
                <span className="text-xs font-medium text-primary-foreground/80">
                  {isEmployeeMode ? "Funcionário" : "Gestão"}
                </span>
              </div>
              <Switch
                checked={!isEmployeeMode}
                onCheckedChange={handleModeToggle}
                className="scale-75"
              />
            </div>
          </div>

          {/* Logout */}
          <div className="px-4 pb-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-destructive/80 hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Sair</span>
            </Button>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-4 md:p-6 lg:p-8">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </main>

      {/* Upgrade Modal */}
      {commerce && (
        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          commerceId={commerce.id}
          currentPlanId={commerce.plan_id}
          couponCode={commerce.coupon_code}
        />
      )}

      {/* Management Password Modal */}
      <ManagementPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        correctPassword={commerce?.management_password || ""}
        commerceEmail={commerce?.email}
      />
    </div>
  );
};

export default CommerceDashboard;

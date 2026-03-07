import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  FileText, 
  Settings, 
  Palette, 
  TrendingUp,
  DollarSign,
  CreditCard,
  Receipt,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Crown,
  BookOpen,
  
  Database,
  MessageSquare,
  History as HistoryIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoMobdega from "@/assets/logo-mobdega.png";
import AdminNotificationBell from "@/components/admin/AdminNotificationBell";

// Admin sections
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCommerces from "@/components/admin/AdminCommerces";
import AdminFinancial from "@/components/admin/AdminFinancial";
import AdminInvoices from "@/components/admin/AdminInvoices";
import AdminCustomization from "@/components/admin/AdminCustomization";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminBillingConfig from "@/components/admin/AdminBillingConfig";
import AdminPlans from "@/components/admin/AdminPlans";
import AdminCustomers from "@/components/admin/AdminCustomers";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminTraining from "@/components/admin/AdminTraining";

import AdminDatabase from "@/components/admin/AdminDatabase";
import AdminForum from "@/components/admin/AdminForum";
import AdminSystemUpdates from "@/components/admin/AdminSystemUpdates";

type AdminSection = 
  | "overview" 
  | "users" 
  | "commerces" 
  | "customers"
  | "financial" 
  | "invoices" 
  | "billing-config"
  | "plans"
  | "coupons"
  | "customization" 
  | "training"
  | "database"
  | "forum"
  | "system-updates"
  | "settings";

const menuItems = [
  { id: "overview" as AdminSection, label: "Visão Geral", icon: LayoutDashboard },
  { id: "financial" as AdminSection, label: "Financeiro", icon: DollarSign },
  { id: "invoices" as AdminSection, label: "Faturas", icon: Receipt, badgeKey: 'invoices' as const },
  { id: "billing-config" as AdminSection, label: "Configurar Cobrança", icon: CreditCard },
  { id: "users" as AdminSection, label: "Usuários", icon: Users },
  { id: "commerces" as AdminSection, label: "Adegas/Tabacarias", icon: Store, badgeKey: 'commerces' as const },
  { id: "customers" as AdminSection, label: "Gestão de Clientes", icon: Users },
  { id: "plans" as AdminSection, label: "Planos", icon: Crown },
  { id: "coupons" as AdminSection, label: "Cupons", icon: Receipt },
  { id: "training" as AdminSection, label: "Treinamento", icon: BookOpen },
  { id: "database" as AdminSection, label: "Banco de Dados", icon: Database },
  { id: "forum" as AdminSection, label: "Fórum", icon: MessageSquare },
  { id: "system-updates" as AdminSection, label: "Atualizações", icon: HistoryIcon },
  { id: "customization" as AdminSection, label: "Personalização", icon: Palette },
  { id: "settings" as AdminSection, label: "Configurações", icon: Settings },
];

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingPaymentConfirmations, setPendingPaymentConfirmations] = useState(0);
  const [pendingUpgradeRequests, setPendingUpgradeRequests] = useState(0);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingConfirmations();
    fetchPendingUpgrades();

    // Subscribe to invoice changes
    const invoiceChannel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => fetchPendingConfirmations()
      )
      .subscribe();

    // Subscribe to commerce changes for upgrade requests
    const commerceChannel = supabase
      .channel('commerces-upgrades')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'commerces' },
        () => fetchPendingUpgrades()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invoiceChannel);
      supabase.removeChannel(commerceChannel);
    };
  }, []);

  const fetchPendingConfirmations = async () => {
    // Count invoices where commerce has confirmed payment (awaiting admin validation)
    const { count: confirmedCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('payment_confirmed_by_commerce', true)
      .eq('status', 'pending');
    
    setPendingPaymentConfirmations(confirmedCount || 0);
  };

  const fetchPendingUpgrades = async () => {
    // Count commerces with pending upgrade requests
    const { count: upgradeCount } = await supabase
      .from('commerces')
      .select('*', { count: 'exact', head: true })
      .eq('upgrade_request_status', 'pending');
    
    setPendingUpgradeRequests(upgradeCount || 0);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleMenuClick = (sectionId: AdminSection) => {
    setActiveSection(sectionId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <AdminOverview />;
      case "users":
        return <AdminUsers />;
      case "commerces":
        return <AdminCommerces />;
      case "customers":
        return <AdminCustomers />;
      case "financial":
        return <AdminFinancial />;
      case "invoices":
        return <AdminInvoices />;
      case "billing-config":
        return <AdminBillingConfig />;
      case "plans":
        return <AdminPlans />;
      case "coupons":
        return <AdminCoupons />;
      case "training":
        return <AdminTraining />;
      case "database":
        return <AdminDatabase />;
      case "forum":
        return <AdminForum />;
      case "system-updates":
        return <AdminSystemUpdates />;
      case "customization":
        return <AdminCustomization />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden gradient-dark border-b border-border p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={logoMobdega} alt="Mobdega" className="h-8" />
          <div>
            <h1 className="font-display text-sm font-bold text-primary-foreground">
              Admin
            </h1>
            <p className="text-[10px] text-primary-foreground/60">Master Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminNotificationBell />
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
      <motion.aside
        initial={false}
        animate={{ 
          x: typeof window !== 'undefined' && window.innerWidth < 768 
            ? (sidebarOpen ? 0 : -280) 
            : 0 
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-auto
          w-[280px] h-screen
          gradient-dark border-r border-border flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo - Desktop only */}
        <div className="p-4 border-b border-border/50 hidden md:flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <img src={logoMobdega} alt="Mobdega" className="h-10" />
            <div>
              <h1 className="font-display text-lg font-bold text-primary-foreground">
                Admin
              </h1>
              <p className="text-xs text-primary-foreground/60">Master Panel</p>
            </div>
          </motion.div>
          <AdminNotificationBell />
        </div>

        {/* Mobile close button */}
        <div className="p-4 border-b border-border/50 flex md:hidden items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoMobdega} alt="Mobdega" className="h-8" />
            <div>
              <h1 className="font-display text-sm font-bold text-primary-foreground">
                Admin
              </h1>
              <p className="text-[10px] text-primary-foreground/60">Master Panel</p>
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

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? "gradient-primary text-primary-foreground shadow-glow-primary"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
                {item.badgeKey === 'invoices' && pendingPaymentConfirmations > 0 && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    {pendingPaymentConfirmations}
                  </Badge>
                )}
                {item.badgeKey === 'commerces' && pendingUpgradeRequests > 0 && (
                  <Badge className="text-xs px-2 py-0.5 bg-purple-500 text-white">
                    {pendingUpgradeRequests}
                  </Badge>
                )}
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Sair</span>
          </Button>
        </div>
      </motion.aside>

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
    </div>
  );
};

export default AdminDashboard;

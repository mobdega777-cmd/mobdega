import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoMobdega from "@/assets/logo-mobdega.png";

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

type AdminSection = 
  | "overview" 
  | "users" 
  | "commerces" 
  | "customers"
  | "financial" 
  | "invoices" 
  | "billing-config"
  | "plans"
  | "customization" 
  | "settings";

const menuItems = [
  { id: "overview" as AdminSection, label: "Visão Geral", icon: LayoutDashboard },
  { id: "financial" as AdminSection, label: "Financeiro", icon: DollarSign },
  { id: "invoices" as AdminSection, label: "Faturas", icon: Receipt, showBadge: true },
  { id: "billing-config" as AdminSection, label: "Configurar Cobrança", icon: CreditCard },
  { id: "users" as AdminSection, label: "Usuários", icon: Users },
  { id: "commerces" as AdminSection, label: "Adegas/Tabacarias", icon: Store },
  { id: "customers" as AdminSection, label: "Gestão de Clientes", icon: Users },
  { id: "plans" as AdminSection, label: "Planos", icon: Crown },
  { id: "customization" as AdminSection, label: "Personalização", icon: Palette },
  { id: "settings" as AdminSection, label: "Configurações", icon: Settings },
];

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingPaymentConfirmations, setPendingPaymentConfirmations] = useState(0);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingConfirmations();

    // Subscribe to invoice changes
    const channel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => fetchPendingConfirmations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

  const handleLogout = async () => {
    await signOut();
    navigate("/");
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
      case "customization":
        return <AdminCustomization />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="gradient-dark border-r border-border flex flex-col h-screen sticky top-0"
      >
        {/* Logo */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          {sidebarOpen && (
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
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? "gradient-primary text-primary-foreground shadow-glow-primary"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                }`}
              >
                <Icon className={`w-5 h-5 ${!sidebarOpen && 'mx-auto'}`} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.showBadge && pendingPaymentConfirmations > 0 && (
                      <Badge variant="destructive" className="text-xs px-2 py-0.5">
                        {pendingPaymentConfirmations}
                      </Badge>
                    )}
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${
              sidebarOpen ? "justify-start" : "justify-center"
            }`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Sair</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
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

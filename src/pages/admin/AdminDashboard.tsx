import { useState } from "react";
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
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import logoMobdega from "@/assets/logo-mobdega.png";

// Admin sections
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCommerces from "@/components/admin/AdminCommerces";
import AdminFinancial from "@/components/admin/AdminFinancial";
import AdminInvoices from "@/components/admin/AdminInvoices";
import AdminCustomization from "@/components/admin/AdminCustomization";
import AdminSettings from "@/components/admin/AdminSettings";

type AdminSection = 
  | "overview" 
  | "users" 
  | "commerces" 
  | "financial" 
  | "invoices" 
  | "customization" 
  | "settings";

const menuItems = [
  { id: "overview" as AdminSection, label: "Visão Geral", icon: LayoutDashboard },
  { id: "financial" as AdminSection, label: "Financeiro", icon: DollarSign },
  { id: "invoices" as AdminSection, label: "Faturas", icon: Receipt },
  { id: "users" as AdminSection, label: "Usuários", icon: Users },
  { id: "commerces" as AdminSection, label: "Adegas/Tabacarias", icon: Store },
  { id: "customization" as AdminSection, label: "Personalização", icon: Palette },
  { id: "settings" as AdminSection, label: "Configurações", icon: Settings },
];

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut } = useAuth();
  const navigate = useNavigate();

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
      case "financial":
        return <AdminFinancial />;
      case "invoices":
        return <AdminInvoices />;
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

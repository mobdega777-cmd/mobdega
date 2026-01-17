import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoMobdega from "@/assets/logo-mobdega.png";

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

type CommerceSection = 
  | "overview" 
  | "products" 
  | "categories"
  | "orders" 
  | "tables"
  | "financial" 
  | "cashregister"
  | "delivery"
  | "deliveryzones"
  | "settings";

// Ordem atualizada: Caixa/PDV agora é a segunda opção (logo após Visão Geral)
const menuItems = [
  { id: "overview" as CommerceSection, label: "Visão Geral", icon: LayoutDashboard },
  { id: "cashregister" as CommerceSection, label: "Caixa/PDV", icon: Calculator },
  { id: "orders" as CommerceSection, label: "Pedidos", icon: ShoppingCart },
  { id: "delivery" as CommerceSection, label: "Delivery", icon: Truck },
  { id: "deliveryzones" as CommerceSection, label: "Áreas de Entrega", icon: MapPin },
  { id: "tables" as CommerceSection, label: "Mesas/Comandas", icon: Utensils },
  { id: "products" as CommerceSection, label: "Produtos", icon: Package },
  { id: "categories" as CommerceSection, label: "Categorias", icon: FolderOpen },
  { id: "financial" as CommerceSection, label: "Financeiro", icon: DollarSign, showBadge: true },
  { id: "settings" as CommerceSection, label: "Configurações", icon: Settings },
];

interface Commerce {
  id: string;
  fantasy_name: string;
  logo_url: string | null;
  status: string;
}

const CommerceDashboard = () => {
  const [activeSection, setActiveSection] = useState<CommerceSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const fetchCommerce = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('commerces')
      .select('id, fantasy_name, logo_url, status')
      .eq('owner_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching commerce:', error);
    } else {
      setCommerce(data);
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

  useEffect(() => {
    fetchCommerce();
  }, [user]);

  useEffect(() => {
    if (commerce?.id) {
      fetchPendingInvoices(commerce.id);

      // Subscribe to invoice changes for this commerce
      const channel = supabase
        .channel('commerce-invoices-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'invoices', filter: `commerce_id=eq.${commerce.id}` },
          () => fetchPendingInvoices(commerce.id)
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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

  const renderContent = () => {
    if (!commerce) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Store className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Nenhum comércio encontrado</h2>
          <p className="text-muted-foreground mb-4">
            Você ainda não possui um comércio cadastrado.
          </p>
          <Button onClick={() => navigate("/")}>
            Cadastrar Comércio
          </Button>
        </div>
      );
    }

    switch (activeSection) {
      case "overview":
        return <CommerceOverview commerce={commerce} />;
      case "products":
        return <CommerceProducts commerceId={commerce.id} />;
      case "categories":
        return <CommerceCategories commerceId={commerce.id} />;
      case "orders":
        return <CommerceOrders commerceId={commerce.id} />;
      case "tables":
        return <CommerceTables commerceId={commerce.id} />;
      case "financial":
        return <CommerceFinancial commerceId={commerce.id} />;
      case "cashregister":
        return <CommerceCashRegister commerceId={commerce.id} />;
      case "delivery":
        return <CommerceDelivery commerceId={commerce.id} />;
      case "deliveryzones":
        return <DeliveryZonesConfig commerceId={commerce.id} />;
      case "settings":
        return <CommerceSettings commerce={commerce} />;
      default:
        return <CommerceOverview commerce={commerce} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                    {item.showBadge && pendingInvoicesCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-2 py-0.5">
                        {pendingInvoicesCount}
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

export default CommerceDashboard;
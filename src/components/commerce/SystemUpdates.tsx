import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Plus, 
  Pencil, 
  Settings, 
  ShoppingCart, 
  Package,
  Users,
  CreditCard,
  Tag,
  Truck,
  FileText,
  ChefHat,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SystemUpdate {
  id: string;
  type: string;
  module: string;
  description: string;
  published_at: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'create': return <Plus className="w-3 h-3" />;
    case 'update': return <Pencil className="w-3 h-3" />;
    case 'config': return <Settings className="w-3 h-3" />;
    default: return <History className="w-3 h-3" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'create': return 'bg-green-500/20 text-green-500';
    case 'update': return 'bg-blue-500/20 text-blue-500';
    case 'config': return 'bg-purple-500/20 text-purple-500';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getModuleIcon = (module: string) => {
  switch (module.toLowerCase()) {
    case 'pedidos': return <ShoppingCart className="w-4 h-4" />;
    case 'produtos': 
    case 'estoque': return <Package className="w-4 h-4" />;
    case 'clientes': return <Users className="w-4 h-4" />;
    case 'pagamentos': 
    case 'financeiro': return <CreditCard className="w-4 h-4" />;
    case 'cupons': return <Tag className="w-4 h-4" />;
    case 'delivery': return <Truck className="w-4 h-4" />;
    case 'fórum': return <FileText className="w-4 h-4" />;
    case 'mesas/comandas':
    case 'caixa/pdv': return <ChefHat className="w-4 h-4" />;
    default: return <Settings className="w-4 h-4" />;
  }
};

const SystemUpdates = () => {
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      const { data } = await supabase
        .from('system_updates')
        .select('id, type, module, description, published_at')
        .order('published_at', { ascending: false })
        .limit(15);
      
      setUpdates((data as SystemUpdate[]) || []);
      setLoading(false);
    };

    fetchUpdates();
  }, []);

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-2">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <History className="w-4 h-4 md:w-5 md:h-5" />
          Atualizações do Sistema
        </CardTitle>
        <p className="text-xs text-muted-foreground">Últimas {updates.length} modificações técnicas</p>
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : updates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atualização registrada.</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
            {updates.map((update) => (
              <div 
                key={update.id} 
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getModuleIcon(update.module)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getTypeColor(update.type)} border-none gap-1`}
                    >
                      {getTypeIcon(update.type)}
                      {update.type === 'create' ? 'Novo' : update.type === 'update' ? 'Atualização' : 'Config'}
                    </Badge>
                    <span className="text-xs font-medium text-foreground">{update.module}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {update.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {format(new Date(update.published_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemUpdates;

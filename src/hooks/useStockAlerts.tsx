import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  stock: number | null;
}

export const useStockAlerts = (commerceId: string) => {
  const { toast } = useToast();
  const alertedProducts = useRef<Set<string>>(new Set());

  const checkStockLevels = async () => {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('commerce_id', commerceId)
      .eq('is_active', true);

    if (!products) return;

    products.forEach((product: Product) => {
      const stock = product.stock ?? 0;
      const alertKey5 = `${product.id}-5`;
      const alertKey10 = `${product.id}-10`;

      // Alert at 5 units - critical
      if (stock <= 5 && stock > 0 && !alertedProducts.current.has(alertKey5)) {
        toast({
          variant: "destructive",
          title: "⚠️ Estoque Crítico!",
          description: `${product.name} está com apenas ${stock} unidade(s) em estoque!`,
        });
        alertedProducts.current.add(alertKey5);
      }
      // Alert at 10 units - warning
      else if (stock <= 10 && stock > 5 && !alertedProducts.current.has(alertKey10)) {
        toast({
          title: "🔔 Estoque Baixo",
          description: `${product.name} está com ${stock} unidades em estoque. Considere reabastecer.`,
        });
        alertedProducts.current.add(alertKey10);
      }

      // Reset alerts if stock is replenished
      if (stock > 10) {
        alertedProducts.current.delete(alertKey5);
        alertedProducts.current.delete(alertKey10);
      } else if (stock > 5) {
        alertedProducts.current.delete(alertKey5);
      }
    });
  };

  useEffect(() => {
    if (!commerceId) return;

    // Check on mount
    checkStockLevels();

    // Subscribe to product changes
    const channel = supabase
      .channel(`stock-alerts-${commerceId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'products',
          filter: `commerce_id=eq.${commerceId}` 
        },
        () => {
          checkStockLevels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commerceId]);

  return { checkStockLevels };
};

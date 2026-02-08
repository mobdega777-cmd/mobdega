import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Search, 
  Users, 
  User, 
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingBag,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatCurrency";

interface AddToTabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commerceId: string;
  onSuccess?: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price: number | null;
  stock: number | null;
  category?: { name: string } | null;
}

interface TableParticipant {
  id: string;
  user_id: string;
  customer_name: string | null;
  is_host: boolean;
  session_id: string;
}

interface TableSession {
  id: string;
  table_id: string;
  table_number: number;
  table_name: string | null;
  bill_mode: 'single' | 'split';
  participants: TableParticipant[];
}

const AddToTabModal = ({ open, onOpenChange, commerceId, onSuccess }: AddToTabModalProps) => {
  const [activeSessions, setActiveSessions] = useState<TableSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, commerceId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch active table sessions
    const { data: sessionsData } = await supabase
      .from('table_sessions')
      .select(`
        id,
        table_id,
        bill_mode,
        tables (
          number,
          name
        )
      `)
      .eq('commerce_id', commerceId)
      .eq('status', 'active');

    if (sessionsData && sessionsData.length > 0) {
      const sessionIds = sessionsData.map(s => s.id);
      
      // Fetch participants for these sessions
      const { data: participantsData } = await supabase
        .from('table_participants')
        .select('id, session_id, user_id, customer_name, is_host')
        .in('session_id', sessionIds);

      // Fetch profiles for participant names
      const userIds = [...new Set(participantsData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.full_name]) || []);

      const sessions: TableSession[] = sessionsData.map(session => ({
        id: session.id,
        table_id: session.table_id,
        table_number: (session.tables as any)?.number || 0,
        table_name: (session.tables as any)?.name || null,
        bill_mode: session.bill_mode as 'single' | 'split',
        participants: (participantsData || [])
          .filter(p => p.session_id === session.id)
          .map(p => ({
            ...p,
            customer_name: p.customer_name || profilesMap.get(p.user_id) || 'Cliente'
          }))
      }));

      setActiveSessions(sessions);
    } else {
      setActiveSessions([]);
    }

    // Fetch products
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price, promotional_price, stock, category:categories(name)')
      .eq('commerce_id', commerceId)
      .eq('is_active', true)
      .order('name');

    setProducts(productsData || []);
    setLoading(false);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
  };

  const handleAddToTab = async () => {
    if (!selectedProduct || !selectedSession || !user) return;

    const session = activeSessions.find(s => s.id === selectedSession);
    if (!session) return;

    // Determine user_id for the order
    let targetUserId: string;
    if (session.bill_mode === 'split' && selectedParticipant) {
      const participant = session.participants.find(p => p.id === selectedParticipant);
      targetUserId = participant?.user_id || user.id;
    } else {
      // Single bill - use the host's user_id
      const host = session.participants.find(p => p.is_host);
      targetUserId = host?.user_id || session.participants[0]?.user_id || user.id;
    }

    setSubmitting(true);

    try {
      const salePrice = selectedProduct.promotional_price || selectedProduct.price;
      const totalPrice = salePrice * quantity;

      // Create order for this item
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          commerce_id: commerceId,
          user_id: targetUserId,
          table_id: session.table_id,
          session_id: session.id,
          order_type: 'table',
          status: 'delivered',
          subtotal: totalPrice,
          total: totalPrice,
          payment_method: 'pending',
          customer_name: session.bill_mode === 'split' 
            ? session.participants.find(p => p.id === selectedParticipant)?.customer_name 
            : session.participants.find(p => p.is_host)?.customer_name || 'Cliente',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: quantity,
          unit_price: salePrice,
          total_price: totalPrice,
        });

      if (itemError) throw itemError;

      toast({
        title: "Item adicionado!",
        description: `${quantity}x ${selectedProduct.name} adicionado à comanda da Mesa ${session.table_number}`,
      });

      // Reset form
      setSelectedProduct(null);
      setProductSearch("");
      setQuantity(1);
      setSelectedSession("");
      setSelectedParticipant("");
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar item",
        description: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedSessionData = activeSessions.find(s => s.id === selectedSession);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Lançar em Comanda
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma mesa/comanda ativa no momento</p>
            <p className="text-sm">Aguarde um cliente abrir uma mesa</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {/* Step 1: Select Table/Session */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">1</span>
                  Selecione a Mesa
                </Label>
                <Accordion type="single" collapsible className="border rounded-lg">
                  {activeSessions.map((session) => (
                    <AccordionItem key={session.id} value={session.id} className="border-0">
                      <AccordionTrigger 
                        className={`px-4 hover:no-underline ${selectedSession === session.id ? 'bg-primary/10' : ''}`}
                        onClick={() => {
                          setSelectedSession(session.id);
                          setSelectedParticipant("");
                        }}
                      >
                        <div className="flex items-center gap-3 text-left">
                          {selectedSession === session.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                          <div>
                            <p className="font-medium">
                              Mesa {session.table_number}
                              {session.table_name && ` - ${session.table_name}`}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant={session.bill_mode === 'split' ? 'secondary' : 'outline'} className="text-xs">
                                {session.bill_mode === 'split' ? 'Comanda Separada' : 'Comanda Única'}
                              </Badge>
                              <span>{session.participants.length} pessoa(s)</span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3">
                        <div className="space-y-2">
                          {session.participants.map((participant) => (
                            <div 
                              key={participant.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                session.bill_mode === 'split' 
                                  ? selectedParticipant === participant.id 
                                    ? 'bg-primary/20 border border-primary' 
                                    : 'bg-muted/50 hover:bg-muted'
                                  : 'bg-muted/50'
                              }`}
                              onClick={() => {
                                if (session.bill_mode === 'split') {
                                  setSelectedSession(session.id);
                                  setSelectedParticipant(participant.id);
                                }
                              }}
                            >
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {participant.customer_name}
                                {participant.is_host && (
                                  <Badge variant="outline" className="ml-2 text-xs">Anfitrião</Badge>
                                )}
                              </span>
                              {session.bill_mode === 'split' && selectedParticipant === participant.id && (
                                <Check className="w-4 h-4 text-primary ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>
                        {session.bill_mode === 'split' && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Selecione o cliente para adicionar o item
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Step 2: Select Product */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">2</span>
                  Selecione o Produto
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      if (selectedProduct && e.target.value !== selectedProduct.name) {
                        setSelectedProduct(null);
                      }
                    }}
                    placeholder="Buscar produto..."
                    className="pl-10"
                  />
                </div>
                {productSearch && !selectedProduct && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {filteredProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3">Nenhum produto encontrado</p>
                    ) : (
                      filteredProducts.slice(0, 10).map((product) => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handleSelectProduct(product)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              {product.category?.name && (
                                <p className="text-xs text-muted-foreground">{product.category.name}</p>
                              )}
                            </div>
                            <p className="font-bold text-primary">
                              {formatCurrency(product.promotional_price || product.price)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedProduct && (
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{selectedProduct.name}</p>
                        <p className="text-sm text-primary font-bold">
                          {formatCurrency(selectedProduct.promotional_price || selectedProduct.price)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(null);
                          setProductSearch("");
                        }}
                      >
                        Trocar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Quantity */}
              {selectedProduct && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">3</span>
                    Quantidade
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Summary */}
              {selectedProduct && selectedSession && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Resumo</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mesa:</span>
                      <span>
                        Mesa {selectedSessionData?.table_number}
                        {selectedSessionData?.bill_mode === 'split' && selectedParticipant && (
                          <> - {selectedSessionData.participants.find(p => p.id === selectedParticipant)?.customer_name}</>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produto:</span>
                      <span>{quantity}x {selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-primary">
                        {formatCurrency((selectedProduct.promotional_price || selectedProduct.price) * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full gap-2"
                size="lg"
                disabled={
                  !selectedProduct || 
                  !selectedSession || 
                  (selectedSessionData?.bill_mode === 'split' && !selectedParticipant) ||
                  submitting
                }
                onClick={handleAddToTab}
              >
                <ShoppingBag className="w-4 h-4" />
                {submitting ? "Adicionando..." : "Adicionar à Comanda"}
              </Button>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToTabModal;

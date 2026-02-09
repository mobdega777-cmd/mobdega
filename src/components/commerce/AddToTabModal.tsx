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
  Check,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatCurrency";

interface PreSelectedSessionData {
  id: string;
  table_id: string;
  bill_mode: 'single' | 'split';
  participants: Array<{
    id: string;
    user_id: string;
    customer_name: string | null;
    is_host: boolean;
  }>;
}

interface AddToTabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commerceId: string;
  preSelectedSessionId?: string | null;
  preSelectedTableNumber?: number | null;
  preSelectedSessionData?: PreSelectedSessionData | null;
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

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const AddToTabModal = ({ 
  open, 
  onOpenChange, 
  commerceId, 
  preSelectedSessionId,
  preSelectedTableNumber,
  preSelectedSessionData,
  onSuccess 
}: AddToTabModalProps) => {
  const [activeSessions, setActiveSessions] = useState<TableSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // If we have pre-selected session data, use it directly instead of fetching
      if (preSelectedSessionData && preSelectedSessionId) {
        const session: TableSession = {
          id: preSelectedSessionData.id,
          table_id: preSelectedSessionData.table_id,
          table_number: preSelectedTableNumber || 0,
          table_name: null,
          bill_mode: preSelectedSessionData.bill_mode,
          participants: preSelectedSessionData.participants.map(p => ({
            ...p,
            session_id: preSelectedSessionData.id
          }))
        };
        setActiveSessions([session]);
        setSelectedSession(session.id);
        
        // For single bill, auto-select the host participant
        if (session.bill_mode === 'single') {
          const host = session.participants.find(p => p.is_host);
          if (host) setSelectedParticipant(host.id);
        }
        
        // Only fetch products
        fetchProducts();
      } else {
        fetchData();
      }
    } else {
      // Reset form when closing
      setSelectedProduct(null);
      setProductSearch("");
      setQuantity(1);
      setSelectedSession("");
      setSelectedParticipant("");
      setCartItems([]);
    }
  }, [open, commerceId, preSelectedSessionData, preSelectedSessionId]);

  // Set pre-selected session when it changes (fallback for non-pre-loaded data)
  useEffect(() => {
    if (preSelectedSessionId && activeSessions.length > 0 && !preSelectedSessionData) {
      setSelectedSession(preSelectedSessionId);
      const session = activeSessions.find(s => s.id === preSelectedSessionId);
      // For single bill, auto-select the host participant
      if (session && session.bill_mode === 'single') {
        const host = session.participants.find(p => p.is_host);
        if (host) setSelectedParticipant(host.id);
      }
    }
  }, [preSelectedSessionId, activeSessions, preSelectedSessionData]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price, promotional_price, stock, category:categories(name)')
      .eq('commerce_id', commerceId)
      .eq('is_active', true)
      .order('name');

    setProducts(productsData || []);
    setLoading(false);
  };

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

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    const salePrice = selectedProduct.promotional_price || selectedProduct.price;
    
    // Check if product already in cart
    const existingIndex = cartItems.findIndex(item => item.product.id === selectedProduct.id);
    
    if (existingIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...cartItems];
      updatedItems[existingIndex].quantity += quantity;
      updatedItems[existingIndex].totalPrice = updatedItems[existingIndex].unitPrice * updatedItems[existingIndex].quantity;
      setCartItems(updatedItems);
    } else {
      // Add new item
      setCartItems([...cartItems, {
        product: selectedProduct,
        quantity,
        unitPrice: salePrice,
        totalPrice: salePrice * quantity
      }]);
    }
    
    // Reset product selection for next addition
    setSelectedProduct(null);
    setProductSearch("");
    setQuantity(1);
    
    toast({
      title: "Item adicionado à lista",
      description: `${quantity}x ${selectedProduct.name}`,
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleAddToTab = async () => {
    if (cartItems.length === 0 || !selectedSession || !user) return;

    const session = activeSessions.find(s => s.id === selectedSession);
    if (!session) return;

    // Determine user_id for the order
    let targetUserId: string;
    let targetCustomerName: string;
    
    if (session.bill_mode === 'split' && selectedParticipant) {
      const participant = session.participants.find(p => p.id === selectedParticipant);
      targetUserId = participant?.user_id || user.id;
      targetCustomerName = participant?.customer_name || 'Cliente';
    } else {
      // Single bill - use the host's user_id
      const host = session.participants.find(p => p.is_host);
      targetUserId = host?.user_id || session.participants[0]?.user_id || user.id;
      targetCustomerName = host?.customer_name || session.participants[0]?.customer_name || 'Cliente';
    }

    setSubmitting(true);

    try {
      const totalOrder = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

      // Create a single order for all items
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          commerce_id: commerceId,
          user_id: targetUserId,
          table_id: session.table_id,
          session_id: session.id,
          order_type: 'table',
          status: 'delivered',
          subtotal: totalOrder,
          total: totalOrder,
          payment_method: 'pending',
          customer_name: targetCustomerName,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create all order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const itemsText = cartItems.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
      toast({
        title: "Itens adicionados!",
        description: `${itemsText} adicionados à comanda da Mesa ${session.table_number}`,
      });

      // Reset form
      setCartItems([]);
      setSelectedProduct(null);
      setProductSearch("");
      setQuantity(1);
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar itens",
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
  const hasPreselection = !!preSelectedSessionId;
  const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            {hasPreselection && preSelectedTableNumber ? (
              <>Lançar em Comanda - Mesa {preSelectedTableNumber}</>
            ) : (
              <>Lançar em Comanda</>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 px-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-8 px-6 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma mesa/comanda ativa no momento</p>
            <p className="text-sm">Aguarde um cliente abrir uma mesa</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 space-y-4 pb-4">
                {/* Step 1: Select Table/Session - Hide if pre-selected */}
                {!hasPreselection && (
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
                )}

                {/* Show participant selector for pre-selected split bill */}
                {hasPreselection && selectedSessionData?.bill_mode === 'split' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">1</span>
                      Selecione o Cliente
                    </Label>
                    <div className="space-y-2 border rounded-lg p-3">
                      {selectedSessionData.participants.map((participant) => (
                        <div 
                          key={participant.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedParticipant === participant.id 
                              ? 'bg-primary/20 border border-primary' 
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                          onClick={() => setSelectedParticipant(participant.id)}
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {participant.customer_name}
                            {participant.is_host && (
                              <Badge variant="outline" className="ml-2 text-xs">Anfitrião</Badge>
                            )}
                          </span>
                          {selectedParticipant === participant.id && (
                            <Check className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Select Product */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">
                      {hasPreselection && selectedSessionData?.bill_mode !== 'split' ? '1' : hasPreselection ? '2' : '2'}
                    </span>
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
                      autoFocus={hasPreselection}
                    />
                  </div>
                  {productSearch && !selectedProduct && (
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      {filteredProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-3">Nenhum produto encontrado</p>
                      ) : (
                        filteredProducts.slice(0, 10).map((product) => {
                          const isOutOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0;
                          const isLowStock = !isOutOfStock && product.stock !== null && product.stock !== undefined && product.stock <= 5;
                          return (
                            <div
                              key={product.id}
                              className={`p-3 border-b last:border-b-0 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}`}
                              onClick={() => !isOutOfStock && handleSelectProduct(product)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-sm">{product.name}</p>
                                  {product.category?.name && (
                                    <p className="text-xs text-muted-foreground">{product.category.name}</p>
                                  )}
                                  {isLowStock && (
                                    <p className="text-xs text-yellow-600">Estoque: {product.stock} un.</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isOutOfStock ? (
                                    <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Esgotado</span>
                                  ) : (
                                    <p className="font-semibold text-primary">
                                      {formatCurrency(product.promotional_price || product.price)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Selected Product Display */}
                  {selectedProduct && (
                    <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{selectedProduct.name}</p>
                          <p className="text-sm text-primary font-semibold">
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

                {/* Quantity Selector + Add Button */}
                {selectedProduct && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">
                        {hasPreselection && selectedSessionData?.bill_mode !== 'split' ? '2' : hasPreselection ? '3' : '3'}
                      </span>
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
                      
                      {/* Add to list button */}
                      <Button
                        type="button"
                        variant="secondary"
                        className="ml-auto gap-2"
                        onClick={handleAddToCart}
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Cart Items List */}
                {cartItems.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Itens na lista ({cartItems.length})
                    </h4>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-background p-2 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.quantity}x {item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.unitPrice)} cada
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary text-sm">
                              {formatCurrency(item.totalPrice)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveFromCart(index)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                )}

                {/* Summary for selected session */}
                {selectedSession && cartItems.length > 0 && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mesa:</span>
                        <span className="font-medium">
                          Mesa {selectedSessionData?.table_number}
                          {selectedSessionData?.bill_mode === 'split' && selectedParticipant && (
                            <> - {selectedSessionData.participants.find(p => p.id === selectedParticipant)?.customer_name}</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Submit Button - Fixed at bottom */}
            <div className="p-6 pt-4 border-t flex-shrink-0 bg-background">
              <Button
                className="w-full gap-2"
                size="lg"
                disabled={
                  cartItems.length === 0 || 
                  !selectedSession || 
                  (selectedSessionData?.bill_mode === 'split' && !selectedParticipant) ||
                  submitting
                }
                onClick={handleAddToTab}
              >
                <ShoppingBag className="w-4 h-4" />
                {submitting ? "Adicionando..." : `Adicionar à Comanda (${formatCurrency(cartTotal)})`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToTabModal;

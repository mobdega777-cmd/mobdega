import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  Search, 
  Star, 
  Upload, 
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  Percent,
  Layers,
  Scissors,
  EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPercentage } from "@/lib/formatCurrency";

interface CommerceProductsProps {
  commerceId: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  stock: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  image_url: string | null;
  category_id: string | null;
  category?: { name: string };
  is_composite?: boolean;
  is_fractioned?: boolean;
  hide_from_menu?: boolean;
  fraction_unit?: string | null;
  fraction_total?: number | null;
  fraction_per_serving?: number | null;
  cost_per_serving?: number | null;
}

interface Category {
  id: string;
  name: string;
}

interface CompositeItem {
  component_product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  component_stock: number;
}

interface StockStats {
  totalProducts: number;
  totalCostValue: number;
  totalSaleValue: number;
  potentialProfit: number;
  avgMargin: number;
  topSeller: { name: string; stock: number } | null;
  lowStock: { name: string; stock: number } | null;
}

const CommerceProducts = ({ commerceId }: CommerceProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // New product type states
  const [isComposite, setIsComposite] = useState(false);
  const [isFractioned, setIsFractioned] = useState(false);
  const [hideFromMenu, setHideFromMenu] = useState(false);
  const [compositeItems, setCompositeItems] = useState<CompositeItem[]>([]);
  const [compositeSearch, setCompositeSearch] = useState("");
  const [fractionUnit, setFractionUnit] = useState("ml");
  const [fractionTotal, setFractionTotal] = useState("");
  const [fractionPerServing, setFractionPerServing] = useState("");
  const [costPerServing, setCostPerServing] = useState("");
  const [fractionTotalCost, setFractionTotalCost] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost: "",
    sale_price: "",
    stock: "",
    is_active: true,
    is_featured: false,
    category_id: "",
    image_url: "",
  });

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('commerce_id', commerceId)
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('commerce_id', commerceId)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [commerceId]);

  // Calcular margem de lucro
  const calculateMargin = (cost: string, salePrice: string): number => {
    const costNum = parseFloat(cost) || 0;
    const salePriceNum = parseFloat(salePrice) || 0;
    if (costNum === 0 || salePriceNum === 0) return 0;
    return ((salePriceNum - costNum) / costNum) * 100;
  };

  const margin = calculateMargin(formData.cost, formData.sale_price);

  // Calcular estatísticas de estoque
  const calculateStockStats = (): StockStats => {
    let totalCostValue = 0;
    let totalSaleValue = 0;
    let totalMarginSum = 0;
    let productWithMargin = 0;

    products.forEach((product) => {
      const stock = product.stock || 0;
      const cost = product.price || 0;
      const salePrice = product.promotional_price || 0;

      totalCostValue += cost * stock;
      totalSaleValue += salePrice * stock;

      if (cost > 0 && salePrice > 0) {
        totalMarginSum += ((salePrice - cost) / cost) * 100;
        productWithMargin++;
      }
    });

    const sortedByStock = [...products].sort((a, b) => (b.stock || 0) - (a.stock || 0));
    const topSeller = sortedByStock.length > 0 
      ? { name: sortedByStock[0].name, stock: sortedByStock[0].stock || 0 }
      : null;
    
    // Ordenar por menor estoque (incluindo 0)
    const sortedLowStock = [...products].sort((a, b) => (a.stock || 0) - (b.stock || 0));
    const lowStock = sortedLowStock.length > 0
      ? { name: sortedLowStock[0].name, stock: sortedLowStock[0].stock || 0 }
      : null;

    return {
      totalProducts: products.length,
      totalCostValue,
      totalSaleValue,
      potentialProfit: totalSaleValue - totalCostValue,
      avgMargin: productWithMargin > 0 ? totalMarginSum / productWithMargin : 0,
      topSeller,
      lowStock,
    };
  };

  const stats = calculateStockStats();

  // Upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${commerceId}/products/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('commerce-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('commerce-assets')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      setImagePreview(publicUrl);
      toast({ title: "Imagem enviada com sucesso!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao enviar imagem", description: error.message });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image_url: "" });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Criar nova categoria inline
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ variant: "destructive", title: "Digite o nome da categoria" });
      return;
    }

    setCreatingCategory(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          commerce_id: commerceId,
          name: newCategoryName.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setFormData({ ...formData, category_id: data.id });
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      toast({ title: "Categoria criada com sucesso!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao criar categoria", description: error.message });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData: any = {
      commerce_id: commerceId,
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.cost),
      promotional_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      category_id: formData.category_id || null,
      image_url: formData.image_url || null,
      is_composite: isComposite,
      is_fractioned: isFractioned,
      hide_from_menu: hideFromMenu,
      fraction_unit: isFractioned ? fractionUnit : null,
      fraction_total: isFractioned && fractionTotal ? parseFloat(fractionTotal) : null,
      fraction_per_serving: isFractioned && fractionPerServing ? parseFloat(fractionPerServing) : null,
      cost_per_serving: isFractioned && costPerServing ? parseFloat(costPerServing) : null,
    };

    // For fractioned products, auto-calculate cost from servings
    if (isFractioned && costPerServing && fractionTotal && fractionPerServing) {
      const totalServings = parseFloat(fractionTotal) / parseFloat(fractionPerServing);
      productData.price = parseFloat(costPerServing) * totalServings;
      // Stock in total units (e.g., ml)
      if (formData.stock) {
        productData.stock = parseInt(formData.stock);
      }
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar produto", description: error.message });
      } else {
        // Update composite items if needed
        if (isComposite) {
          await saveCompositeItems(editingProduct.id);
        }
        toast({ title: "Produto atualizado com sucesso!" });
        setIsDialogOpen(false);
        fetchProducts();
      }
    } else {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        toast({ variant: "destructive", title: "Erro ao criar produto", description: error.message });
      } else {
        if (isComposite && newProduct) {
          await saveCompositeItems(newProduct.id);
        }
        toast({ title: "Produto criado com sucesso!" });
        setIsDialogOpen(false);
        fetchProducts();
      }
    }
    resetForm();
  };

  const saveCompositeItems = async (productId: string) => {
    // Delete existing items first
    await supabase
      .from('composite_product_items')
      .delete()
      .eq('composite_product_id', productId);

    if (compositeItems.length > 0) {
      const items = compositeItems.map(item => ({
        composite_product_id: productId,
        component_product_id: item.component_product_id,
        quantity: item.quantity,
      }));
      await supabase.from('composite_product_items').insert(items);
    }
  };

  const addCompositeItem = (product: Product) => {
    if (compositeItems.find(i => i.component_product_id === product.id)) {
      toast({ variant: "destructive", title: "Produto já adicionado" });
      return;
    }
    const isFrac = product.is_fractioned;
    setCompositeItems([...compositeItems, {
      component_product_id: product.id,
      product_name: product.name,
      quantity: isFrac ? (product.fraction_per_serving || 1) : 1,
      unit_cost: isFrac ? (product.cost_per_serving || product.price) : product.price,
      component_stock: product.stock || 0,
    }]);
    setCompositeSearch("");
  };

  const removeCompositeItem = (index: number) => {
    setCompositeItems(compositeItems.filter((_, i) => i !== index));
  };

  const updateCompositeItemQty = (index: number, qty: number) => {
    const updated = [...compositeItems];
    updated[index].quantity = qty;
    setCompositeItems(updated);
  };

  const compositeTotalCost = compositeItems.reduce((sum, item) => {
    return sum + (item.unit_cost * item.quantity);
  }, 0);

  const compositeMaxStock = compositeItems.length > 0
    ? Math.min(...compositeItems.map(item => 
        item.quantity > 0 ? Math.floor(item.component_stock / item.quantity) : 0
      ))
    : 0;

  // Auto-fill cost/stock for fractioned products
  useEffect(() => {
    if (!isFractioned) return;
    const ft = parseFloat(fractionTotal);
    const fps = parseFloat(fractionPerServing);
    const cps = parseFloat(costPerServing);
    if (ft > 0 && fps > 0 && cps > 0) {
      const totalServings = Math.floor(ft / fps);
      setFormData(prev => ({
        ...prev,
        cost: cps.toFixed(2),
        stock: totalServings.toString(),
      }));
    }
  }, [isFractioned, fractionTotal, fractionPerServing, costPerServing]);

  // Auto-fill cost/stock for composite products
  useEffect(() => {
    if (!isComposite || compositeItems.length === 0) return;
    setFormData(prev => ({
      ...prev,
      cost: compositeTotalCost.toFixed(2),
      stock: compositeMaxStock.toString(),
    }));
  }, [isComposite, compositeItems, compositeTotalCost, compositeMaxStock]);

  const filteredCompositeProducts = products.filter(p =>
    p.name.toLowerCase().includes(compositeSearch.toLowerCase()) &&
    p.id !== editingProduct?.id
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir produto", description: error.message });
    } else {
      toast({ title: "Produto excluído com sucesso!" });
      fetchProducts();
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      cost: product.price.toString(),
      sale_price: product.promotional_price?.toString() || "",
      stock: product.stock?.toString() || "",
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      category_id: product.category_id || "",
      image_url: product.image_url || "",
    });
    setImagePreview(product.image_url || null);
    setIsComposite(product.is_composite ?? false);
    setIsFractioned(product.is_fractioned ?? false);
    setHideFromMenu(product.hide_from_menu ?? false);
    setFractionUnit(product.fraction_unit || "ml");
    setFractionTotal(product.fraction_total?.toString() || "");
    setFractionPerServing(product.fraction_per_serving?.toString() || "");
    setCostPerServing(product.cost_per_serving?.toString() || "");
    // Calculate total cost from cost_per_serving * doses for edit
    if (product.fraction_total && product.fraction_per_serving && product.cost_per_serving) {
      const doses = Math.floor(product.fraction_total / product.fraction_per_serving);
      setFractionTotalCost((product.cost_per_serving * doses).toFixed(2));
    } else {
      setFractionTotalCost("");
    }

    // Load composite items if composite
    if (product.is_composite) {
      const { data: items } = await supabase
        .from('composite_product_items')
        .select('component_product_id, quantity')
        .eq('composite_product_id', product.id);

      if (items) {
        const composites: CompositeItem[] = [];
        for (const item of items) {
          const comp = products.find(p => p.id === item.component_product_id);
          composites.push({
            component_product_id: item.component_product_id,
            product_name: comp?.name || 'Produto removido',
            quantity: item.quantity,
            unit_cost: comp?.is_fractioned ? (comp.cost_per_serving || comp.price) : (comp?.price || 0),
            component_stock: comp?.stock || 0,
          });
        }
        setCompositeItems(composites);
      }
    } else {
      setCompositeItems([]);
    }

    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      cost: "",
      sale_price: "",
      stock: "",
      is_active: true,
      is_featured: false,
      category_id: "",
      image_url: "",
    });
    setImagePreview(null);
    setShowNewCategoryInput(false);
    setNewCategoryName("");
    setIsComposite(false);
    setIsFractioned(false);
    setHideFromMenu(false);
    setCompositeItems([]);
    setCompositeSearch("");
    setFractionUnit("ml");
    setFractionTotal("");
    setFractionPerServing("");
    setCostPerServing("");
    setFractionTotalCost("");
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catálogo de produtos e estoque</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Product Type Checkboxes */}
                <div className="col-span-2 flex flex-wrap gap-4 p-3 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is_composite"
                      checked={isComposite}
                      onCheckedChange={(checked) => {
                        setIsComposite(!!checked);
                        if (checked) setIsFractioned(false);
                      }}
                    />
                    <Label htmlFor="is_composite" className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <Layers className="w-4 h-4 text-blue-500" />
                      Produto Composto
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is_fractioned"
                      checked={isFractioned}
                      onCheckedChange={(checked) => {
                        setIsFractioned(!!checked);
                        if (checked) setIsComposite(false);
                      }}
                    />
                    <Label htmlFor="is_fractioned" className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <Scissors className="w-4 h-4 text-orange-500" />
                      Produto Fracionado
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hide_from_menu"
                      checked={hideFromMenu}
                      onCheckedChange={(checked) => setHideFromMenu(!!checked)}
                    />
                    <Label htmlFor="hide_from_menu" className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <EyeOff className="w-4 h-4 text-red-500" />
                      Não Aparecer no Cardápio
                    </Label>
                  </div>
                </div>

                {/* Fractioned Product Config */}
                {isFractioned && (
                  <div className="col-span-2 p-4 rounded-lg border border-orange-500/30 bg-orange-500/5 space-y-3">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Scissors className="w-4 h-4 text-orange-500" />
                      Configuração do Produto Fracionado
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Unidade de Medida</Label>
                        <Select value={fractionUnit} onValueChange={setFractionUnit}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ml">ml (mililitros)</SelectItem>
                            <SelectItem value="g">g (gramas)</SelectItem>
                            <SelectItem value="un">un (unidades)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Total ({fractionUnit})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={fractionTotal}
                          onChange={(e) => setFractionTotal(e.target.value)}
                          placeholder="Ex: 1000"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Qtd por dose ({fractionUnit})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={fractionPerServing}
                          onChange={(e) => setFractionPerServing(e.target.value)}
                          placeholder="Ex: 50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Custo total (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={fractionTotalCost}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFractionTotalCost(val);
                            const ft = parseFloat(fractionTotal);
                            const fps = parseFloat(fractionPerServing);
                            if (ft > 0 && fps > 0 && parseFloat(val) > 0) {
                              const doses = Math.floor(ft / fps);
                              if (doses > 0) {
                                setCostPerServing((parseFloat(val) / doses).toFixed(2));
                              }
                            }
                          }}
                          placeholder="Ex: 40.00"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Custo por dose (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={costPerServing}
                          onChange={(e) => setCostPerServing(e.target.value)}
                          placeholder="Ex: 2.00"
                        />
                      </div>
                    </div>
                    {fractionTotal && fractionPerServing && costPerServing && (
                      <div className="p-2 rounded bg-orange-500/10 text-sm">
                        <p>
                          <strong>{Math.floor(parseFloat(fractionTotal) / parseFloat(fractionPerServing))}</strong> doses de {fractionPerServing}{fractionUnit} · 
                          Custo total: <strong>{formatCurrency(parseFloat(costPerServing) * Math.floor(parseFloat(fractionTotal) / parseFloat(fractionPerServing)))}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Composite Product Config */}
                {isComposite && (
                  <div className="col-span-2 p-4 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-3">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Layers className="w-4 h-4 text-blue-500" />
                      Composição do Produto
                    </h4>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={compositeSearch}
                        onChange={(e) => setCompositeSearch(e.target.value)}
                        placeholder="Buscar produto para adicionar..."
                        className="pl-10"
                      />
                    </div>
                    {compositeSearch && (
                      <div className="max-h-32 overflow-y-auto border rounded-lg divide-y">
                        {filteredCompositeProducts.slice(0, 5).map(p => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer text-sm"
                            onClick={() => addCompositeItem(p)}
                          >
                            <div>
                              <span className="font-medium">{p.name}</span>
                              {p.is_fractioned && (
                                <Badge variant="outline" className="ml-2 text-xs">Fracionado</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Custo: {formatCurrency(p.is_fractioned ? (p.cost_per_serving || p.price) : p.price)}
                              </span>
                              <Plus className="w-4 h-4 text-primary" />
                            </div>
                          </div>
                        ))}
                        {filteredCompositeProducts.length === 0 && (
                          <p className="p-2 text-xs text-muted-foreground text-center">Nenhum produto encontrado</p>
                        )}
                      </div>
                    )}

                    {compositeItems.length > 0 && (
                      <div className="space-y-2">
                        {compositeItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-background rounded border">
                            <span className="flex-1 text-sm font-medium truncate">{item.product_name}</span>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateCompositeItemQty(idx, parseFloat(e.target.value) || 0)}
                              className="w-20 text-center"
                            />
                            <span className="text-xs text-muted-foreground w-20 text-right">
                              {formatCurrency(item.unit_cost * item.quantity)}
                            </span>
                            <Button type="button" size="icon" variant="ghost" onClick={() => removeCompositeItem(idx)} className="shrink-0">
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <div className="p-2 rounded bg-blue-500/10 text-sm font-medium">
                          Custo total da composição: {formatCurrency(compositeTotalCost)}
                        </div>
                        <div className="p-2 rounded bg-blue-500/10 text-sm">
                          Estoque calculado: <strong>{compositeMaxStock}</strong> combinações possíveis
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Custo (R$) *</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sale_price">Preço de Venda (R$)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  />
                </div>

                {/* Cálculo de margem de lucro */}
                {formData.cost && formData.sale_price && (
                  <div className="col-span-2">
                    <div className={`p-3 rounded-lg flex items-center gap-3 ${
                      margin > 0 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : margin < 0 
                          ? 'bg-red-500/10 border border-red-500/30'
                          : 'bg-muted'
                    }`}>
                      <Percent className={`w-5 h-5 ${
                        margin > 0 ? 'text-green-500' : margin < 0 ? 'text-red-500' : 'text-muted-foreground'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">Margem de Lucro</p>
                        <p className={`text-lg font-bold ${
                          margin > 0 ? 'text-green-500' : margin < 0 ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                          {margin.toFixed(2)}%
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm text-muted-foreground">Lucro por unidade</p>
                        <p className={`font-medium ${
                          margin > 0 ? 'text-green-500' : margin < 0 ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                          {formatCurrency((parseFloat(formData.sale_price) || 0) - (parseFloat(formData.cost) || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  {showNewCategoryInput ? (
                    <div className="flex gap-2">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nome da categoria"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleCreateCategory}
                        disabled={creatingCategory}
                      >
                        {creatingCategory ? "..." : "Criar"}
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryName("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="outline"
                        onClick={() => setShowNewCategoryInput(true)}
                        title="Criar nova categoria"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <Label>Imagem do Produto</Label>
                  <div className="mt-2">
                    {imagePreview || formData.image_url ? (
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview || formData.image_url} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-6 h-6"
                          onClick={removeImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      >
                        {uploadingImage ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">Upload</span>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Produto Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="is_featured">Destaque</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? "Salvar" : "Criar Produto"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas de Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total em Estoque (Custo)</p>
                <p className="text-xl font-bold text-blue-500">
                  {formatCurrency(stats.totalCostValue)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total em Estoque (Venda)</p>
                <p className="text-xl font-bold text-green-500">
                  {formatCurrency(stats.totalSaleValue)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Lucro Potencial</p>
                <p className="text-xl font-bold text-purple-500">
                  {formatCurrency(stats.potentialProfit)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Margem Média</p>
                <p className="text-xl font-bold text-orange-500">
                  {stats.avgMargin.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Percent className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Produtos</p>
                <p className="text-lg font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ArrowUpCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Maior Estoque</p>
                <p className="text-sm font-medium truncate">
                  {stats.topSeller?.name || "-"}
                </p>
                <p className="text-xs text-green-500">
                  {stats.topSeller?.stock || 0} unidades
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <ArrowDownCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Menor Estoque</p>
                <p className="text-sm font-medium truncate">
                  {stats.lowStock?.name || "-"}
                </p>
                <p className="text-xs text-red-500">
                  {stats.lowStock?.stock || 0} unidades
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Valor Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const productMargin = product.promotional_price && product.price 
                    ? ((product.promotional_price - product.price) / product.price) * 100 
                    : 0;
                  const stockValue = (product.promotional_price || 0) * (product.stock || 0);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium flex items-center gap-1">
                              {product.name}
                              {product.is_featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            </p>
                            {product.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category?.name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCurrency(product.is_fractioned && product.cost_per_serving ? product.cost_per_serving : product.price)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.promotional_price 
                          ? formatCurrency(product.promotional_price)
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          productMargin > 0 
                            ? "bg-green-500/20 text-green-500" 
                            : productMargin < 0 
                              ? "bg-red-500/20 text-red-500"
                              : "bg-muted text-muted-foreground"
                        }`}>
                          {productMargin.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{product.stock ?? 0}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(stockValue)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.is_active 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-red-500/20 text-red-500"
                        }`}>
                          {product.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommerceProducts;
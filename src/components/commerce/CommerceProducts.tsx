import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Percent
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommerceProductsProps {
  commerceId: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number; // Agora é custo
  promotional_price: number | null; // Agora é preço de venda
  stock: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  image_url: string | null;
  category_id: string | null;
  category?: { name: string };
}

interface Category {
  id: string;
  name: string;
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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost: "", // era price
    sale_price: "", // era promotional_price
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
    
    const lowStockProducts = products.filter(p => (p.stock || 0) > 0);
    const sortedLowStock = lowStockProducts.sort((a, b) => (a.stock || 0) - (b.stock || 0));
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
    if (!newCategoryName.trim()) return;

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
    
    const productData = {
      commerce_id: commerceId,
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.cost), // cost -> price no banco
      promotional_price: formData.sale_price ? parseFloat(formData.sale_price) : null, // sale_price -> promotional_price
      stock: formData.stock ? parseInt(formData.stock) : 0,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      category_id: formData.category_id || null,
      image_url: formData.image_url || null,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar produto", description: error.message });
      } else {
        toast({ title: "Produto atualizado com sucesso!" });
        setIsDialogOpen(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao criar produto", description: error.message });
      } else {
        toast({ title: "Produto criado com sucesso!" });
        setIsDialogOpen(false);
        fetchProducts();
      }
    }
    resetForm();
  };

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

  const handleEdit = (product: Product) => {
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
                          R$ {((parseFloat(formData.sale_price) || 0) - (parseFloat(formData.cost) || 0)).toFixed(2)}
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
                  R$ {stats.totalCostValue.toFixed(2)}
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
                  R$ {stats.totalSaleValue.toFixed(2)}
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
                  R$ {stats.potentialProfit.toFixed(2)}
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
                        R$ {product.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.promotional_price 
                          ? `R$ ${product.promotional_price.toFixed(2)}`
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
                        R$ {stockValue.toFixed(2)}
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
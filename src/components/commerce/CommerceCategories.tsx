import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, FolderOpen, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommerceCategoriesProps {
  commerceId: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  products_count?: number;
}

const CommerceCategories = ({ commerceId }: CommerceCategoriesProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    is_active: true,
    sort_order: 0,
  });

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*, products:products(count)')
      .eq('commerce_id', commerceId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      const categoriesWithCount = data?.map(cat => ({
        ...cat,
        products_count: cat.products?.[0]?.count || 0
      })) || [];
      setCategories(categoriesWithCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, [commerceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const categoryData = {
      commerce_id: commerceId,
      name: formData.name,
      description: formData.description || null,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
      sort_order: formData.sort_order,
    };

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', editingCategory.id);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar categoria", description: error.message });
      } else {
        toast({ title: "Categoria atualizada com sucesso!" });
        setIsDialogOpen(false);
        fetchCategories();
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert(categoryData);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao criar categoria", description: error.message });
      } else {
        toast({ title: "Categoria criada com sucesso!" });
        setIsDialogOpen(false);
        fetchCategories();
      }
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Os produtos desta categoria ficarão sem categoria.')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir categoria", description: error.message });
    } else {
      toast({ title: "Categoria excluída com sucesso!" });
      fetchCategories();
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active ?? true,
      sort_order: category.sort_order ?? 0,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      image_url: "",
      is_active: true,
      sort_order: 0,
    });
  };

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
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">Organize seus produtos em categorias</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Categoria *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="sort_order">Ordem de Exibição</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Categoria Ativa</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategory ? "Salvar" : "Criar Categoria"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma categoria criada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie categorias para organizar seus produtos
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{category.products_count} produtos</TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        category.is_active 
                          ? "bg-green-500/20 text-green-500" 
                          : "bg-red-500/20 text-red-500"
                      }`}>
                        {category.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommerceCategories;

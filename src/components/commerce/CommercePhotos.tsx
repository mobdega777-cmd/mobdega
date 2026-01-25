import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  ImagePlus,
  Trash2,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommercePhotosProps {
  commerceId: string;
}

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

const CommercePhotos = ({ commerceId }: CommercePhotosProps) => {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [commerceId]);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('commerce_photos')
      .select('*')
      .eq('commerce_id', commerceId)
      .order('sort_order');

    if (error) {
      console.error('Error fetching photos:', error);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${commerceId}/gallery/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('commerce-assets')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('commerce-assets')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('commerce_photos')
        .insert({
          commerce_id: commerceId,
          image_url: urlData.publicUrl,
          caption: caption || null,
          sort_order: photos.length
        });

      if (insertError) throw insertError;

      toast({ title: "Foto adicionada com sucesso!" });
      setShowAddModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      fetchPhotos();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Erro ao enviar foto", 
        description: error.message 
      });
    }

    setUploading(false);
  };

  const handleDelete = async (photoId: string, imageUrl: string) => {
    if (!confirm("Deseja realmente excluir esta foto?")) return;

    try {
      // Extract path from URL for deletion
      const urlParts = imageUrl.split('/commerce-assets/');
      if (urlParts[1]) {
        await supabase.storage.from('commerce-assets').remove([urlParts[1]]);
      }

      const { error } = await supabase
        .from('commerce_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({ title: "Foto excluída!" });
      fetchPhotos();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Erro ao excluir", 
        description: error.message 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            Fotos do Estabelecimento
          </h2>
          <p className="text-muted-foreground mt-1">
            Adicione fotos do seu ambiente para os clientes conhecerem seu espaço
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <ImagePlus className="w-4 h-4" />
          Adicionar Foto
        </Button>
      </div>

      {photos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Camera className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Nenhuma foto adicionada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Adicionar Foto" para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden group relative">
                <div className="aspect-square bg-muted">
                  <img 
                    src={photo.image_url} 
                    alt={photo.caption || "Foto do estabelecimento"} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(photo.id, photo.image_url)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {photo.caption && (
                  <CardContent className="p-2">
                    <p className="text-xs text-muted-foreground truncate">{photo.caption}</p>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Photo Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Foto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Clique para selecionar uma imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}

            <div className="space-y-2">
              <Label>Legenda (opcional)</Label>
              <Input
                placeholder="Descrição da foto..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
              className="gap-2"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommercePhotos;

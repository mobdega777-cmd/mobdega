import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Video, 
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  BookOpen,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrainingVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const AdminTraining = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TrainingVideo | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    category: "geral",
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('training_videos')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error fetching videos:', error);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.video_url) {
      toast({ variant: "destructive", title: "Preencha título e URL do vídeo" });
      return;
    }

    setSaving(true);

    try {
      if (editingVideo) {
        const { error } = await supabase
          .from('training_videos')
          .update({
            title: formData.title,
            description: formData.description || null,
            video_url: formData.video_url,
            thumbnail_url: formData.thumbnail_url || null,
            category: formData.category,
            is_active: formData.is_active
          })
          .eq('id', editingVideo.id);

        if (error) throw error;
        toast({ title: "Vídeo atualizado!" });
      } else {
        const { error } = await supabase
          .from('training_videos')
          .insert({
            title: formData.title,
            description: formData.description || null,
            video_url: formData.video_url,
            thumbnail_url: formData.thumbnail_url || null,
            category: formData.category,
            is_active: formData.is_active,
            sort_order: videos.length
          });

        if (error) throw error;
        toast({ title: "Vídeo adicionado!" });
      }

      setShowAddModal(false);
      setEditingVideo(null);
      resetForm();
      fetchVideos();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este vídeo?")) return;

    const { error } = await supabase
      .from('training_videos')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    } else {
      toast({ title: "Vídeo excluído!" });
      fetchVideos();
    }
  };

  const toggleActive = async (video: TrainingVideo) => {
    const { error } = await supabase
      .from('training_videos')
      .update({ is_active: !video.is_active })
      .eq('id', video.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    } else {
      fetchVideos();
    }
  };

  const openEditModal = (video: TrainingVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || "",
      category: video.category,
      is_active: video.is_active
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      category: "geral",
      is_active: true
    });
  };

  const getYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
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
            <BookOpen className="w-6 h-6 text-primary" />
            Gerenciar Treinamentos
          </h2>
          <p className="text-muted-foreground mt-1">
            Adicione vídeos de treinamento para os comerciantes
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingVideo(null); setShowAddModal(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Vídeo
        </Button>
      </div>

      {videos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Nenhum vídeo cadastrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Adicionar Vídeo" para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video, index) => {
            const youtubeId = getYouTubeId(video.video_url);
            const thumbnail = video.thumbnail_url || (youtubeId 
              ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
              : null);

            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`overflow-hidden ${!video.is_active ? 'opacity-60' : ''}`}>
                  <div className="aspect-video bg-muted relative">
                    {thumbnail ? (
                      <img src={thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge className="capitalize">{video.category}</Badge>
                      {!video.is_active && (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-foreground">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => openEditModal(video)}>
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => toggleActive(video)}
                      >
                        {video.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {video.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1 ml-auto" onClick={() => handleDelete(video.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) setEditingVideo(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVideo ? 'Editar Vídeo' : 'Adicionar Vídeo'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Como cadastrar produtos"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>URL do Vídeo (YouTube) *</Label>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>URL da Thumbnail (opcional)</Label>
              <Input
                placeholder="https://..."
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Se não informado, será usada a thumbnail do YouTube</p>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                placeholder="Ex: geral, pedidos, financeiro"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição do vídeo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Vídeo Ativo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTraining;

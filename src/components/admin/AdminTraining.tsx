import { useState, useEffect, useRef } from "react";
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
  EyeOff,
  Upload,
  Link
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [videoInputMode, setVideoInputMode] = useState<"url" | "upload">("url");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setVideoInputMode("url");
    setUploadProgress(0);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        variant: "destructive", 
        title: "Formato inválido", 
        description: "Use MP4, WebM, OGG ou MOV" 
      });
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ 
        variant: "destructive", 
        title: "Arquivo muito grande", 
        description: "O tamanho máximo é 100MB" 
      });
      return;
    }

    setUploadingVideo(true);
    setUploadProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `training-videos/${fileName}`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from('training-videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      const { data: publicUrlData } = supabase.storage
        .from('training-videos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, video_url: publicUrlData.publicUrl });
      setUploadProgress(100);
      
      toast({ title: "Vídeo enviado com sucesso!" });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        variant: "destructive", 
        title: "Erro no upload", 
        description: error.message 
      });
    } finally {
      setUploadingVideo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{editingVideo ? 'Editar Vídeo' : 'Adicionar Vídeo'}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Ex: Como cadastrar produtos"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Video Input Mode Tabs */}
              <div className="space-y-2">
                <Label>Vídeo *</Label>
                <Tabs value={videoInputMode} onValueChange={(v) => setVideoInputMode(v as "url" | "upload")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="gap-2">
                      <Link className="w-4 h-4" />
                      URL (YouTube)
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="mt-3">
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    />
                  </TabsContent>
                  
                  <TabsContent value="upload" className="mt-3 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    
                    {formData.video_url && videoInputMode === "upload" ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                          <Video className="w-8 h-8 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Vídeo enviado</p>
                            <p className="text-xs text-muted-foreground truncate">{formData.video_url}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setFormData({ ...formData, video_url: "" })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-24 border-dashed flex flex-col gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingVideo}
                      >
                        {uploadingVideo ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-sm">Enviando... {uploadProgress}%</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6" />
                            <span className="text-sm">Clique para enviar vídeo</span>
                            <span className="text-xs text-muted-foreground">MP4, WebM, OGG ou MOV (máx. 100MB)</span>
                          </>
                        )}
                      </Button>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>URL da Thumbnail (opcional)</Label>
                <Input
                  placeholder="https://..."
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {videoInputMode === "url" 
                    ? "Se não informado, será usada a thumbnail do YouTube" 
                    : "Recomendado para vídeos enviados"
                  }
                </p>
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
          </ScrollArea>

          <DialogFooter className="p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || uploadingVideo} className="gap-2">
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

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Video, 
  Loader2,
  BookOpen,
  Clock,
  GraduationCap,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface TrainingVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
}

interface CommerceTrainingProps {
  isPendingApproval?: boolean;
}

const CommerceTraining = ({ isPendingApproval = false }: CommerceTrainingProps) => {
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TrainingVideo | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('training_videos')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching videos:', error);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  const categories = [...new Set(videos.map(v => v.category))];
  const filteredVideos = activeCategory 
    ? videos.filter(v => v.category === activeCategory)
    : videos;

  const getYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const isDirectVideoUrl = (url: string): boolean => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('.mov');
  };

  const handleVideoClick = (video: TrainingVideo) => {
    setSelectedVideo(video);
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
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Central de Treinamento
        </h2>
        <p className="text-muted-foreground mt-1">
          Aprenda a usar todas as funcionalidades da plataforma
        </p>
      </div>

      {/* Pending Approval Banner */}
      {isPendingApproval && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <GraduationCap className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Aproveite enquanto aguarda a aprovação!
            </AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              Enquanto seu cadastro está em análise, você pode aproveitar para conhecer a plataforma através dos nossos vídeos de treinamento. 
              Assim, quando sua conta for aprovada, você já estará preparado para usar todas as funcionalidades!
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Categories */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Badge 
            variant={activeCategory === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory(null)}
          >
            Todos
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      )}

      {filteredVideos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Nenhum vídeo disponível</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Os vídeos de treinamento serão adicionados em breve
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video, index) => {
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
                <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => handleVideoClick(video)}
                >
                  <div className="aspect-video bg-muted relative">
                    {thumbnail ? (
                      <img 
                        src={thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary-foreground ml-1" />
                      </div>
                    </div>
                    <Badge className="absolute top-2 right-2 capitalize">{video.category}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {video.title}
                      <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            {selectedVideo && (
              <>
                {isDirectVideoUrl(selectedVideo.video_url) ? (
                  <video
                    src={selectedVideo.video_url}
                    controls
                    autoPlay
                    className="w-full aspect-video rounded-lg bg-black"
                  >
                    Seu navegador não suporta a reprodução de vídeos.
                  </video>
                ) : getYouTubeId(selectedVideo.video_url) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo.video_url)}?autoplay=1`}
                    className="w-full aspect-video rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center aspect-video bg-muted rounded-lg">
                    <Video className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Formato de vídeo não suportado</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => window.open(selectedVideo.video_url, '_blank')}
                    >
                      Abrir em nova aba
                    </Button>
                  </div>
                )}
                {selectedVideo.description && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {selectedVideo.description}
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommerceTraining;

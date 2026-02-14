import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Video, 
  Loader2,
  BookOpen,
  Clock,
  GraduationCap,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TrainingVideo | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoMarkedRef = useRef(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (user) fetchProgress();
  }, [user]);

  // Reset auto-mark flag when selected video changes
  useEffect(() => {
    autoMarkedRef.current = false;
  }, [selectedVideo?.id]);

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

  const fetchProgress = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('training_video_progress')
      .select('video_id')
      .eq('user_id', user.id)
      .eq('completed', true);

    if (data) {
      setCompletedIds(new Set(data.map(d => d.video_id)));
    }
  };

  const toggleComplete = async (videoId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;

    const isCompleted = completedIds.has(videoId);
    const newSet = new Set(completedIds);

    if (isCompleted) {
      newSet.delete(videoId);
      setCompletedIds(newSet);
      await supabase
        .from('training_video_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);
    } else {
      newSet.add(videoId);
      setCompletedIds(newSet);
      await supabase
        .from('training_video_progress')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,video_id' });
    }
  };

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !selectedVideo || autoMarkedRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0 && currentTime / duration >= 0.98 && !completedIds.has(selectedVideo.id)) {
      autoMarkedRef.current = true;
      toggleComplete(selectedVideo.id);
    }
  }, [selectedVideo, completedIds]);

  const categories = [...new Set(videos.map(v => v.category))];
  const filteredVideos = activeCategory 
    ? videos.filter(v => v.category === activeCategory)
    : videos;

  const completedCount = videos.filter(v => completedIds.has(v.id)).length;
  const progressPercent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

  const getYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const isDirectVideoUrl = (url: string): boolean => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('.mov');
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

      {/* Progress Bar */}
      {videos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {completedCount} de {videos.length} vídeos concluídos
            </span>
            <span className="font-medium text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

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
            const isCompleted = completedIds.has(video.id);

            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group ${isCompleted ? 'border-emerald-500/40' : ''}`}
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="aspect-video bg-muted relative">
                    {thumbnail ? (
                      <img 
                        src={thumbnail} 
                        alt={video.title} 
                        className={`w-full h-full object-cover ${isCompleted ? 'opacity-70' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Completed overlay */}
                    {isCompleted && (
                      <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center pointer-events-none">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 drop-shadow-md" />
                      </div>
                    )}
                    {/* Play overlay */}
                    {!isCompleted && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                          <Play className="w-8 h-8 text-primary-foreground ml-1" />
                        </div>
                      </div>
                    )}
                    {/* Checkbox */}
                    <div 
                      className="absolute top-2 left-2 z-10"
                      onClick={(e) => toggleComplete(video.id, e)}
                    >
                      <Checkbox
                        checked={isCompleted}
                        className="h-5 w-5 border-2 border-white bg-black/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                    </div>
                    <Badge className="absolute top-2 right-2 capitalize">{video.category}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className={`font-semibold group-hover:text-primary transition-colors flex items-center gap-2 ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {video.title}
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      )}
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
              {selectedVideo && completedIds.has(selectedVideo.id) && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            {selectedVideo && (
              <>
                {isDirectVideoUrl(selectedVideo.video_url) ? (
                  <video
                    ref={videoRef}
                    src={selectedVideo.video_url}
                    controls
                    autoPlay
                    onTimeUpdate={handleTimeUpdate}
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
                {/* Manual mark button in modal */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <Checkbox
                    id="modal-complete"
                    checked={completedIds.has(selectedVideo.id)}
                    onCheckedChange={() => toggleComplete(selectedVideo.id)}
                    className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <label htmlFor="modal-complete" className="text-sm text-muted-foreground cursor-pointer">
                    Marcar como concluído
                  </label>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommerceTraining;

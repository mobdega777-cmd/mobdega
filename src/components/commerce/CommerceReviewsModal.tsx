import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User, Store, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  user_name: string;
  commerce_reply: string | null;
  commerce_reply_at: string | null;
}

interface CommerceReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commerceId: string;
}

const PAGE_SIZE = 10;

const CommerceReviewsModal = ({ open, onOpenChange, commerceId }: CommerceReviewsModalProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => {
    if (open) {
      setPage(0);
      fetchReviews(0);
    }
  }, [open, commerceId]);

  useEffect(() => {
    if (open) fetchReviews(page);
  }, [page]);

  const fetchReviews = async (p: number) => {
    setLoading(true);
    const from = p * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id, commerce_reply, commerce_reply_at', { count: 'exact' })
      .eq('commerce_id', commerceId)
      .order('created_at', { ascending: false })
      .range(from, to);

    setTotalCount(count || 0);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setReviews(data.map(r => ({
        ...r,
        user_name: profileMap.get(r.user_id) || 'Usuário',
        commerce_reply: (r as any).commerce_reply ?? null,
        commerce_reply_at: (r as any).commerce_reply_at ?? null,
      })));
    } else {
      setReviews([]);
    }
    setLoading(false);
  };

  const handleReply = async (reviewId: string) => {
    const text = replyTexts[reviewId]?.trim();
    if (!text) return;

    setSubmittingReply(reviewId);
    const { error } = await supabase
      .from('reviews')
      .update({ commerce_reply: text, commerce_reply_at: new Date().toISOString() } as any)
      .eq('id', reviewId);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao responder", description: error.message });
    } else {
      toast({ title: "Resposta enviada!" });
      setReplyTexts(prev => ({ ...prev, [reviewId]: "" }));
      fetchReviews(page);
    }
    setSubmittingReply(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Avaliações dos Clientes
            {totalCount > 0 && <span className="text-sm font-normal text-muted-foreground">({totalCount})</span>}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma avaliação recebida ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 space-y-3">
                {/* Review header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{review.user_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  ))}
                </div>

                {/* Comment */}
                {review.comment && <p className="text-sm">{review.comment}</p>}

                {/* Existing reply */}
                {review.commerce_reply && (
                  <div className="ml-4 p-3 bg-primary/5 border-l-2 border-primary rounded-r-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Store className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">Resposta do estabelecimento</span>
                      {review.commerce_reply_at && (
                        <span className="text-xs text-muted-foreground">
                          • {format(new Date(review.commerce_reply_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{review.commerce_reply}</p>
                  </div>
                )}

                {/* Reply input */}
                {!review.commerce_reply && (
                  <div className="ml-4 flex gap-2">
                    <Textarea
                      placeholder="Escreva sua resposta..."
                      value={replyTexts[review.id] || ""}
                      onChange={(e) => setReplyTexts(prev => ({ ...prev, [review.id]: e.target.value }))}
                      className="min-h-[60px] text-sm"
                    />
                    <Button
                      size="sm"
                      disabled={!replyTexts[review.id]?.trim() || submittingReply === review.id}
                      onClick={() => handleReply(review.id)}
                      className="self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} de {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommerceReviewsModal;

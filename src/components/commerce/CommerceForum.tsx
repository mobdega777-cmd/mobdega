import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Plus,
  MessageCircle,
  Eye,
  Clock,
  User,
  CheckCircle,
  Pin,
  Lightbulb,
  Bug,
  HelpCircle,
  Star,
  Search,
  Loader2,
  Send,
  ArrowLeft,
  MoreVertical,
  Trash2,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  category: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  author_type: string;
  commerce_id: string | null;
  is_pinned: boolean;
  is_closed: boolean;
  views_count: number;
  replies_count: number;
  likes_count: number;
  dislikes_count: number;
  last_reply_at: string | null;
  created_at: string;
}

interface ForumReply {
  id: string;
  topic_id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  author_type: string;
  commerce_id: string | null;
  is_solution: boolean;
  created_at: string;
}

interface CommerceForumProps {
  commerceId: string;
  commerceName: string;
  commerceLogo: string | null;
}

const categories = [
  { value: 'general', label: 'Geral', icon: MessageCircle },
  { value: 'suggestion', label: 'Sugestão', icon: Lightbulb },
  { value: 'bug', label: 'Problema', icon: Bug },
  { value: 'question', label: 'Dúvida', icon: HelpCircle },
  { value: 'feature', label: 'Nova Funcionalidade', icon: Star },
];

const CommerceForum = ({ commerceId, commerceName, commerceLogo }: CommerceForumProps) => {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [newTopic, setNewTopic] = useState({
    title: "",
    content: "",
    category: "general",
  });

  const [newReply, setNewReply] = useState("");
  const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike' | null>>({});

  useEffect(() => {
    fetchTopics();
    fetchUserVotes();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('forum_topics')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('last_reply_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching topics:', error);
    } else {
      setTopics(data || []);
    }
    setLoading(false);
  };

  const fetchUserVotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('forum_topic_votes')
      .select('topic_id, vote_type')
      .eq('user_id', user.id);
    
    const votesMap: Record<string, 'like' | 'dislike' | null> = {};
    data?.forEach(vote => {
      votesMap[vote.topic_id] = vote.vote_type as 'like' | 'dislike';
    });
    setUserVotes(votesMap);
  };

  const fetchReplies = async (topicId: string) => {
    setLoadingReplies(true);
    const { data, error } = await supabase
      .from('forum_replies')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching replies:', error);
    } else {
      setReplies(data || []);
    }
    setLoadingReplies(false);
  };

  const handleOpenTopic = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    await fetchReplies(topic.id);
    
    // Increment view count
    await supabase
      .from('forum_topics')
      .update({ views_count: topic.views_count + 1 })
      .eq('id', topic.id);
  };

  const handleCreateTopic = async () => {
    if (!user || !newTopic.title.trim() || !newTopic.content.trim()) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }

    setSubmitting(true);

    // Fetch user profile for name and avatar
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', user.id)
      .single();

    // Para comércios, usa o logo do comércio como avatar do autor
    const authorAvatarUrl = commerceLogo || profile?.avatar_url;

    const { error } = await supabase
      .from('forum_topics')
      .insert({
        title: newTopic.title,
        content: newTopic.content,
        category: newTopic.category,
        author_id: user.id,
        author_name: commerceName || profile?.full_name || 'Usuário',
        author_avatar_url: authorAvatarUrl,
        author_type: 'commerce',
        commerce_id: commerceId,
      });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao criar tópico", description: error.message });
    } else {
      toast({ title: "Tópico criado com sucesso!" });
      setShowNewTopicModal(false);
      setNewTopic({ title: "", content: "", category: "general" });
      fetchTopics();
    }

    setSubmitting(false);
  };

  const handleSubmitReply = async () => {
    if (!user || !selectedTopic || !newReply.trim()) {
      toast({ variant: "destructive", title: "Digite uma resposta" });
      return;
    }

    setSubmitting(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', user.id)
      .single();

    // Para comércios, usa o logo do comércio como avatar do autor
    const authorAvatarUrl = commerceLogo || profile?.avatar_url;

    const { error } = await supabase
      .from('forum_replies')
      .insert({
        topic_id: selectedTopic.id,
        content: newReply,
        author_id: user.id,
        author_name: commerceName || profile?.full_name || 'Usuário',
        author_avatar_url: authorAvatarUrl,
        author_type: 'commerce',
        commerce_id: commerceId,
      });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao enviar resposta", description: error.message });
    } else {
      setNewReply("");
      fetchReplies(selectedTopic.id);
      // Update local topic replies count
      setSelectedTopic(prev => prev ? { ...prev, replies_count: prev.replies_count + 1 } : null);
    }

    setSubmitting(false);
  };

  const getCategoryConfig = (category: string) => {
    const config = categories.find(c => c.value === category);
    return config || categories[0];
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || topic.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleVote = async (topicId: string, voteType: 'like' | 'dislike', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ variant: "destructive", title: "Faça login para votar" });
      return;
    }

    const currentVote = userVotes[topicId];
    
    if (currentVote === voteType) {
      // Remove vote
      await supabase
        .from('forum_topic_votes')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', user.id);
      setUserVotes(prev => ({ ...prev, [topicId]: null }));
    } else if (currentVote) {
      // Change vote
      await supabase
        .from('forum_topic_votes')
        .update({ vote_type: voteType })
        .eq('topic_id', topicId)
        .eq('user_id', user.id);
      setUserVotes(prev => ({ ...prev, [topicId]: voteType }));
    } else {
      // New vote
      await supabase
        .from('forum_topic_votes')
        .insert({
          topic_id: topicId,
          user_id: user.id,
          vote_type: voteType
        });
      setUserVotes(prev => ({ ...prev, [topicId]: voteType }));
    }
    
    // Refresh topics to get updated counts
    fetchTopics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Topic detail view
  if (selectedTopic) {
    const categoryConfig = getCategoryConfig(selectedTopic.category);
    const CategoryIcon = categoryConfig.icon;

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedTopic(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Fórum
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={selectedTopic.author_avatar_url || undefined} />
                <AvatarFallback>
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedTopic.is_pinned && (
                    <Pin className="w-4 h-4 text-primary" />
                  )}
                  <CardTitle className="text-xl">{selectedTopic.title}</CardTitle>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{selectedTopic.author_name}</span>
                  {selectedTopic.author_type === 'admin' && (
                    <Badge variant="default" className="text-xs">Admin</Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <CategoryIcon className="w-3 h-3" />
                    {categoryConfig.label}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(selectedTopic.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                  {/* Vote buttons */}
                  <button
                    onClick={(e) => handleVote(selectedTopic.id, 'like', e)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                      userVotes[selectedTopic.id] === 'like' 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs font-medium">{selectedTopic.likes_count || 0}</span>
                    <span className="text-xs hidden sm:inline">Concordo</span>
                  </button>
                  <button
                    onClick={(e) => handleVote(selectedTopic.id, 'dislike', e)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                      userVotes[selectedTopic.id] === 'dislike' 
                        ? 'bg-red-500/20 text-red-500' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-xs font-medium">{selectedTopic.dislikes_count || 0}</span>
                    <span className="text-xs hidden sm:inline">Não Concordo</span>
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{selectedTopic.content}</p>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Respostas ({selectedTopic.replies_count})
          </h3>

          {loadingReplies ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : replies.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma resposta ainda. Seja o primeiro a responder!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {replies.map((reply) => (
                <Card key={reply.id} className={reply.is_solution ? 'border-green-500 bg-green-500/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={reply.author_avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{reply.author_name}</span>
                          {reply.author_type === 'admin' && (
                            <Badge variant="default" className="text-xs">Admin</Badge>
                          )}
                          {reply.is_solution && (
                            <Badge className="bg-green-500 gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Solução
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{reply.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {!selectedTopic.is_closed && (
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={commerceLogo || undefined} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Escreva sua resposta..."
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleSubmitReply} disabled={submitting || !newReply.trim()}>
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Responder
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Topics list view
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="w-7 h-7" />
              Fórum da Comunidade
            </h1>
            <p className="text-muted-foreground text-sm">Discussões, sugestões e melhorias</p>
          </div>
          <Button onClick={() => setShowNewTopicModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Tópico
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tópicos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Topics List */}
      {filteredTopics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum tópico encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Seja o primeiro a iniciar uma discussão!
            </p>
            <Button onClick={() => setShowNewTopicModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Tópico
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTopics.map((topic) => {
            const categoryConfig = getCategoryConfig(topic.category);
            const CategoryIcon = categoryConfig.icon;

            return (
              <Card 
                key={topic.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleOpenTopic(topic)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={topic.author_avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {topic.is_pinned && (
                          <Pin className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <h3 className="font-semibold truncate">{topic.title}</h3>
                        <Badge variant="outline" className="gap-1 text-xs flex-shrink-0">
                          <CategoryIcon className="w-3 h-3" />
                          {categoryConfig.label}
                        </Badge>
                        {topic.author_type === 'admin' && (
                          <Badge variant="default" className="text-xs flex-shrink-0">Admin</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {topic.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{topic.author_name}</span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {topic.replies_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {topic.views_count}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        {/* Vote buttons in list */}
                        <button
                          onClick={(e) => handleVote(topic.id, 'like', e)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                            userVotes[topic.id] === 'like' 
                              ? 'bg-green-500/20 text-green-500' 
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span className="text-xs">{topic.likes_count || 0}</span>
                        </button>
                        <button
                          onClick={(e) => handleVote(topic.id, 'dislike', e)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                            userVotes[topic.id] === 'dislike' 
                              ? 'bg-red-500/20 text-red-500' 
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span className="text-xs">{topic.dislikes_count || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Topic Modal */}
      <Dialog open={showNewTopicModal} onOpenChange={setShowNewTopicModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Tópico
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="topic-title">Título</Label>
              <Input
                id="topic-title"
                placeholder="Resumo do seu tópico..."
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="topic-category">Categoria</Label>
              <Select 
                value={newTopic.category} 
                onValueChange={(value) => setNewTopic({ ...newTopic, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {cat.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="topic-content">Descrição</Label>
              <Textarea
                id="topic-content"
                placeholder="Descreva seu tópico em detalhes..."
                value={newTopic.content}
                onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTopicModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTopic} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Tópico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommerceForum;

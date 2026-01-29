-- Add like/dislike counters to forum_topics
ALTER TABLE public.forum_topics 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0;

-- Create table to track user votes
CREATE TABLE IF NOT EXISTS public.forum_topic_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topic_id, user_id)
);

-- Enable RLS
ALTER TABLE public.forum_topic_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for votes
CREATE POLICY "Anyone can view votes"
ON public.forum_topic_votes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.forum_topic_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote"
ON public.forum_topic_votes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote"
ON public.forum_topic_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Create a function to update counters
CREATE OR REPLACE FUNCTION public.update_topic_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE public.forum_topics SET likes_count = likes_count + 1 WHERE id = NEW.topic_id;
    ELSE
      UPDATE public.forum_topics SET dislikes_count = dislikes_count + 1 WHERE id = NEW.topic_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'like' THEN
      UPDATE public.forum_topics SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.topic_id;
    ELSE
      UPDATE public.forum_topics SET dislikes_count = GREATEST(dislikes_count - 1, 0) WHERE id = OLD.topic_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type != NEW.vote_type THEN
      IF OLD.vote_type = 'like' THEN
        UPDATE public.forum_topics SET likes_count = GREATEST(likes_count - 1, 0), dislikes_count = dislikes_count + 1 WHERE id = NEW.topic_id;
      ELSE
        UPDATE public.forum_topics SET dislikes_count = GREATEST(dislikes_count - 1, 0), likes_count = likes_count + 1 WHERE id = NEW.topic_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_topic_vote_counts ON public.forum_topic_votes;
CREATE TRIGGER trigger_update_topic_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON public.forum_topic_votes
FOR EACH ROW EXECUTE FUNCTION public.update_topic_vote_counts();
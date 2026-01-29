-- Create forum_topics table for discussions
CREATE TABLE public.forum_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  author_type TEXT NOT NULL DEFAULT 'commerce', -- 'commerce' or 'admin'
  commerce_id UUID REFERENCES public.commerces(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_replies table for topic replies
CREATE TABLE public.forum_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  author_type TEXT NOT NULL DEFAULT 'commerce', -- 'commerce' or 'admin'
  commerce_id UUID REFERENCES public.commerces(id) ON DELETE SET NULL,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Forum topics policies
-- Everyone with approved commerce or admin can view
CREATE POLICY "Approved commerces and admins can view forum topics"
ON public.forum_topics FOR SELECT
USING (
  public.is_master_admin() OR
  EXISTS (
    SELECT 1 FROM public.commerces c
    WHERE c.owner_id = auth.uid() AND c.status = 'approved'
  )
);

-- Commerce owners and admins can create topics
CREATE POLICY "Approved commerces and admins can create forum topics"
ON public.forum_topics FOR INSERT
WITH CHECK (
  author_id = auth.uid() AND (
    public.is_master_admin() OR
    EXISTS (
      SELECT 1 FROM public.commerces c
      WHERE c.owner_id = auth.uid() AND c.status = 'approved'
    )
  )
);

-- Authors can update their own topics
CREATE POLICY "Authors can update own forum topics"
ON public.forum_topics FOR UPDATE
USING (author_id = auth.uid() OR public.is_master_admin());

-- Authors and admins can delete topics
CREATE POLICY "Authors and admins can delete forum topics"
ON public.forum_topics FOR DELETE
USING (author_id = auth.uid() OR public.is_master_admin());

-- Forum replies policies
CREATE POLICY "Approved commerces and admins can view forum replies"
ON public.forum_replies FOR SELECT
USING (
  public.is_master_admin() OR
  EXISTS (
    SELECT 1 FROM public.commerces c
    WHERE c.owner_id = auth.uid() AND c.status = 'approved'
  )
);

CREATE POLICY "Approved commerces and admins can create forum replies"
ON public.forum_replies FOR INSERT
WITH CHECK (
  author_id = auth.uid() AND (
    public.is_master_admin() OR
    EXISTS (
      SELECT 1 FROM public.commerces c
      WHERE c.owner_id = auth.uid() AND c.status = 'approved'
    )
  )
);

CREATE POLICY "Authors can update own forum replies"
ON public.forum_replies FOR UPDATE
USING (author_id = auth.uid() OR public.is_master_admin());

CREATE POLICY "Authors and admins can delete forum replies"
ON public.forum_replies FOR DELETE
USING (author_id = auth.uid() OR public.is_master_admin());

-- Create trigger for auto-updating updated_at and replies_count
CREATE OR REPLACE FUNCTION public.update_forum_topic_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_topics
    SET replies_count = replies_count + 1,
        last_reply_at = NEW.created_at,
        updated_at = now()
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_topics
    SET replies_count = GREATEST(0, replies_count - 1),
        updated_at = now()
    WHERE id = OLD.topic_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER forum_reply_count_trigger
AFTER INSERT OR DELETE ON public.forum_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_forum_topic_on_reply();

-- Add index for performance
CREATE INDEX idx_forum_topics_category ON public.forum_topics(category);
CREATE INDEX idx_forum_topics_author ON public.forum_topics(author_id);
CREATE INDEX idx_forum_replies_topic ON public.forum_replies(topic_id);

-- Add columns to commerces for tax payment tracking
ALTER TABLE public.commerces
ADD COLUMN IF NOT EXISTS tax_paid_current_month BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_paid_at TIMESTAMP WITH TIME ZONE;
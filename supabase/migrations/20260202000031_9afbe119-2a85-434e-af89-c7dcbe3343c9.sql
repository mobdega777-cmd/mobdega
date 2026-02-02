-- Add is_solved field to forum_topics table for topic-level solution tracking
ALTER TABLE public.forum_topics 
ADD COLUMN IF NOT EXISTS is_solved boolean DEFAULT false;
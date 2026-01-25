-- Create table_sessions table
CREATE TABLE public.table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  commerce_id UUID NOT NULL REFERENCES public.commerces(id) ON DELETE CASCADE,
  bill_mode TEXT NOT NULL DEFAULT 'single' CHECK (bill_mode IN ('single', 'split')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opened_by_user_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);

-- Create table_participants table
CREATE TABLE public.table_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  customer_name TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_host BOOLEAN NOT NULL DEFAULT false
);

-- Add session_id to tables
ALTER TABLE public.tables ADD COLUMN session_id UUID REFERENCES public.table_sessions(id);

-- Add session_id to orders
ALTER TABLE public.orders ADD COLUMN session_id UUID REFERENCES public.table_sessions(id);

-- Enable RLS on new tables
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for table_sessions
CREATE POLICY "Anyone can view table sessions for a commerce"
ON public.table_sessions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create table sessions"
ON public.table_sessions FOR INSERT
WITH CHECK (auth.uid() = opened_by_user_id);

CREATE POLICY "Commerce owners can manage table sessions"
ON public.table_sessions FOR ALL
USING (is_commerce_owner_or_admin(commerce_id));

CREATE POLICY "Session participants can update session"
ON public.table_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.table_participants tp
    WHERE tp.session_id = table_sessions.id AND tp.user_id = auth.uid()
  )
);

-- RLS policies for table_participants
CREATE POLICY "Anyone can view table participants"
ON public.table_participants FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can join sessions"
ON public.table_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
ON public.table_participants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Commerce owners can manage participants"
ON public.table_participants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.table_sessions ts
    WHERE ts.id = table_participants.session_id 
    AND is_commerce_owner_or_admin(ts.commerce_id)
  )
);

-- Create index for performance
CREATE INDEX idx_table_sessions_table_id ON public.table_sessions(table_id);
CREATE INDEX idx_table_sessions_status ON public.table_sessions(status);
CREATE INDEX idx_table_participants_session_id ON public.table_participants(session_id);
CREATE INDEX idx_table_participants_user_id ON public.table_participants(user_id);
CREATE INDEX idx_orders_session_id ON public.orders(session_id);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_participants;
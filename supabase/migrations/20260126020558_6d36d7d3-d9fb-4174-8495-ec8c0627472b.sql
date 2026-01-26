-- Add column for plan upgrade requests
ALTER TABLE public.commerces ADD COLUMN IF NOT EXISTS requested_plan_id UUID REFERENCES public.plans(id);
ALTER TABLE public.commerces ADD COLUMN IF NOT EXISTS upgrade_request_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.commerces ADD COLUMN IF NOT EXISTS upgrade_request_status TEXT DEFAULT NULL;
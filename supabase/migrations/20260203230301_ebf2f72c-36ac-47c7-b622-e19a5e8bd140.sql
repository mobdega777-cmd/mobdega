-- Add employee mode configuration columns to commerces table
ALTER TABLE public.commerces 
ADD COLUMN IF NOT EXISTS employee_visible_menu_items text[] DEFAULT ARRAY['overview', 'cashregister', 'orders', 'delivery', 'tables']::text[],
ADD COLUMN IF NOT EXISTS management_password text;
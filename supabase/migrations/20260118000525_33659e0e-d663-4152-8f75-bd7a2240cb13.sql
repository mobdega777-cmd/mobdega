-- Add allowed_menu_items column to plans table to control which menu items are available per plan
ALTER TABLE public.plans 
ADD COLUMN allowed_menu_items jsonb DEFAULT '["overview", "cashregister", "orders", "delivery", "deliveryzones", "tables", "products", "categories", "financial", "settings"]'::jsonb;
-- Create tables enum for table status
CREATE TYPE public.table_status AS ENUM ('available', 'occupied', 'reserved', 'closed');

-- Create tables for restaurant/bar management
CREATE TABLE public.tables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    commerce_id UUID NOT NULL REFERENCES public.commerces(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    name TEXT,
    capacity INTEGER DEFAULT 4,
    status table_status DEFAULT 'available',
    current_order_id UUID,
    opened_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(commerce_id, number)
);

-- Create cash register (caixa) table
CREATE TABLE public.cash_registers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    commerce_id UUID NOT NULL REFERENCES public.commerces(id) ON DELETE CASCADE,
    opened_by UUID NOT NULL,
    closed_by UUID,
    opening_amount NUMERIC NOT NULL DEFAULT 0,
    closing_amount NUMERIC,
    expected_amount NUMERIC,
    difference NUMERIC,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash movements table for tracking individual transactions in the register
CREATE TABLE public.cash_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
    commerce_id UUID NOT NULL REFERENCES public.commerces(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sale', 'withdrawal', 'deposit', 'expense')),
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tables
CREATE POLICY "Commerce owners can manage tables"
ON public.tables
FOR ALL
USING (is_commerce_owner_or_admin(commerce_id));

-- RLS Policies for cash_registers
CREATE POLICY "Commerce owners can manage cash registers"
ON public.cash_registers
FOR ALL
USING (is_commerce_owner_or_admin(commerce_id));

-- RLS Policies for cash_movements
CREATE POLICY "Commerce owners can manage cash movements"
ON public.cash_movements
FOR ALL
USING (is_commerce_owner_or_admin(commerce_id));

-- Add triggers for updated_at
CREATE TRIGGER update_tables_updated_at
BEFORE UPDATE ON public.tables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add payment_method to orders for better tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add delivery-specific columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup', 'table'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES public.tables(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
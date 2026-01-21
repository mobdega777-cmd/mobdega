-- Create expenses table for fixed and variable costs
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commerce_id UUID NOT NULL REFERENCES public.commerces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'variable')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for commerce owners
CREATE POLICY "Commerce owners can manage expenses"
ON public.expenses
FOR ALL
USING (is_commerce_owner_or_admin(commerce_id));

-- Create index for better performance
CREATE INDEX idx_expenses_commerce_id ON public.expenses(commerce_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
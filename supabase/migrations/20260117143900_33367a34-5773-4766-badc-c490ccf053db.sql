-- =============================================
-- MOBDEGA - Complete Database Schema
-- =============================================

-- 1. Create ENUMs
CREATE TYPE public.app_role AS ENUM ('user', 'commerce', 'master_admin');
CREATE TYPE public.commerce_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE public.plan_type AS ENUM ('basic', 'startup', 'business');
CREATE TYPE public.invoice_type AS ENUM ('payable', 'receivable');
CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled');

-- 2. Create user_roles table (for secure role checking)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    document TEXT,
    cep TEXT,
    city TEXT,
    neighborhood TEXT,
    address TEXT,
    address_number TEXT,
    complement TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create plans table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type plan_type NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create commerces table
CREATE TABLE public.commerces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    fantasy_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('cpf', 'cnpj')),
    document TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    cep TEXT,
    city TEXT,
    neighborhood TEXT,
    address TEXT,
    address_number TEXT,
    complement TEXT,
    logo_url TEXT,
    plan_id UUID REFERENCES public.plans(id),
    status commerce_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commerce_id UUID REFERENCES public.commerces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commerce_id UUID REFERENCES public.commerces(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    promotional_price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commerce_id UUID REFERENCES public.commerces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    delivery_address TEXT,
    notes TEXT,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Create invoices table (for merchant billing)
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commerce_id UUID REFERENCES public.commerces(id) ON DELETE CASCADE,
    type invoice_type NOT NULL,
    reference_month TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    status invoice_status NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Create site_customizations table
CREATE TABLE public.site_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section TEXT NOT NULL UNIQUE,
    title TEXT,
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    cta_text TEXT,
    cta_link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 12. Create financial_transactions table
CREATE TABLE public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    commerce_id UUID REFERENCES public.commerces(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- SECURITY FUNCTIONS
-- =============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if current user is master admin
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'master_admin')
$$;

-- Function to check if user owns the commerce or is master admin
CREATE OR REPLACE FUNCTION public.is_commerce_owner_or_admin(_commerce_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_master_admin() OR EXISTS (
        SELECT 1 FROM public.commerces
        WHERE id = _commerce_id AND owner_id = auth.uid()
    )
$$;

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- user_roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Master admin can manage all roles" ON public.user_roles FOR ALL USING (public.is_master_admin());

-- profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.is_master_admin());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR public.is_master_admin());
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Master admin can delete profiles" ON public.profiles FOR DELETE USING (public.is_master_admin());

-- plans policies (public read, admin manage)
CREATE POLICY "Anyone can view active plans" ON public.plans FOR SELECT USING (is_active = true OR public.is_master_admin());
CREATE POLICY "Master admin can manage plans" ON public.plans FOR ALL USING (public.is_master_admin());

-- commerces policies
CREATE POLICY "Public can view approved commerces" ON public.commerces FOR SELECT USING (status = 'approved' OR owner_id = auth.uid() OR public.is_master_admin());
CREATE POLICY "Commerce owners can insert" ON public.commerces FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Commerce owners can update their own" ON public.commerces FOR UPDATE USING (owner_id = auth.uid() OR public.is_master_admin());
CREATE POLICY "Master admin can delete commerces" ON public.commerces FOR DELETE USING (public.is_master_admin());

-- categories policies
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = true OR public.is_commerce_owner_or_admin(commerce_id));
CREATE POLICY "Commerce owners can manage categories" ON public.categories FOR ALL USING (public.is_commerce_owner_or_admin(commerce_id));

-- products policies
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true OR public.is_commerce_owner_or_admin(commerce_id));
CREATE POLICY "Commerce owners can manage products" ON public.products FOR ALL USING (public.is_commerce_owner_or_admin(commerce_id));

-- orders policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (user_id = auth.uid() OR public.is_commerce_owner_or_admin(commerce_id));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Commerce owners can update orders" ON public.orders FOR UPDATE USING (public.is_commerce_owner_or_admin(commerce_id));
CREATE POLICY "Master admin can delete orders" ON public.orders FOR DELETE USING (public.is_master_admin());

-- order_items policies
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_commerce_owner_or_admin(orders.commerce_id)))
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- invoices policies
CREATE POLICY "Commerce owners can view their invoices" ON public.invoices FOR SELECT USING (public.is_commerce_owner_or_admin(commerce_id));
CREATE POLICY "Master admin can manage invoices" ON public.invoices FOR ALL USING (public.is_master_admin());

-- site_customizations policies (public read, admin manage)
CREATE POLICY "Anyone can view active customizations" ON public.site_customizations FOR SELECT USING (is_active = true OR public.is_master_admin());
CREATE POLICY "Master admin can manage customizations" ON public.site_customizations FOR ALL USING (public.is_master_admin());

-- financial_transactions policies
CREATE POLICY "Master admin can manage transactions" ON public.financial_transactions FOR ALL USING (public.is_master_admin());

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commerces_updated_at BEFORE UPDATE ON public.commerces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_customizations_updated_at BEFORE UPDATE ON public.site_customizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'), NEW.email);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ENABLE REALTIME FOR ORDERS
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Insert default plans
INSERT INTO public.plans (name, type, price, description, features, is_featured) VALUES
('Básico', 'basic', 90.00, 'Ideal para começar', '["PDV básico", "Controle de estoque", "Relatórios simples"]'::jsonb, false),
('Startup', 'startup', 180.00, 'Para negócios em crescimento', '["PDV completo", "Delivery", "Cardápio digital", "Relatórios avançados", "Destaque na vitrine"]'::jsonb, true),
('Business', 'business', 250.00, 'Solução completa', '["Tudo do Startup", "Multi-usuários", "API integração", "Suporte prioritário", "Destaque premium"]'::jsonb, false);

-- Insert default site customizations
INSERT INTO public.site_customizations (section, title, subtitle, description, cta_text, cta_link) VALUES
('hero', 'Sua Adega Digital', 'Peça bebidas e produtos de tabacaria com entrega rápida', 'Encontre as melhores adegas e tabacarias da sua região', 'Explorar Lojas', '/lojas'),
('benefits', 'Por que escolher o Mobdega?', NULL, 'Vantagens para clientes e comerciantes', NULL, NULL),
('featured', 'Lojas em Destaque', NULL, 'Conheça as melhores adegas e tabacarias', NULL, NULL);
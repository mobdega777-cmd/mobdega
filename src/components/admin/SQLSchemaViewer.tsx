import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const tableSchemas: { name: string; sql: string }[] = [
  {
    name: "enums",
    sql: `-- =============================================
-- ENUMS (criar primeiro)
-- =============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'commerce', 'master_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_type AS ENUM ('basic', 'intermediate', 'premium', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.commerce_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_type AS ENUM ('receivable', 'payable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.table_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`
  },
  {
    name: "profiles",
    sql: `CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  document text,
  birthday date,
  cep text,
  city text,
  neighborhood text,
  address text,
  address_number text,
  complement text,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "user_roles",
    sql: `CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);`
  },
  {
    name: "plans",
    sql: `CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  type plan_type NOT NULL,
  features jsonb,
  allowed_menu_items jsonb,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "commerces",
    sql: `CREATE TABLE IF NOT EXISTS public.commerces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  fantasy_name text NOT NULL,
  owner_name text NOT NULL,
  document_type text NOT NULL,
  document text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  cep text,
  city text,
  neighborhood text,
  address text,
  address_number text,
  complement text,
  logo_url text,
  cover_url text,
  whatsapp text,
  instagram_url text,
  facebook_url text,
  status commerce_status NOT NULL DEFAULT 'pending',
  plan_id uuid REFERENCES public.plans(id),
  requested_plan_id uuid REFERENCES public.plans(id),
  upgrade_request_status text,
  upgrade_request_date timestamptz,
  is_open boolean DEFAULT true,
  opening_hours jsonb,
  delivery_enabled boolean DEFAULT true,
  table_payment_required boolean NOT NULL DEFAULT true,
  coupon_code varchar,
  login_password text,
  management_password text,
  force_password_change boolean DEFAULT false,
  temp_password_set_at timestamptz,
  employee_visible_menu_items text[] DEFAULT ARRAY['overview','cashregister','orders','delivery','tables'],
  auto_invoice_enabled boolean DEFAULT false,
  auto_invoice_day integer DEFAULT 5,
  payment_due_day integer DEFAULT 10,
  tax_type text DEFAULT 'percentage',
  tax_regime text DEFAULT 'simples',
  tax_value numeric DEFAULT 0,
  tax_payment_day integer DEFAULT 20,
  tax_paid_current_month boolean DEFAULT false,
  tax_paid_at timestamptz,
  rejection_reason text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "categories",
    sql: `CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  name text NOT NULL,
  description text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "products",
    sql: `CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  category_id uuid REFERENCES public.categories(id),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  promotional_price numeric,
  image_url text,
  stock integer,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_composite boolean DEFAULT false,
  is_fractioned boolean DEFAULT false,
  fraction_total numeric,
  fraction_per_serving numeric,
  fraction_unit text,
  cost_per_serving numeric,
  hide_from_menu boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "composite_product_items",
    sql: `CREATE TABLE IF NOT EXISTS public.composite_product_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  composite_product_id uuid NOT NULL REFERENCES public.products(id),
  component_product_id uuid NOT NULL REFERENCES public.products(id),
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);`
  },
  {
    name: "tables",
    sql: `CREATE TABLE IF NOT EXISTS public.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  number integer NOT NULL,
  name text,
  capacity integer DEFAULT 4,
  status table_status DEFAULT 'available',
  current_order_id uuid,
  session_id uuid,
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "table_sessions",
    sql: `CREATE TABLE IF NOT EXISTS public.table_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.tables(id),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  opened_by_user_id uuid,
  bill_mode text NOT NULL DEFAULT 'single',
  status text NOT NULL DEFAULT 'active',
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);`
  },
  {
    name: "table_participants",
    sql: `CREATE TABLE IF NOT EXISTS public.table_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.table_sessions(id),
  user_id uuid NOT NULL,
  customer_name text,
  is_host boolean NOT NULL DEFAULT false,
  bill_requested boolean DEFAULT false,
  bill_requested_at timestamptz,
  selected_payment_method text,
  change_for numeric DEFAULT NULL,
  joined_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "invoices",
    sql: `CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid REFERENCES public.commerces(id),
  type invoice_type NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  reference_month text NOT NULL,
  status invoice_status NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_confirmed_by_commerce boolean DEFAULT false,
  payment_confirmed_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "orders",
    sql: `CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  user_id uuid NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  order_type text DEFAULT 'delivery',
  subtotal numeric NOT NULL,
  delivery_fee numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  coupon_code text,
  coupon_discount numeric DEFAULT 0,
  total numeric NOT NULL,
  payment_method text,
  delivery_address text,
  customer_name text,
  customer_phone text,
  notes text,
  table_id uuid REFERENCES public.tables(id),
  session_id uuid REFERENCES public.table_sessions(id),
  stock_deducted boolean NOT NULL DEFAULT false,
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "order_items",
    sql: `CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  product_id uuid REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "reviews",
    sql: `CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  rating integer NOT NULL,
  comment text,
  commerce_reply text,
  commerce_reply_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "favorites",
    sql: `CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  created_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "cash_registers",
    sql: `CREATE TABLE IF NOT EXISTS public.cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  opened_by uuid NOT NULL,
  closed_by uuid,
  opening_amount numeric NOT NULL DEFAULT 0,
  closing_amount numeric,
  expected_amount numeric,
  difference numeric,
  status text NOT NULL DEFAULT 'open',
  notes text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "cash_movements",
    sql: `CREATE TABLE IF NOT EXISTS public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id uuid NOT NULL REFERENCES public.cash_registers(id),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  type text NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  description text,
  order_id uuid REFERENCES public.orders(id),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "expenses",
    sql: `CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  name text NOT NULL,
  type text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  is_paid boolean DEFAULT false,
  paid_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "financial_transactions",
    sql: `CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  commerce_id uuid REFERENCES public.commerces(id),
  invoice_id uuid REFERENCES public.invoices(id),
  created_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "payment_methods",
    sql: `CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'custom',
  fee_percentage numeric DEFAULT 0,
  fee_fixed numeric DEFAULT 0,
  pix_key text,
  pix_key_type text,
  pix_qr_code_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "delivery_zones",
    sql: `CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  name text NOT NULL,
  cep_start text NOT NULL,
  cep_end text NOT NULL,
  delivery_fee numeric NOT NULL DEFAULT 0,
  estimated_time integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "commerce_coupons",
    sql: `CREATE TABLE IF NOT EXISTS public.commerce_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  code varchar NOT NULL,
  description text,
  discount_type varchar NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_value numeric,
  max_discount numeric,
  max_uses integer,
  used_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  first_order_only boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "discount_coupons",
    sql: `CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar NOT NULL,
  description text,
  discount_type varchar NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  plan_ids text[],
  custom_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "billing_config",
    sql: `CREATE TABLE IF NOT EXISTS public.billing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pix_key text NOT NULL,
  pix_key_type text NOT NULL DEFAULT 'cnpj',
  qr_code_url text,
  bank_name text,
  account_holder text NOT NULL,
  cnpj text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "admin_notifications",
    sql: `CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  commerce_id uuid REFERENCES public.commerces(id),
  invoice_id uuid REFERENCES public.invoices(id),
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "commerce_notifications",
    sql: `CREATE TABLE IF NOT EXISTS public.commerce_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id),
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "commerce_photos",
    sql: `CREATE TABLE IF NOT EXISTS public.commerce_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id uuid NOT NULL REFERENCES public.commerces(id),
  image_url text NOT NULL,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "site_customizations",
    sql: `CREATE TABLE IF NOT EXISTS public.site_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  title text,
  subtitle text,
  description text,
  image_url text,
  cta_text text,
  cta_link text,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "training_videos",
    sql: `CREATE TABLE IF NOT EXISTS public.training_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  category text DEFAULT 'geral',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "training_video_progress",
    sql: `CREATE TABLE IF NOT EXISTS public.training_video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.training_videos(id),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);`
  },
  {
    name: "forum_topics",
    sql: `CREATE TABLE IF NOT EXISTS public.forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  author_avatar_url text,
  author_type text NOT NULL DEFAULT 'commerce',
  commerce_id uuid REFERENCES public.commerces(id),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  is_pinned boolean DEFAULT false,
  is_closed boolean DEFAULT false,
  is_solved boolean DEFAULT false,
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  dislikes_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  last_reply_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "forum_replies",
    sql: `CREATE TABLE IF NOT EXISTS public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id),
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  author_avatar_url text,
  author_type text NOT NULL DEFAULT 'commerce',
  commerce_id uuid REFERENCES public.commerces(id),
  content text NOT NULL,
  is_solution boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "forum_topic_votes",
    sql: `CREATE TABLE IF NOT EXISTS public.forum_topic_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id),
  user_id uuid NOT NULL,
  vote_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);`
  },
  {
    name: "system_updates",
    sql: `CREATE TABLE IF NOT EXISTS public.system_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'update',
  module text NOT NULL,
  description text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);`
  },
];

const SQLSchemaViewer = () => {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const { toast } = useToast();

  const fullSQL = tableSchemas.map(t => t.sql).join('\n\n');

  const copyToClipboard = async (text: string, tableName?: string) => {
    await navigator.clipboard.writeText(text);
    if (tableName) {
      setCopiedTable(tableName);
      setTimeout(() => setCopiedTable(null), 2000);
    }
    toast({ title: 'Copiado!', description: tableName ? `SQL de "${tableName}" copiado.` : 'SQL completo copiado para a área de transferência.' });
  };

  return (
    <div className="space-y-4">
      {/* Copy All Button */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              SQL Schema — {tableSchemas.length} Tabelas
            </CardTitle>
            <Button size="sm" onClick={() => copyToClipboard(fullSQL)} className="gap-2">
              <Copy className="w-4 h-4" />
              Copiar Tudo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Clique em uma tabela para expandir o SQL. Use "Copiar Tudo" para obter o schema completo.
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {tableSchemas.map((table) => {
                const isExpanded = expandedTable === table.name;
                const isCopied = copiedTable === table.name;

                return (
                  <div key={table.name} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedTable(isExpanded ? null : table.name)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-mono text-sm font-medium text-foreground">
                          {table.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono">
                        TABLE
                      </Badge>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/20 p-3">
                        <div className="flex justify-end mb-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(table.sql, table.name);
                            }}
                            className="gap-2 text-xs"
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {isCopied ? 'Copiado!' : 'Copiar'}
                          </Button>
                        </div>
                        <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap bg-background rounded-md p-3 border border-border overflow-x-auto">
                          {table.sql}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SQLSchemaViewer;

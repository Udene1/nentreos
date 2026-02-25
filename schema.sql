-- ============================================
-- NAIJA STARTUP OS - Unified Database Schema
-- Combines ChaseAI, Tax1, and Track-it
-- ============================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CORE USER INFRASTRUCTURE
-- ============================================

-- Table public.users (extends auth.users with app-specific metadata)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'monthly', 'early-bird', 'lifetime')),
  subscription_status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  default_currency TEXT DEFAULT 'NGN',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INVENTORY & PRODUCT MANAGEMENT (Track-it)
-- ============================================

CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 0, -- Total in base_unit
  price DECIMAL(12, 2) DEFAULT 0.00, -- Selling price per base_unit
  barcode TEXT,
  category TEXT,
  base_unit TEXT DEFAULT 'Piece',
  packaging_unit TEXT,
  units_per_package INTEGER DEFAULT 1,
  weighted_avg_cost DECIMAL(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. SALES & PURCHASES (Tax1 / Track-it)
-- ============================================

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity_purchased INTEGER NOT NULL,
  unit_type TEXT DEFAULT 'base',
  unit_quantity INTEGER,
  cost DECIMAL(12, 2) NOT NULL,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  supplier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity_sold INTEGER NOT NULL,
  unit_type TEXT DEFAULT 'base',
  unit_quantity INTEGER,
  total_amount DECIMAL(12, 2) NOT NULL,
  cost_at_sale DECIMAL(12, 2) DEFAULT 0.00,
  valuation_method_used TEXT DEFAULT 'FIFO',
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT,
  invoice_id UUID, -- References public.invoices if formal
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FIFO Management
CREATE TABLE IF NOT EXISTS public.stock_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity_initial INTEGER NOT NULL,
  quantity_remaining INTEGER NOT NULL,
  unit_cost DECIMAL(12, 2) NOT NULL,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. FINANCIAL CRM & INVOICING (ChaseAI)
-- ============================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp_enabled BOOLEAN DEFAULT false,
  history_notes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  due_date DATE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'overdue', 'paid', 'cancelled')),
  pdf_url TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. AI CHASER & NOTIFICATIONS (ChaseAI)
-- ============================================

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('email', 'sms', 'whatsapp')),
  escalation_level INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 3),
  scheduled_date TIMESTAMPTZ,
  sent_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  ai_message TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. SYSTEM LOGS & SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  changed_by UUID REFERENCES public.users(id),
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  valuation_method TEXT DEFAULT 'FIFO' CHECK (valuation_method IN ('FIFO', 'WAC')),
  barcode_enabled BOOLEAN DEFAULT TRUE,
  business_name TEXT,
  tin TEXT,
  address TEXT,
  vat_rate DECIMAL(4, 2) DEFAULT 7.50,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TAX1 EXTENSIONS (Enterprise Monolith)
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  receipt_url TEXT,
  expense_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  gross_salary DECIMAL(12, 2) NOT NULL,
  paye_tax DECIMAL(12, 2) DEFAULT 0.00,
  pension DECIMAL(12, 2) DEFAULT 0.00,
  net_salary DECIMAL(12, 2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fixed_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost DECIMAL(12, 2) NOT NULL,
  acquisition_date DATE DEFAULT CURRENT_DATE,
  depreciation_rate DECIMAL(5, 2) DEFAULT 0.00, -- Annual rate in %
  category TEXT, -- e.g., 'Furniture', 'IT', 'Motor'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. RLS POLICIES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;

-- Shared Policy Pattern
CREATE POLICY "Users can manage their own data" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own items" ON public.items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own purchases" ON public.purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sales" ON public.sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own stock_batches" ON public.stock_batches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own invoices" ON public.invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own app_settings" ON public.app_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own expenses" ON public.business_expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own payroll" ON public.payroll FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own assets" ON public.fixed_assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view reminders for own invoices" ON public.reminders FOR SELECT USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid())
);

-- ============================================
-- 8. TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_business_expenses_updated_at BEFORE UPDATE ON public.business_expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON public.payroll FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_fixed_assets_updated_at BEFORE UPDATE ON public.fixed_assets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  
  -- Create default settings
  INSERT INTO public.app_settings (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for purchases: update items quantity and weighted average cost
CREATE OR REPLACE FUNCTION handle_purchase_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_total_qty INTEGER;
    v_old_qty INTEGER;
    v_old_wac DECIMAL(12,2);
    v_new_unit_cost DECIMAL(12,2);
BEGIN
    -- 1. Calculate new WAC before updating quantity
    SELECT quantity, weighted_avg_cost INTO v_old_qty, v_old_wac 
    FROM items WHERE id = NEW.item_id;
    
    v_new_unit_cost := NEW.cost / NEW.quantity_purchased;
    v_total_qty := v_old_qty + NEW.quantity_purchased;
    
    -- Recalculate WAC: ((old_qty * old_wac) + (new_qty * new_cost)) / total_qty
    IF v_total_qty > 0 THEN
        UPDATE items 
        SET 
            quantity = v_total_qty,
            weighted_avg_cost = ((v_old_qty * v_old_wac) + (NEW.quantity_purchased * v_new_unit_cost)) / v_total_qty
        WHERE id = NEW.item_id;
    ELSE
        UPDATE items SET quantity = v_total_qty WHERE id = NEW.item_id;
    END IF;

    -- 2. Insert into stock_batches for FIFO
    INSERT INTO stock_batches (item_id, quantity_initial, quantity_remaining, unit_cost, purchase_id, user_id)
    VALUES (NEW.item_id, NEW.quantity_purchased, NEW.quantity_purchased, v_new_unit_cost, NEW.id, NEW.user_id);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER purchase_stock_trigger AFTER INSERT ON purchases FOR EACH ROW EXECUTE PROCEDURE handle_purchase_stock();

-- Function for FIFO Stock Consumption (COGS Calculation)
CREATE OR REPLACE FUNCTION consume_stock_batches(
    p_item_id UUID,
    p_quantity_to_sell INTEGER,
    p_user_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
    v_remaining_to_consume INTEGER := p_quantity_to_sell;
    v_total_cost NUMERIC := 0;
    v_batch RECORD;
    v_consume_qty INTEGER;
BEGIN
    FOR v_batch IN 
        SELECT id, quantity_remaining, unit_cost 
        FROM stock_batches 
        WHERE item_id = p_item_id AND user_id = p_user_id AND quantity_remaining > 0
        ORDER BY created_at ASC -- FIFO logic
    LOOP
        IF v_remaining_to_consume <= 0 THEN
            EXIT;
        END IF;

        v_consume_qty := LEAST(v_batch.quantity_remaining, v_remaining_to_consume);
        
        -- Update the batch
        UPDATE stock_batches 
        SET quantity_remaining = quantity_remaining - v_consume_qty
        WHERE id = v_batch.id;

        -- Add to total cost
        v_total_cost := v_total_cost + (v_consume_qty * v_batch.unit_cost);
        
        -- Update remaining to consume
        v_remaining_to_consume := v_remaining_to_consume - v_consume_qty;
    END LOOP;

    IF v_remaining_to_consume > 0 THEN
        RAISE EXCEPTION 'Not enough stock in batches for FIFO calculation';
    END IF;

    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sales: update items quantity
CREATE OR REPLACE FUNCTION handle_sale_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE items SET quantity = quantity - NEW.quantity_sold WHERE id = NEW.item_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sale_stock_trigger AFTER INSERT ON sales FOR EACH ROW EXECUTE PROCEDURE handle_sale_stock();

-- Nexus Integration Audit Table
CREATE TABLE IF NOT EXISTS public.audit_integration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for audit_integration
ALTER TABLE public.audit_integration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integration logs"
  ON public.audit_integration FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration logs"
  ON public.audit_integration FOR INSERT
  WITH CHECK (auth.uid() = user_id);

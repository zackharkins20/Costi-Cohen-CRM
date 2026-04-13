-- Costi Cohen CRM — Supabase Database Migration
-- Run this in your Supabase SQL editor (new project)

-- ── Users ──
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id text NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'Agent',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON users
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Contacts ──
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  type text NOT NULL DEFAULT 'client',
  stage text NOT NULL DEFAULT 'lead',
  asset_type text,
  budget_min numeric,
  budget_max numeric,
  fee_percentage numeric,
  brief_notes text,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON contacts
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Deals ──
CREATE TABLE deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  stage text NOT NULL DEFAULT 'lead',
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  deal_value numeric,
  fee_percentage numeric,
  fee_amount numeric,
  description text,
  created_by uuid REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON deals
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Deal Property Details ──
CREATE TABLE deal_property_details (
  deal_id uuid PRIMARY KEY REFERENCES deals(id) ON DELETE CASCADE,
  mandate_brief text,
  properties_sent jsonb DEFAULT '[]'::jsonb,
  purchase_price numeric,
  gst_amount numeric,
  exchange_date date,
  settlement_date date
);

ALTER TABLE deal_property_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON deal_property_details
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Tasks ──
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  type text NOT NULL DEFAULT 'general',
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES users(id),
  due_date date,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON tasks
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Activities ──
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON activities
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Document Links ──
CREATE TABLE document_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON document_links
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Notifications ──
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  entity_type text,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON notifications
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Auto-create user profile on signup ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, full_name)
  VALUES (NEW.id::text, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Indexes ──
CREATE INDEX idx_contacts_stage ON contacts(stage);
CREATE INDEX idx_contacts_created_by ON contacts(created_by);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deal_id ON tasks(deal_id);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);

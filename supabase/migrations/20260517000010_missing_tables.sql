-- Eksik tablolar: customer_branding ve internal_notes

-- ─── White-Label / Marka Ayarları ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  logo_url text,
  company_name text,
  primary_color text NOT NULL DEFAULT '#4F46E5',
  secondary_color text NOT NULL DEFAULT '#7C3AED',
  footer_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: yalnızca admin ve ilgili müşteri
ALTER TABLE customer_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_branding" ON customer_branding
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
  );

CREATE POLICY "customer_own_branding" ON customer_branding
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE profile_id = auth.uid()
    )
  );

COMMENT ON TABLE customer_branding IS 'Müşteri başına beyaz etiket (white-label) marka ayarları';

-- ─── Dahili Notlar (Internal Notes) ─────────────────────────────────────────
-- Müşteri veya ticket gibi herhangi bir entity'e eklenebilen iç notlar
CREATE TABLE IF NOT EXISTS internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,     -- 'customer' | 'ticket' | 'invoice' | 'hosting'
  entity_id uuid NOT NULL,       -- İlgili kayıt ID'si
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hız için index
CREATE INDEX IF NOT EXISTS idx_internal_notes_entity
  ON internal_notes(entity_type, entity_id, is_pinned DESC, created_at DESC);

-- RLS: sadece admin ve employee görebilir/yazabilir
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_internal_notes" ON internal_notes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
  );

COMMENT ON TABLE internal_notes IS 'Admin/çalışan iç notları — müşteriler göremez';
COMMENT ON COLUMN internal_notes.entity_type IS 'customer | ticket | invoice | hosting | domain';

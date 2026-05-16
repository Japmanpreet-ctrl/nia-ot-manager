-- Run this in Supabase SQL Editor to enable OT Linen Management

CREATE TABLE IF NOT EXISTS ot_linen_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name           VARCHAR(255) NOT NULL,
  category            VARCHAR(100) NOT NULL,
  quantity_available  INTEGER NOT NULL DEFAULT 0,
  in_laundry          INTEGER NOT NULL DEFAULT 0,
  damaged             INTEGER NOT NULL DEFAULT 0,
  minimum_threshold   INTEGER NOT NULL DEFAULT 0,
  unit                VARCHAR(50) DEFAULT 'pieces',
  status              VARCHAR(50) NOT NULL DEFAULT 'Available',
  notes               TEXT,
  is_deleted          BOOLEAN DEFAULT false,
  created_by_uid      VARCHAR(128),
  created_by_name     VARCHAR(255),
  updated_by_uid      VARCHAR(128),
  updated_by_name     VARCHAR(255),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ot_linen_laundry_logs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  linen_item_id         UUID REFERENCES ot_linen_items(id),
  quantity_sent         INTEGER NOT NULL,
  date_sent             DATE NOT NULL,
  expected_return_date  DATE NOT NULL,
  returned_quantity     INTEGER DEFAULT 0,
  pending_quantity      INTEGER DEFAULT 0,
  laundry_status        VARCHAR(50) DEFAULT 'Sent', -- Sent, Partially Returned, Returned, Lost
  notes                 TEXT,
  sent_by_uid           VARCHAR(128),
  sent_by_name          VARCHAR(255),
  updated_by_uid        VARCHAR(128),
  updated_by_name       VARCHAR(255),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ot_linen_audit_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  linen_item_id     UUID REFERENCES ot_linen_items(id),
  action            VARCHAR(100) NOT NULL, -- created, updated, deleted, laundry_sent, laundry_returned
  quantity_change   INTEGER,
  old_values        JSONB,
  new_values        JSONB,
  performed_by_uid  VARCHAR(128),
  performed_by_name VARCHAR(255),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_linen_items_category ON ot_linen_items(category);
CREATE INDEX IF NOT EXISTS idx_linen_items_status ON ot_linen_items(status);
CREATE INDEX IF NOT EXISTS idx_laundry_logs_item ON ot_linen_laundry_logs(linen_item_id);
CREATE INDEX IF NOT EXISTS idx_laundry_logs_status ON ot_linen_laundry_logs(laundry_status);
CREATE INDEX IF NOT EXISTS idx_linen_audit_item ON ot_linen_audit_logs(linen_item_id);

-- RLS
ALTER TABLE ot_linen_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_linen_laundry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_linen_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_linen_items" ON ot_linen_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_laundry_logs" ON ot_linen_laundry_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_linen_audit" ON ot_linen_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

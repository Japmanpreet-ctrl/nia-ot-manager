
-- SQL to create the ot_operations table for storing daily operations data
-- and master stock/articles registers.

CREATE TABLE IF NOT EXISTS ot_operations (
  date TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Enable RLS (Row Level Security) if needed, or leave open for internal use.
-- For now, we assume the backend service role key handles access.
ALTER TABLE ot_operations DISABLE ROW LEVEL SECURITY;

-- Optional: Seed initial data if table is empty
-- This will be handled by the backend controller if it finds no data.

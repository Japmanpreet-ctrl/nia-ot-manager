# NIA OT Manager - Setup Guide

## Prerequisites
- Node.js 18+
- Firebase project configured (`nia-jaipur`)
- Supabase project configured

## Step 1: Database Setup
Run this SQL in your Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid    VARCHAR(128) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  full_name       VARCHAR(100) NOT NULL DEFAULT '',
  role            VARCHAR(20) NOT NULL DEFAULT 'data_entry'
                  CHECK (role IN ('admin', 'doctor', 'nurse', 'data_entry')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ot_records (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opd_number          VARCHAR(50),
  ipd_number          VARCHAR(50),
  patient_name        VARCHAR(100) NOT NULL,
  gender              VARCHAR(10) NOT NULL CHECK (gender IN ('Male','Female','Other')),
  age                 INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  diagnosis           TEXT NOT NULL,
  surgical_procedure  TEXT NOT NULL,
  anesthesia_type     VARCHAR(100) NOT NULL,
  ot_date             DATE NOT NULL,
  ot_start_time       TIME NOT NULL,
  final_case_time     TIME,
  consultant_name     VARCHAR(100) NOT NULL,
  anesthetist_name    VARCHAR(100) NOT NULL,
  first_assistant     VARCHAR(100),
  second_assistant    VARCHAR(100),
  notes               TEXT,
  created_by_uid      VARCHAR(128),
  created_by_name     VARCHAR(100),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ot_records_date ON ot_records(ot_date);
CREATE INDEX idx_ot_records_patient ON ot_records(patient_name);
CREATE INDEX idx_ot_records_consultant ON ot_records(consultant_name);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON ot_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE ot_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON ot_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_users" ON users
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

## Step 2: Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Replace `FIREBASE_SERVICE_ACCOUNT_JSON` in `backend/.env` with your Firebase Admin service account JSON serialized as one line.

## Step 3: Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Step 4: First Admin User
1. Log in through the app. The backend auto-registers the user as `data_entry`.
2. Go to Supabase -> Table Editor -> `users`.
3. Find your user and change `role` to `admin`.
4. Refresh the app. Admin Panel becomes visible.

## Firebase Console (required for email sign-in)

1. **Authorized domains** — In [Firebase Console](https://console.firebase.google.com) → your project → **Authentication** → **Settings** → **Authorized domains**, add every hostname users open the app on, for example:
   - `nia-ot-manager.vercel.app`
   - Your custom domain (if any)
   - `localhost` (usually already listed for local dev)

   If you see **`auth/unauthorized-continue-uri`**, the domain in the verification redirect URL is missing here.

2. **Verification redirect URL (optional)** — If you set `VITE_EMAIL_VERIFICATION_CONTINUE_URL` on Vercel, that URL’s **hostname** must be listed under Authorized domains. If you omit it, Firebase uses its default verification page (no custom domain to allowlist). To land users on your app after verification, set the variable and add the domain.

## Deployment

Single **Vercel** project: static frontend plus `/api` serverless routes. Set frontend env vars on Vercel (including Supabase/Firebase client keys), backend secrets for API routes (`SUPABASE_*`, `FIREBASE_SERVICE_ACCOUNT_JSON`), and institute email policy if you override defaults:

- `ALLOWED_EMAIL_DOMAINS` — comma-separated, should match `VITE_ALLOWED_EMAIL_DOMAINS` when used.
- `VITE_EMAIL_VERIFICATION_CONTINUE_URL` — see above.

-- ============================================
-- ZenHabit AI - Payment System Database Migration
-- Phase 1: Critical Payment Infrastructure
-- Run this after supabase-setup.sql
-- ============================================

-- 1. Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('pro', 'master')),
  cycle VARCHAR(20) NOT NULL CHECK (cycle IN ('monthly', 'yearly')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('stripe', 'momo', 'zalopay')),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  provider_transaction_id VARCHAR(255),
  provider_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON payment_transactions(provider_transaction_id);

-- 2. Add subscription fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'expired')),
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS subscription_renewal_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_method_last_used VARCHAR(20) CHECK (payment_method_last_used IN ('stripe', 'momo', 'zalopay'));

-- 3. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for payment_transactions updated_at
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS on payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for payment_transactions
-- Note: Adjust these policies based on your auth setup
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can insert own payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (true); -- Adjust based on your auth setup

CREATE POLICY "Service role can update payment transactions"
  ON payment_transactions FOR UPDATE
  USING (true); -- Adjust based on your auth setup

-- ============================================
-- Optional: If using Supabase Auth, use these policies instead:
-- ============================================
-- CREATE POLICY "Users can view own payment transactions"
--   ON payment_transactions FOR SELECT
--   USING (auth.uid()::text = user_id);
--
-- CREATE POLICY "Users can insert own payment transactions"
--   ON payment_transactions FOR INSERT
--   WITH CHECK (auth.uid()::text = user_id);
--
-- CREATE POLICY "Service role can update payment transactions"
--   ON payment_transactions FOR UPDATE
--   USING (auth.role() = 'service_role');

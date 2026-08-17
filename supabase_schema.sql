-- Kwacha Escrow Database Schema
-- Run this in your Supabase SQL editor

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  wallet_address_trc20 TEXT,
  wallet_address_bsc TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
  reputation_score DECIMAL(3,2) DEFAULT 0,
  total_trades INT DEFAULT 0,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sell', 'buy')),
  amount DECIMAL(18,2) NOT NULL,
  rate DECIMAL(18,2) NOT NULL,
  min_amount DECIMAL(18,2) DEFAULT 10,
  max_amount DECIMAL(18,2),
  payment_methods TEXT[] NOT NULL DEFAULT '{}',
  network TEXT NOT NULL CHECK (network IN ('trc20', 'bsc')),
  wallet_address TEXT,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id TEXT NOT NULL UNIQUE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(18,2) NOT NULL,
  rate DECIMAL(18,2) NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('trc20', 'bsc')),
  payment_method TEXT,
  escrow_address TEXT,
  escrow_tx_hash TEXT,
  release_tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'escrow_pending', 'payment_pending', 'payment_sent', 'confirming', 'completed', 'cancelled', 'disputed'
  )),
  payment_proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id INT PRIMARY KEY DEFAULT 1,
  escrow_fee_percent DECIMAL(5,2) DEFAULT 0.80,
  escrow_wallet_trc20 TEXT,
  escrow_wallet_bsc TEXT,
  min_trade_amount DECIMAL(18,2) DEFAULT 10,
  max_trade_amount DECIMAL(18,2) DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: users can see all profiles (for reputation), update only their own
CREATE POLICY "Profiles are visible to all" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Offers: all authenticated users can see active offers, seller can manage own
CREATE POLICY "Offers visible to authenticated users" ON offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own offers" ON offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users update own offers" ON offers FOR UPDATE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Users delete own offers" ON offers FOR DELETE TO authenticated USING (auth.uid() = seller_id);

-- Trades: participants can see and update their trades
CREATE POLICY "Trade participants can view" ON trades FOR SELECT TO authenticated USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);
CREATE POLICY "Trade participants can update" ON trades FOR UPDATE TO authenticated USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);
CREATE POLICY "Buyers can create trades" ON trades FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Disputes: trade participants can view and create disputes
CREATE POLICY "Dispute participants can view" ON disputes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM trades WHERE trades.id = disputes.trade_id AND (trades.buyer_id = auth.uid() OR trades.seller_id = auth.uid()))
);
CREATE POLICY "Users can create disputes" ON disputes FOR INSERT TO authenticated WITH CHECK (auth.uid() = raised_by);

-- Reviews: trade participants can view, reviewer can create
CREATE POLICY "Reviews visible to all" ON reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- Platform settings: visible to all, update by admin only
CREATE POLICY "Settings visible to all" ON platform_settings FOR SELECT USING (true);

-- Admin policies (for admin role)
CREATE POLICY "Admin can update profiles" ON profiles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admin can update trades" ON trades FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admin can update disputes" ON disputes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admin can update settings" ON platform_settings FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admin can view all trades" ON trades FOR SELECT TO authenticated USING (
  buyer_id = auth.uid() OR seller_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Indexes
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_seller ON offers(seller_id);
CREATE INDEX idx_trades_buyer ON trades(buyer_id);
CREATE INDEX idx_trades_seller ON trades(seller_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_disputes_trade ON disputes(trade_id);
CREATE INDEX idx_reviews_trade ON reviews(trade_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

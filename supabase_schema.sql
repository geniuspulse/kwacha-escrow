-- Kwacha Escrow Database Schema
-- Seller pays the escrow fee. Buyer receives full trade amount.

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  kyc_status TEXT DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
  kyc_submitted_at TIMESTAMPTZ,
  wallet_address_trc20 TEXT,
  wallet_address_bsc TEXT,
  total_trades INTEGER DEFAULT 0,
  completed_trades INTEGER DEFAULT 0,
  reputation_score DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sell', 'buy')),
  amount DECIMAL(20,2) NOT NULL,
  rate DECIMAL(20,2) NOT NULL,
  min_amount DECIMAL(20,2) DEFAULT 10,
  max_amount DECIMAL(20,2),
  payment_methods JSONB DEFAULT '[]'::jsonb,
  network TEXT NOT NULL CHECK (network IN ('trc20', 'bsc')),
  wallet_address TEXT NOT NULL,
  terms TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id TEXT NOT NULL UNIQUE,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  amount DECIMAL(20,2) NOT NULL,              -- trade amount (what buyer receives)
  rate DECIMAL(20,2) NOT NULL,
  total_mwk DECIMAL(20,2) GENERATED ALWAYS AS (amount * rate) STORED,
  
  -- Seller pays fee on top of trade amount
  escrow_fee DECIMAL(20,2) GENERATED ALWAYS AS (amount * 0.008) STORED,
  seller_deposit DECIMAL(20,2) GENERATED ALWAYS AS (amount + (amount * 0.008)) STORED,
  buyer_receives DECIMAL(20,2) GENERATED ALWAYS AS (amount) STORED,  -- full amount, no deduction
  
  network TEXT NOT NULL CHECK (network IN ('trc20', 'bsc')),
  seller_wallet_address TEXT NOT NULL,
  buyer_wallet_address TEXT NOT NULL,
  
  -- Smart contract fields
  escrow_tx_hash TEXT,
  escrow_locked_at TIMESTAMPTZ,
  seller_deposit_amount DECIMAL(20,2),  -- actual amount seller locked (amount + fee)
  payment_confirmed_tx TEXT,
  payment_confirmed_at TIMESTAMPTZ,
  release_tx_hash TEXT,
  completed_at TIMESTAMPTZ,
  cancel_tx_hash TEXT,
  dispute_tx_hash TEXT,
  
  payment_method TEXT,
  payment_reference TEXT,
  
  status TEXT DEFAULT 'created' CHECK (status IN (
    'created', 'escrow_pending', 'payment_pending', 'payment_sent',
    'confirming', 'completed', 'cancelled', 'disputed'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  raised_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
  resolution TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_tx_hash TEXT,
  released_to_buyer BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_offers_network ON offers(network);
CREATE INDEX IF NOT EXISTS idx_trades_seller ON trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_trades_buyer ON trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_trade_id ON trades(trade_id);
CREATE INDEX IF NOT EXISTS idx_disputes_trade ON disputes(trade_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can view active offers" ON offers FOR SELECT USING (status = 'active' OR auth.uid() = seller_id);
CREATE POLICY "Users can manage own offers" ON offers FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Parties can view their trades" ON trades FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);
CREATE POLICY "Parties can update their trades" ON trades FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);
CREATE POLICY "Buyers can create trades" ON trades FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Parties can view disputes" ON disputes FOR SELECT USING (
  auth.uid() = raised_by OR 
  auth.uid() IN (SELECT seller_id FROM trades WHERE id = trade_id) OR
  auth.uid() IN (SELECT buyer_id FROM trades WHERE id = trade_id)
);
CREATE POLICY "Parties can create disputes" ON disputes FOR INSERT WITH CHECK (auth.uid() = raised_by);

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER IF NOT EXISTS offers_updated BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER IF NOT EXISTS trades_updated BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER IF NOT EXISTS disputes_updated BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name) VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER IF NOT EXISTS on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

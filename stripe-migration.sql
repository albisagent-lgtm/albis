-- Stripe subscription columns for profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- Index for webhook lookups by customer ID
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles (stripe_customer_id);

-- RLS: users can read their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END
$$;

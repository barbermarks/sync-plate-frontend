-- Create households table if it doesn't exist
CREATE TABLE IF NOT EXISTS households (
  id BIGSERIAL PRIMARY KEY,
  invite_code VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add household_id column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE users ADD COLUMN household_id BIGINT REFERENCES households(id);
  END IF;
END $$;

-- Add activity_level and goal columns to users table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'activity_level'
  ) THEN
    ALTER TABLE users ADD COLUMN activity_level VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'goal'
  ) THEN
    ALTER TABLE users ADD COLUMN goal VARCHAR(20);
  END IF;
END $$;

-- Create index on invite_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code);

-- Enable Row Level Security
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read households
CREATE POLICY IF NOT EXISTS "Users can view households"
  ON households FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to create households
CREATE POLICY IF NOT EXISTS "Users can create households"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (true);

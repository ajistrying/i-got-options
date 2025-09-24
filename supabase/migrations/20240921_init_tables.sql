-- Create favorite_subreddits table
CREATE TABLE IF NOT EXISTS favorite_subreddits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subreddit_name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticker_searches table to store dossier
CREATE TABLE IF NOT EXISTS ticker_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  search_data JSONB NOT NULL,
  search_query TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ticker_searches_ticker ON ticker_searches(ticker);
CREATE INDEX idx_ticker_searches_created_at ON ticker_searches(created_at DESC);
CREATE INDEX idx_favorite_subreddits_active ON favorite_subreddits(active);

-- Insert some default favorite subreddits for options trading
INSERT INTO favorite_subreddits (subreddit_name) VALUES 
  ('wallstreetbets'),
  ('options'),
  ('stocks'),
  ('investing'),
  ('StockMarket'),
  ('thetagang'),
  ('Daytrading'),
  ('pennystocks')
ON CONFLICT (subreddit_name) DO NOTHING;
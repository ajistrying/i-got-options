-- Create ticker_journals table to store journal entries per ticker
CREATE TABLE IF NOT EXISTS ticker_journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticker, entry_date)
);

-- Create indexes for better performance
CREATE INDEX idx_ticker_journals_ticker ON ticker_journals(ticker);
CREATE INDEX idx_ticker_journals_entry_date ON ticker_journals(entry_date DESC);
CREATE INDEX idx_ticker_journals_ticker_date ON ticker_journals(ticker, entry_date DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticker_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_update_ticker_journals_updated_at
  BEFORE UPDATE ON ticker_journals
  FOR EACH ROW
  EXECUTE FUNCTION update_ticker_journals_updated_at();

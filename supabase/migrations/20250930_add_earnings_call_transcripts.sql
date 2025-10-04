-- Create earnings_call_transcripts table for storing individual earnings call transcripts
CREATE TABLE IF NOT EXISTS earnings_call_transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  transcript_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure we don't store duplicate transcripts for the same ticker/year/quarter
  CONSTRAINT unique_earnings_call UNIQUE (ticker, year, quarter)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_earnings_transcripts_ticker ON earnings_call_transcripts(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_transcripts_year ON earnings_call_transcripts(year);
CREATE INDEX IF NOT EXISTS idx_earnings_transcripts_ticker_year ON earnings_call_transcripts(ticker, year);
CREATE INDEX IF NOT EXISTS idx_earnings_transcripts_data ON earnings_call_transcripts USING GIN (transcript_data);

-- Add column to ticker_searches for storing earnings call list data
ALTER TABLE ticker_searches
ADD COLUMN IF NOT EXISTS earnings_calls_data JSONB;

-- Add index for better query performance on earnings calls data
CREATE INDEX IF NOT EXISTS idx_ticker_searches_earnings_calls ON ticker_searches USING GIN (earnings_calls_data);

-- Add timestamp for when earnings calls data was last updated
ALTER TABLE ticker_searches
ADD COLUMN IF NOT EXISTS earnings_calls_updated_at TIMESTAMPTZ;

-- Add index on earnings calls update timestamp
CREATE INDEX IF NOT EXISTS idx_ticker_searches_earnings_updated ON ticker_searches(earnings_calls_updated_at);

-- Add comments explaining the structure
COMMENT ON TABLE earnings_call_transcripts IS 'Stores individual earnings call transcripts fetched from roic.ai API';
COMMENT ON COLUMN earnings_call_transcripts.transcript_data IS 'Full transcript data from roic.ai including text, speakers, and timestamps';
COMMENT ON COLUMN ticker_searches.earnings_calls_data IS 'List of available earnings calls from roic.ai API with year, quarter, and date';
COMMENT ON COLUMN ticker_searches.earnings_calls_updated_at IS 'Timestamp of when the earnings calls list was last fetched from the API';

-- Add column for fundamental financial data
ALTER TABLE ticker_searches
ADD COLUMN IF NOT EXISTS fundamental_data JSONB;

-- Add index for better query performance on fundamental data
CREATE INDEX IF NOT EXISTS idx_ticker_searches_fundamental_data ON ticker_searches USING GIN (fundamental_data);

-- Add timestamp for when fundamental data was last updated
ALTER TABLE ticker_searches
ADD COLUMN IF NOT EXISTS fundamental_data_updated_at TIMESTAMPTZ;

-- Add index on fundamental data update timestamp
CREATE INDEX IF NOT EXISTS idx_ticker_searches_fundamental_updated ON ticker_searches(fundamental_data_updated_at);

-- Add comment explaining the fundamental data structure
COMMENT ON COLUMN ticker_searches.fundamental_data IS 'Stores comprehensive financial data including balance sheets, income statements, cash flows, earnings, technicals, and analyst ratings for the past 5 years';

COMMENT ON COLUMN ticker_searches.fundamental_data_updated_at IS 'Timestamp of when the fundamental data was last fetched from the API';
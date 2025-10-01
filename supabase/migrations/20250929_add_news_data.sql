-- Add column for news data from EODHD API
ALTER TABLE ticker_searches
ADD COLUMN IF NOT EXISTS news_data JSONB;

-- Add index for better query performance on news data
CREATE INDEX IF NOT EXISTS idx_ticker_searches_news_data ON ticker_searches USING GIN (news_data);

-- Add timestamp for when news data was last updated
ALTER TABLE ticker_searches
ADD COLUMN IF NOT EXISTS news_data_updated_at TIMESTAMPTZ;

-- Add index on news data update timestamp
CREATE INDEX IF NOT EXISTS idx_ticker_searches_news_updated ON ticker_searches(news_data_updated_at);

-- Add comment explaining the news data structure
COMMENT ON COLUMN ticker_searches.news_data IS 'Stores news articles from EODHD API including title, content, link, symbols, tags, and sentiment data';

COMMENT ON COLUMN ticker_searches.news_data_updated_at IS 'Timestamp of when the news data was last fetched from the API';
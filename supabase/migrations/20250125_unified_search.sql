-- Add columns for unified search data structure
ALTER TABLE ticker_searches 
ADD COLUMN IF NOT EXISTS unified_search_data JSONB,
ADD COLUMN IF NOT EXISTS search_metadata JSONB;

-- Update the existing columns to be nullable since we'll transition to unified structure
ALTER TABLE ticker_searches 
ALTER COLUMN subreddit DROP NOT NULL,
ALTER COLUMN search_data DROP NOT NULL;

-- Add index for better query performance on unified data
CREATE INDEX IF NOT EXISTS idx_ticker_searches_unified_data ON ticker_searches USING GIN (unified_search_data);
CREATE INDEX IF NOT EXISTS idx_ticker_searches_metadata ON ticker_searches USING GIN (search_metadata);

-- Add a column to distinguish between old and new data format
ALTER TABLE ticker_searches 
ADD COLUMN IF NOT EXISTS data_version INTEGER DEFAULT 1;

-- Set data_version to 2 for new unified format
COMMENT ON COLUMN ticker_searches.data_version IS '1 = legacy per-subreddit rows, 2 = unified search format';
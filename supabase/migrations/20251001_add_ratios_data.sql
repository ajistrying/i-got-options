-- Add columns for financial ratios data from roic.ai
ALTER TABLE ticker_searches
ADD COLUMN IF NOT EXISTS credit_ratios_data JSONB,
ADD COLUMN IF NOT EXISTS liquidity_ratios_data JSONB,
ADD COLUMN IF NOT EXISTS yield_ratios_data JSONB;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ticker_searches_credit_ratios ON ticker_searches USING GIN (credit_ratios_data);
CREATE INDEX IF NOT EXISTS idx_ticker_searches_liquidity_ratios ON ticker_searches USING GIN (liquidity_ratios_data);
CREATE INDEX IF NOT EXISTS idx_ticker_searches_yield_ratios ON ticker_searches USING GIN (yield_ratios_data);

-- Add timestamps for when ratios data was last updated
ALTER TABLE ticker_searches
ADD COLUMN IF NOT EXISTS credit_ratios_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS liquidity_ratios_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS yield_ratios_updated_at TIMESTAMPTZ;

-- Add indexes on ratios update timestamps
CREATE INDEX IF NOT EXISTS idx_ticker_searches_credit_ratios_updated ON ticker_searches(credit_ratios_updated_at);
CREATE INDEX IF NOT EXISTS idx_ticker_searches_liquidity_ratios_updated ON ticker_searches(liquidity_ratios_updated_at);
CREATE INDEX IF NOT EXISTS idx_ticker_searches_yield_ratios_updated ON ticker_searches(yield_ratios_updated_at);

-- Add comments explaining the structure
COMMENT ON COLUMN ticker_searches.credit_ratios_data IS 'Credit and debt ratios from roic.ai including debt-to-equity, debt-to-EBITDA, etc. Stored with annual and quarterly arrays';
COMMENT ON COLUMN ticker_searches.liquidity_ratios_data IS 'Liquidity ratios from roic.ai including current ratio, quick ratio, cash ratio, Altman Z-score, etc. Stored with annual and quarterly arrays';
COMMENT ON COLUMN ticker_searches.yield_ratios_data IS 'Yield analysis ratios from roic.ai including FCF yield, shareholder yield, capital yield, etc. Stored with annual and quarterly arrays';

COMMENT ON COLUMN ticker_searches.credit_ratios_updated_at IS 'Timestamp of when the credit ratios data was last fetched from the API';
COMMENT ON COLUMN ticker_searches.liquidity_ratios_updated_at IS 'Timestamp of when the liquidity ratios data was last fetched from the API';
COMMENT ON COLUMN ticker_searches.yield_ratios_updated_at IS 'Timestamp of when the yield ratios data was last fetched from the API';

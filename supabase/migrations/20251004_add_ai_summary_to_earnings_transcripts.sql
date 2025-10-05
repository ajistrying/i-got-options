-- Add ai_summary column to earnings_call_transcripts table
ALTER TABLE earnings_call_transcripts
ADD COLUMN IF NOT EXISTS ai_summary JSONB;

-- Add index for better query performance on AI summary data
CREATE INDEX IF NOT EXISTS idx_earnings_transcripts_ai_summary ON earnings_call_transcripts USING GIN (ai_summary);

-- Add timestamp for when AI summary was generated
ALTER TABLE earnings_call_transcripts
ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ;

-- Add index on AI summary timestamp
CREATE INDEX IF NOT EXISTS idx_earnings_transcripts_ai_summary_generated ON earnings_call_transcripts(ai_summary_generated_at);

-- Add comment explaining the structure
COMMENT ON COLUMN earnings_call_transcripts.ai_summary IS 'AI-generated analysis of the earnings call transcript including positives, negatives, impacts, and management commentary';
COMMENT ON COLUMN earnings_call_transcripts.ai_summary_generated_at IS 'Timestamp of when the AI summary was generated';

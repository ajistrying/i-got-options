import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { ticker, earningsCalls } = body;

    if (!ticker) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ticker is required',
            message: 'Ticker is required'
        });
    }

    if (!earningsCalls || !Array.isArray(earningsCalls)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Earnings calls array is required',
            message: 'Earnings calls array is required'
        });
    }

    // Initialize Supabase client
    const supabase = createClient(
        config.public.supabaseUrl,
        config.public.supabasePublishableKey
    );

    try {
        // Fetch all existing transcripts for this ticker
        const { data: existingTranscripts, error: fetchError } = await supabase
            .from('earnings_call_transcripts')
            .select('*')
            .eq('ticker', ticker.toUpperCase());

        if (fetchError) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error fetching existing transcripts',
                message: fetchError.message
            });
        }

        // Map the transcripts and summaries to their year-quarter keys
        const transcriptsMap: Record<string, any> = {};
        const summariesMap: Record<string, any> = {};

        if (existingTranscripts) {
            existingTranscripts.forEach(transcript => {
                const key = `${transcript.year}-${transcript.quarter}`;
                transcriptsMap[key] = transcript.transcript_data;
                if (transcript.ai_summary) {
                    summariesMap[key] = transcript.ai_summary;
                }
            });
        }

        return {
            success: true,
            ticker: ticker.toUpperCase(),
            transcripts: transcriptsMap,
            summaries: summariesMap
        };

    } catch (error: any) {
        console.error('Error checking existing transcripts:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: error.message || 'Internal Server Error'
        });
    }
});

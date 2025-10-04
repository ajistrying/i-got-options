import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { ticker, year, quarter } = body;

    if (!ticker) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ticker is required',
            message: 'Ticker is required'
        });
    }

    if (!year || !quarter) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Year and quarter are required',
            message: 'Year and quarter are required'
        });
    }

    // Validate quarter is between 1-4
    if (quarter < 1 || quarter > 4) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Quarter must be between 1 and 4',
            message: 'Quarter must be between 1 and 4'
        });
    }

    // Initialize Supabase client
    const supabase = createClient(
        config.public.supabaseUrl,
        config.public.supabasePublishableKey
    );

    try {
        // First, check if we already have this transcript in the database
        const { data: existingTranscript, error: fetchError } = await supabase
            .from('earnings_call_transcripts')
            .select('*')
            .eq('ticker', ticker.toUpperCase())
            .eq('year', year)
            .eq('quarter', quarter)
            .single();

        // If we have it and it's recent (less than 30 days old), return it
        if (existingTranscript && !fetchError) {
            const transcriptAge = Date.now() - new Date(existingTranscript.created_at).getTime();
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

            if (transcriptAge < thirtyDaysInMs) {
                return {
                    success: true,
                    ticker: ticker.toUpperCase(),
                    year,
                    quarter,
                    transcript: existingTranscript.transcript_data,
                    fromCache: true,
                    cachedAt: existingTranscript.created_at
                };
            }
        }

        // Fetch from roic.ai API
        const apiKey = '7e013621134245d78d709a812b80823e';
        const response = await fetch(
            `https://api.roic.ai/v2/company/earnings-calls/transcript/${ticker.toUpperCase()}?year=${year}&quarter=${quarter}&apikey=${apiKey}`
        );

        if (!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage: `Error fetching earnings call transcript from roic.ai`,
                message: response.statusText
            });
        }

        const transcriptData = await response.json();

        // Store or update the transcript in the database
        const { data: upsertedTranscript, error: upsertError } = await supabase
            .from('earnings_call_transcripts')
            .upsert({
                ticker: ticker.toUpperCase(),
                year,
                quarter,
                transcript_data: transcriptData,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'ticker,year,quarter'
            })
            .select()
            .single();

        if (upsertError) {
            console.error('Error storing transcript:', upsertError);
            // Don't throw error, just return the data without caching
            return {
                success: true,
                ticker: ticker.toUpperCase(),
                year,
                quarter,
                transcript: transcriptData,
                fromCache: false,
                warning: 'Transcript fetched but not cached in database'
            };
        }

        return {
            success: true,
            ticker: ticker.toUpperCase(),
            year,
            quarter,
            transcript: transcriptData,
            fromCache: false,
            cachedAt: upsertedTranscript.created_at
        };

    } catch (error: any) {
        console.error('Error fetching earnings call transcript:', error);
        throw createError({
            statusCode: 500,
            statusMessage: `Internal Server Error`,
            message: error.message || 'Internal Server Error'
        });
    }
});

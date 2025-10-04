import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { ticker } = body;

    if (!ticker) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ticker is required',
            message: 'Ticker is required'
        });
    }

    // Initialize Supabase client
    const supabase = createClient(
        config.public.supabaseUrl,
        config.public.supabasePublishableKey
    );

    try {
        const apiKey = '7e013621134245d78d709a812b80823e';
        const response = await fetch(`https://api.roic.ai/v2/company/earnings-calls/list/${ticker.toUpperCase()}?apikey=${apiKey}`);

        if (!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage: `Error fetching earnings calls data from roic.ai`,
                message: response.statusText
            });
        }

        const data = await response.json();

        // Parse and structure the earnings calls data
        const earningsCalls = Array.isArray(data) ? data.map(call => ({
            symbol: call.symbol || null,
            year: call.year || null,
            quarter: call.quarter || null,
            date: call.date || null
        })) : [];

        // Store or update earnings calls data in the database
        // First, check if a record exists for this ticker
        const { data: existingRecord, error: fetchError } = await supabase
            .from('ticker_searches')
            .select('id')
            .eq('ticker', ticker.toUpperCase())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (existingRecord) {
            // Update existing record with earnings calls data
            const { error: updateError } = await supabase
                .from('ticker_searches')
                .update({
                    earnings_calls_data: earningsCalls,
                    earnings_calls_updated_at: new Date().toISOString()
                })
                .eq('id', existingRecord.id);

            if (updateError) {
                throw createError({
                    statusCode: 500,
                    statusMessage: `Error updating ticker search record`,
                    message: updateError.message
                });
            }
        } else {
            // Create new record with earnings calls data
            const { error: insertError } = await supabase
                .from('ticker_searches')
                .insert({
                    ticker: ticker.toUpperCase(),
                    earnings_calls_data: earningsCalls,
                    earnings_calls_updated_at: new Date().toISOString(),
                    data_version: 2 // Using new unified format
                });

            if (insertError) {
                throw createError({
                    statusCode: 500,
                    statusMessage: `Error inserting ticker search record`,
                    message: insertError.message
                });
            }
        }

        return {
            success: true,
            ticker: ticker.toUpperCase(),
            earningsCalls,
            count: earningsCalls.length
        };

    } catch (error: any) {
        console.error('Error fetching earnings calls data from roic.ai:', error);
        throw createError({
            statusCode: 500,
            statusMessage: `Internal Server Error`,
            message: error.message || 'Internal Server Error'
        });
    }
});

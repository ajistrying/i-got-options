import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const ticker = getRouterParam(event, 'ticker');
    const body = await readBody(event);
    const { content, entry_date } = body;

    if (!ticker) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ticker is required',
            message: 'Ticker is required'
        });
    }

    if (content === undefined) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Content is required',
            message: 'Content is required'
        });
    }

    // Initialize Supabase client
    const supabase = createClient(
        config.public.supabaseUrl,
        config.public.supabasePublishableKey
    );

    try {
        // Use provided entry_date or default to today
        const journalDate = entry_date || new Date().toISOString().split('T')[0];

        // Try to upsert the journal entry (insert or update if exists)
        const { data: journal, error } = await supabase
            .from('ticker_journals')
            .upsert(
                {
                    ticker: ticker.toUpperCase(),
                    entry_date: journalDate,
                    content: content,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'ticker,entry_date',
                    ignoreDuplicates: false
                }
            )
            .select()
            .single();

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error saving journal entry',
                message: error.message
            });
        }

        return {
            success: true,
            ticker: ticker.toUpperCase(),
            journal
        };

    } catch (error: any) {
        console.error('Error saving journal entry:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: error.message || 'Internal Server Error'
        });
    }
});

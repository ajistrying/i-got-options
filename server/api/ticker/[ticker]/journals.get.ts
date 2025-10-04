import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const ticker = getRouterParam(event, 'ticker');

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
        // Fetch all journal entries for this ticker, ordered by date descending
        const { data: journals, error } = await supabase
            .from('ticker_journals')
            .select('*')
            .eq('ticker', ticker.toUpperCase())
            .order('entry_date', { ascending: false });

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error fetching journal entries',
                message: error.message
            });
        }

        return {
            success: true,
            ticker: ticker.toUpperCase(),
            journals: journals || [],
            count: journals?.length || 0
        };

    } catch (error: any) {
        console.error('Error fetching journal entries:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: error.message || 'Internal Server Error'
        });
    }
});

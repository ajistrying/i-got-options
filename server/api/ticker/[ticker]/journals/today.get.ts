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
        const today = new Date().toISOString().split('T')[0];

        // Fetch today's journal entry for this ticker
        const { data: journal, error } = await supabase
            .from('ticker_journals')
            .select('*')
            .eq('ticker', ticker.toUpperCase())
            .eq('entry_date', today)
            .maybeSingle();

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error fetching today\'s journal entry',
                message: error.message
            });
        }

        return {
            success: true,
            ticker: ticker.toUpperCase(),
            journal: journal || null
        };

    } catch (error: any) {
        console.error('Error fetching today\'s journal entry:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: error.message || 'Internal Server Error'
        });
    }
});

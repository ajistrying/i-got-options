import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const ticker = getRouterParam(event, 'ticker');
    const id = getRouterParam(event, 'id');

    if (!ticker || !id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ticker and ID are required',
            message: 'Ticker and ID are required'
        });
    }

    // Initialize Supabase client
    const supabase = createClient(
        config.public.supabaseUrl,
        config.public.supabasePublishableKey
    );

    try {
        const { error } = await supabase
            .from('ticker_journals')
            .delete()
            .eq('id', id)
            .eq('ticker', ticker.toUpperCase());

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error deleting journal entry',
                message: error.message
            });
        }

        return {
            success: true
        };

    } catch (error: any) {
        console.error('Error deleting journal entry:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: error.message || 'Internal Server Error'
        });
    }
});

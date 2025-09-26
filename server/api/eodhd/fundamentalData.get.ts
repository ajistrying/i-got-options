import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { ticker } = body;

    if (!ticker) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ticker is required'
        });
    }

    // Initialize Supabase client
    const supabase = createClient(
        config.public.supabaseUrl,
        config.public.supabasePublishableKey
    );

    try {
        const tickerWithExchangeCode = ticker.toUpperCase().concat('.US');
        const response = await fetch(`https://eodhd.com/api/fundamentals/${tickerWithExchangeCode}?api_token=${process.env.eodhdApiToken}&fmt=json`);

        if(!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage: response.statusText
            });
        }

        const data = await response.json();

        // Store data in database
        // const { error } = await supabase


    } catch (error) {
        console.error('Error fetching fundamental data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error'
        });
    }
});
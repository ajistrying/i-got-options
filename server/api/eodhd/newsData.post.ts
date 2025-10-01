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
        const tickerWithExchangeCode = ticker.toUpperCase().concat('.US');
        const response = await fetch(`https://eodhd.com/api/news?s=${tickerWithExchangeCode}&offset=0&limit=10&api_token=${process.env.EODHD_API_KEY}&fmt=json`);

        if(!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage: `Error fetching news data from EODHD`,
                message: response.statusText
            });
        }

        const data = await response.json();

        // Process and structure the news data
        const newsArticles = Array.isArray(data) ? data.map(article => ({
            date: article.date || null,
            title: article.title || null,
            content: article.content || null,
            link: article.link || null,
            symbols: article.symbols || [],
            tags: article.tags || [],
            sentiment: {
                polarity: article.sentiment?.polarity || 0,
                neg: article.sentiment?.neg || 0,
                neu: article.sentiment?.neu || 0,
                pos: article.sentiment?.pos || 0
            }
        })) : [];

        // Store or update news data in the database
        // First, check if a record exists for this ticker
        const { data: existingRecord, error: fetchError } = await supabase
            .from('ticker_searches')
            .select('id')
            .eq('ticker', ticker.toUpperCase())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (existingRecord) {
            // Update existing record with news data
            const { error: updateError } = await supabase
                .from('ticker_searches')
                .update({
                    news_data: newsArticles,
                    news_data_updated_at: new Date().toISOString()
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
            // Create new record with news data
            const { error: insertError } = await supabase
                .from('ticker_searches')
                .insert({
                    ticker: ticker.toUpperCase(),
                    news_data: newsArticles,
                    news_data_updated_at: new Date().toISOString(),
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
            message: `News data for ${ticker.toUpperCase()} fetched and stored successfully`,
            ticker: ticker.toUpperCase(),
            articlesCount: newsArticles.length
        };

    } catch (error: any) {
        console.error('Error fetching news data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: `Internal Server Error`,
            message: error.message || 'Internal Server Error'
        });
    }
});
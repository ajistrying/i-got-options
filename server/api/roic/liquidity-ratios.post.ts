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

    const supabase = createClient(
        config.public.supabaseUrl,
        config.public.supabasePublishableKey
    );

    try {
        const apiKey = '7e013621134245d78d709a812b80823e';
        const currentYear = new Date().getFullYear();
        const fiveYearsAgo = currentYear - 5;

        const annualResponse = await fetch(
            `https://api.roic.ai/v2/fundamental/ratios/liquidity/${ticker.toUpperCase()}?apikey=${apiKey}&period=annual&fiscal_year_start=${fiveYearsAgo}&fiscal_year_end=${currentYear}&order=desc`
        );

        if (!annualResponse.ok) {
            throw createError({
                statusCode: annualResponse.status,
                statusMessage: `Error fetching annual liquidity ratios from roic.ai`,
                message: annualResponse.statusText
            });
        }

        const quarterlyResponse = await fetch(
            `https://api.roic.ai/v2/fundamental/ratios/liquidity/${ticker.toUpperCase()}?apikey=${apiKey}&period=quarterly&fiscal_year_start=${fiveYearsAgo}&fiscal_year_end=${currentYear}&order=desc`
        );

        if (!quarterlyResponse.ok) {
            throw createError({
                statusCode: quarterlyResponse.status,
                statusMessage: `Error fetching quarterly liquidity ratios from roic.ai`,
                message: quarterlyResponse.statusText
            });
        }

        const annualData = await annualResponse.json();
        const quarterlyData = await quarterlyResponse.json();

        const annualRatios = Array.isArray(annualData) ? annualData : [];
        const quarterlyRatios = Array.isArray(quarterlyData) ? quarterlyData : [];

        const ratiosData = {
            annual: annualRatios,
            quarterly: quarterlyRatios
        };

        const { data: existingRecord } = await supabase
            .from('ticker_searches')
            .select('id')
            .eq('ticker', ticker.toUpperCase())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (existingRecord) {
            const { error: updateError } = await supabase
                .from('ticker_searches')
                .update({
                    liquidity_ratios_data: ratiosData,
                    liquidity_ratios_updated_at: new Date().toISOString()
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
            const { error: insertError } = await supabase
                .from('ticker_searches')
                .insert({
                    ticker: ticker.toUpperCase(),
                    liquidity_ratios_data: ratiosData,
                    liquidity_ratios_updated_at: new Date().toISOString(),
                    data_version: 2
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
            annual: annualRatios,
            quarterly: quarterlyRatios,
            annualCount: annualRatios.length,
            quarterlyCount: quarterlyRatios.length
        };

    } catch (error: any) {
        console.error('Error fetching liquidity ratios data from roic.ai:', error);
        throw createError({
            statusCode: 500,
            statusMessage: `Internal Server Error`,
            message: error.message || 'Internal Server Error'
        });
    }
});

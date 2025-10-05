import { QualitativeIntelligenceManager } from '../../../../app/agents/ticker/qualitativeIntelligenceManager';

export default defineEventHandler(async (event) => {
    const ticker = getRouterParam(event, 'ticker');

    if (!ticker) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ticker parameter is required',
        });
    }

    try {
        const supabase = useSupabaseClient();

        // Fetch ticker data
        const { data: tickerData, error } = await supabase
            .from('ticker_searches')
            .select('*')
            .eq('ticker', ticker.toUpperCase())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !tickerData) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Ticker data not found. Run data pipeline first.',
            });
        }

        // Fetch earnings transcripts
        const { data: earningsData } = await supabase
            .from('earnings_call_transcripts')
            .select('*')
            .eq('ticker', ticker.toUpperCase())
            .order('year', { ascending: false })
            .order('quarter', { ascending: false })
            .limit(4); // Get last 4 quarters

        // Prepare data payload for manager
        const dataPayload = {
            transcripts: earningsData || [],
            newsArticles: tickerData.news_data || [],
            redditPosts: tickerData.search_data || [],
            companyInfo: tickerData.fundamental_data || {},
        };

        // Run the Qualitative Intelligence Manager
        const manager = new QualitativeIntelligenceManager();
        const report = await manager.run(ticker.toUpperCase(), dataPayload);

        // TODO: Store generated report in database for caching
        // const { error: insertError } = await supabase
        //     .from('generated_reports')
        //     .insert({
        //         ticker: ticker.toUpperCase(),
        //         report_data: report,
        //         created_at: new Date().toISOString(),
        //     });

        return {
            success: true,
            report,
        };

    } catch (error: any) {
        console.error('Error generating report:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to generate report',
        });
    }
});

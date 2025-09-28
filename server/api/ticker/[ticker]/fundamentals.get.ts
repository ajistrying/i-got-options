import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const ticker = getRouterParam(event, 'ticker')?.toUpperCase();

  if (!ticker) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ticker parameter is required'
    });
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey
  );

  try {
    // Fetch the most recent ticker search with fundamental data
    const { data: tickerData, error } = await supabase
      .from('ticker_searches')
      .select('fundamental_data, fundamental_data_updated_at')
      .eq('ticker', ticker)
      .not('fundamental_data', 'is', null)
      .order('fundamental_data_updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !tickerData) {
      return {
        ticker,
        fundamentalData: null,
        updatedAt: null,
        message: 'No fundamental data available for this ticker'
      };
    }

    return {
      ticker,
      fundamentalData: tickerData.fundamental_data,
      updatedAt: tickerData.fundamental_data_updated_at
    };
  } catch (error) {
    console.error('Error fetching fundamental data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch fundamental data'
    });
  }
});
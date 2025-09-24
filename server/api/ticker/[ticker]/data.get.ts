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
    // Fetch all searches for this ticker
    const { data: searches, error } = await supabase
      .from('ticker_searches')
      .select('*')
      .eq('ticker', ticker)
      .order('created_at', { ascending: false });

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch ticker data'
      });
    }

    return {
      ticker,
      searches: searches || [],
      totalSearches: searches?.length || 0
    };
  } catch (error) {
    console.error('Error fetching ticker data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch ticker data'
    });
  }
});
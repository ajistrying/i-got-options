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
    // Fetch all searches for this ticker, prioritizing unified data format (version 2)
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

    // Process searches to extract unified data where available
    const processedSearches = searches?.map(search => {
      // If this is new unified format (version 2), return it as is
      if (search.data_version === 2 && search.unified_search_data) {
        return {
          ...search,
          // Ensure unified_search_data is available at the top level
          unified_search_data: search.unified_search_data,
          search_metadata: search.search_metadata
        };
      }

      // For legacy format, maintain backward compatibility
      return search;
    }) || [];

    return {
      ticker,
      searches: processedSearches,
      totalSearches: processedSearches?.length || 0
    };
  } catch (error) {
    console.error('Error fetching ticker data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch ticker data'
    });
  }
});
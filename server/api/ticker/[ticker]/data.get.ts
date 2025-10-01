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

    // Extract individual timestamps for each data source
    let redditSearchTime = null;
    let newsDataTime = null;
    let fundamentalsDataTime = null;

    // Find the most recent timestamps for each data source
    for (const search of processedSearches) {
      // Reddit search timestamp from search_metadata
      if (!redditSearchTime && search.search_metadata?.search_timestamp) {
        redditSearchTime = search.search_metadata.search_timestamp;
      }

      // News data timestamp
      if (!newsDataTime && search.news_data_updated_at) {
        newsDataTime = search.news_data_updated_at;
      }

      // Fundamentals data timestamp
      if (!fundamentalsDataTime && search.fundamental_data_updated_at) {
        fundamentalsDataTime = search.fundamental_data_updated_at;
      }

      // Stop searching if we've found all timestamps
      if (redditSearchTime && newsDataTime && fundamentalsDataTime) {
        break;
      }
    }

    return {
      ticker,
      searches: processedSearches,
      totalSearches: processedSearches?.length || 0,
      timestamps: {
        reddit: redditSearchTime,
        news: newsDataTime,
        fundamentals: fundamentalsDataTime
      }
    };
  } catch (error) {
    console.error('Error fetching ticker data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch ticker data'
    });
  }
});
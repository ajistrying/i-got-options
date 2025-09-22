import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey
  );

  try {
    // Get aggregated search history
    const { data: searches, error, count } = await supabase
      .from('ticker_searches')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch search history'
      });
    }

    // Group by ticker and timestamp to aggregate results
    const groupedSearches = new Map();
    
    searches?.forEach(search => {
      const key = `${search.ticker}_${search.created_at}`;
      if (!groupedSearches.has(key)) {
        groupedSearches.set(key, {
          id: search.id,
          ticker: search.ticker,
          search_query: search.search_query || search.ticker,
          created_at: search.created_at,
          subreddits: [search.subreddit],
          result_count: Array.isArray(search.search_data) ? search.search_data.length : 0
        });
      } else {
        const existing = groupedSearches.get(key);
        existing.subreddits.push(search.subreddit);
        existing.result_count += Array.isArray(search.search_data) ? search.search_data.length : 0;
      }
    });

    const aggregatedSearches = Array.from(groupedSearches.values());
    const totalPages = Math.ceil((count || 0) / limit);

    return {
      searches: aggregatedSearches,
      totalPages,
      currentPage: page,
      totalCount: count
    };
  } catch (error) {
    console.error('Error fetching search history:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch search history'
    });
  }
});
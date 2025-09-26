export const useRedditSearch = () => {
  // Simplified - just handle the API call and let the pipeline manage state
  const searchReddit = async (ticker: string, subreddits: string[] = []) => {
    try {
      const data = await $fetch('/api/reddit/search', {
        method: 'POST',
        body: {
          ticker,
          subreddits
        }
      });

      return data;
    } catch (err) {
      console.error('Reddit search error:', err);
      // Re-throw to let the pipeline handle it
      throw err;
    }
  };

  const getTickerHistory = async (ticker: string) => {
    const { supabase } = useSupabase();
    
    const { data, error: dbError } = await supabase
      .from('ticker_searches')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching history:', dbError);
    }

    // Process data to handle both old and new formats
    return data.map(item => {
      if (item.data_version === 2 && item.unified_search_data) {
        // New unified format - flatten for compatibility
        const results = [];
        for (const [subreddit, data] of Object.entries(item.unified_search_data.subreddits)) {
          if (data.posts && data.posts.length > 0) {
            results.push({
              ...item,
              subreddit,
              search_data: data.posts
            });
          }
        }
        return results;
      }
      // Old format - return as is
      return item;
    }).flat();
  };

  return {
    searchReddit,
    getTickerHistory
  };
};
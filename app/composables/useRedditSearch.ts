export const useRedditSearch = () => {
  const loading = ref(false);
  const error = ref(null);
  const searchResults = ref(null);

  const searchTicker = async (ticker: string, subreddits: string[] = []) => {
    loading.value = true;
    error.value = null;
    searchResults.value = null;

    try {
      const data = await $fetch('/api/reddit/search', {
        method: 'POST',
        body: {
          ticker,
          subreddits
        }
      });
      
      searchResults.value = data;
      return data;
    } catch (err) {
      console.error('Search error:', err);
      error.value = err.message || 'Failed to search Reddit';
      throw err;
    } finally {
      loading.value = false;
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
      return [];
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
    loading: readonly(loading),
    error: readonly(error),
    searchResults: readonly(searchResults),
    searchTicker,
    getTickerHistory
  };
};
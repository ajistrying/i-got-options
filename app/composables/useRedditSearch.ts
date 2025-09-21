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

    return data;
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    searchResults: readonly(searchResults),
    searchTicker,
    getTickerHistory
  };
};
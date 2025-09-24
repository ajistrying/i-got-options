<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-4xl font-bold mb-3">Stock Options Research Hub</h1>
        <p class="text-gray-600 dark:text-gray-400 text-lg">
          Options Trading Sentiment Research
        </p>
      </div>

      <!-- Main Content - Centered Layout -->
      <div class="w-full max-w-5xl mx-auto space-y-8">
        <!-- Search Section -->
        <UCard class="shadow-lg">
          <template #header>
            <h2 class="text-xl font-semibold">Search Ticker</h2>
          </template>
          <TickerSearch 
            @search-complete="handleSearchComplete" 
            ref="tickerSearchRef"
          />
        </UCard>

        <!-- Search History Section -->
        <UCard class="shadow-lg">
          <SearchHistory 
            @select-search="handleSelectSearch"
            ref="searchHistoryRef"
          />
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const searchResults = ref(null);
const searchHistoryRef = ref(null);
const tickerSearchRef = ref(null);

const handleSearchComplete = (results: any) => {
  searchResults.value = results;
  // Refresh the search history to show the new search
  if (searchHistoryRef.value) {
    searchHistoryRef.value.refreshHistory();
  }
};

const handleSelectSearch = async (search: any) => {
  // Load the full search results for the selected search
  try {
    const { supabase } = useSupabase();
    const { data } = await supabase
      .from('ticker_searches')
      .select('*')
      .eq('ticker', search.ticker)
      .eq('created_at', search.created_at)
      .order('created_at', { ascending: false });
    
    if (data && data.length > 0) {
      // Format the data to match the expected structure
      const formattedResults = {
        ticker: search.ticker,
        timestamp: search.created_at,
        results: data.map(item => ({
          subreddit: item.subreddit,
          count: item.search_data.length,
          posts: item.search_data
        })),
        total_posts: data.reduce((sum, item) => sum + item.search_data.length, 0)
      };
      
    }
  } catch (error) {
    console.error('Failed to load search details:', error);
  }
};
</script>
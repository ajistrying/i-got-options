<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <!-- Header -->
      <TickerWorkbenchHeader
        :ticker="ticker"
        :lastSearchTime="lastSearchTime"
        :totalSearches="totalSearches"
        :redditSearchTime="redditSearchTime"
        :newsDataTime="newsDataTime"
        :fundamentalsDataTime="fundamentalsDataTime"
        @refresh="handleRefresh"
      />

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-16">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary-600" />
      </div>

      <!-- No Data State -->
      <div v-else-if="!hasData" class="text-center py-16">
        <UIcon name="i-heroicons-magnifying-glass" class="text-6xl text-gray-400 mb-4" />
        <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No data found for {{ ticker }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Start by searching for this ticker to see results here.
        </p>
        <UButton @click="navigateToSearch" size="lg" icon="i-heroicons-arrow-left">
          Go to Search
        </UButton>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-8">
        <!-- Statistics Section -->

        <!-- Tabs for different views -->
        <UTabs :items="tabs" v-model="selectedTab" :default-value="'media'">
          <template #media>
            <TickerWorkbenchMedia
              :posts="allPosts"
              :articles="newsArticles || []"
              :subreddits="uniqueSubreddits"
              :ticker="ticker"
              :loading-reddit="loadingReddit"
              :loading-news="loadingNews"
              @refresh-reddit="refreshRedditPosts"
              @refresh-news="refreshNewsData"
            />
          </template>

          <template #earnings>
            <TickerWorkbenchEarnings
              :ticker="ticker"
              :earnings="earningsData"
              :loading="loadingEarnings"
              @refresh="refreshEarnings"
            />
          </template>

          <template #fundamentals>
            <TickerWorkbenchFundamentals
              :ticker="ticker"
              @refresh="refreshFundamentals"
            />
          </template>
        </UTabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const ticker = computed(() => (route.params.ticker as string).toUpperCase());

const loading = ref(true);
const loadingReddit = ref(false);
const loadingNews = ref(false);
const loadingFundamentals = ref(false);
const loadingEarnings = ref(false);
const searchData = ref<any[]>([]);
const statistics = ref<any>({});
const searchMetadata = ref<any>({});
const dataSourceTimestamps = ref<any>({});
const selectedTab = ref('media'); // Use value instead of index

const tabs = [
  {
    slot: 'media',
    label: 'Media & Social',
    icon: 'i-heroicons-squares-2x2',
    value: 'media'
  },
  {
    slot: 'earnings',
    label: 'Earnings Calls',
    icon: 'i-heroicons-currency-dollar',
    value: 'earnings'
  },
  {
    slot: 'fundamentals',
    label: 'Fundamentals',
    icon: 'i-heroicons-chart-bar',
    value: 'fundamentals'
  }
];

const hasData = computed(() => searchData.value.length > 0);

const lastSearchTime = computed(() => {
  if (!searchData.value.length) return null;
  const sorted = [...searchData.value].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted[0].created_at;
});

const totalSearches = computed(() => {
  const uniqueDates = new Set(searchData.value.map(s => s.created_at));
  return uniqueDates.size;
});

const redditSearchTime = computed(() => dataSourceTimestamps.value?.reddit || null);
const newsDataTime = computed(() => dataSourceTimestamps.value?.news || null);
const fundamentalsDataTime = computed(() => dataSourceTimestamps.value?.fundamentals || null);

const allPosts = computed(() => {
  const posts = [];
  const seenIds = new Set();

  searchData.value.forEach(search => {
    // Handle new unified data format
    if (search.unified_search_data && search.data_version === 2) {
      const unifiedData = search.unified_search_data;

      // Iterate through all subreddits in the unified data
      Object.entries(unifiedData.subreddits || {}).forEach(([subredditName, subredditData]) => {
        // Add posts from this subreddit
        if (subredditData.posts && Array.isArray(subredditData.posts)) {
          subredditData.posts.forEach(post => {
            if (!seenIds.has(post.id)) {
              seenIds.add(post.id);
              posts.push({
                ...post,
                search_date: search.created_at,
                search_subreddit: subredditName,
                // Include comments if available
                comments: post.comments || []
              });
            }
          });
        }
      });
    }
    // Handle legacy format for backward compatibility
    else if (search.search_data && Array.isArray(search.search_data)) {
      search.search_data.forEach(post => {
        if (!seenIds.has(post.id)) {
          seenIds.add(post.id);
          posts.push({
            ...post,
            search_date: search.created_at,
            search_subreddit: search.subreddit,
            comments: []
          });
        }
      });
    }
  });
  return posts;
});

const uniqueSubreddits = computed(() => {
  const subreddits = new Set();

  searchData.value.forEach(search => {
    // Handle new unified data format
    if (search.unified_search_data && search.data_version === 2) {
      const unifiedData = search.unified_search_data;
      // Get all subreddit names from the unified data
      Object.keys(unifiedData.subreddits || {}).forEach(subreddit => {
        subreddits.add(subreddit);
      });
    }
    // Handle legacy format
    else if (search.subreddit) {
      subreddits.add(search.subreddit);
    }
  });

  return Array.from(subreddits);
});

// News articles data from database
const newsArticles = ref<any[]>([]);

// Earnings call data from database
const earningsData = ref<any[]>([]);

const loadTickerData = async () => {
  loading.value = true;
  try {
    const data = await $fetch(`/api/ticker/${ticker.value}/data`);
    searchData.value = data.searches || [];
    dataSourceTimestamps.value = data.timestamps || {};

    // Extract metadata from the most recent unified search
    const mostRecentUnified = searchData.value.find(s => s.data_version === 2 && s.search_metadata);
    if (mostRecentUnified && mostRecentUnified.search_metadata) {
      searchMetadata.value = mostRecentUnified.search_metadata;
    }

    // Extract news data from the most recent search with news data
    const searchWithNews = searchData.value.find(s => s.news_data && Array.isArray(s.news_data));
    if (searchWithNews && searchWithNews.news_data) {
      newsArticles.value = searchWithNews.news_data;
    } else {
      newsArticles.value = [];
    }

    // Extract earnings calls data from the most recent search with earnings data
    const searchWithEarnings = searchData.value.find(s => s.earnings_calls_data && Array.isArray(s.earnings_calls_data));
    if (searchWithEarnings && searchWithEarnings.earnings_calls_data) {
      earningsData.value = searchWithEarnings.earnings_calls_data;
    } else {
      earningsData.value = [];
    }

    // Load statistics
    const stats = await $fetch(`/api/ticker/${ticker.value}/stats`);
    statistics.value = stats;
  } catch (error) {
    console.error('Failed to load ticker data:', error);
    searchData.value = [];
    statistics.value = {};
    searchMetadata.value = {};
    newsArticles.value = [];
    earningsData.value = [];
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async () => {
  await navigateTo({
    path: '/',
    query: { ticker: ticker.value }
  });
};

const navigateToSearch = () => {
  navigateTo('/');
};

// Individual section refresh handlers
const refreshRedditPosts = async () => {
  loadingReddit.value = true;
  try {
    // Default subreddits for search
    const defaultSubreddits = ['wallstreetbets', 'stocks', 'investing'];

    await $fetch('/api/reddit/search', {
      method: 'POST',
      body: {
        ticker: ticker.value,
        subreddits: defaultSubreddits
      }
    });

    // Reload ticker data to show fresh results
    await loadTickerData();
  } catch (error) {
    console.error('Failed to refresh Reddit posts:', error);
  } finally {
    loadingReddit.value = false;
  }
};

const refreshNewsData = async () => {
  loadingNews.value = true;
  try {
    await $fetch('/api/eodhd/newsData', {
      method: 'POST',
      body: { ticker: ticker.value }
    });

    // Reload ticker data to show fresh results
    await loadTickerData();
  } catch (error) {
    console.error('Failed to refresh news data:', error);
  } finally {
    loadingNews.value = false;
  }
};

const refreshFundamentals = async () => {
  loadingFundamentals.value = true;
  try {
    // Fetch all fundamental data in parallel
    await Promise.all([
      $fetch('/api/eodhd/fundamentalData', {
        method: 'POST',
        body: { ticker: ticker.value }
      }),
      $fetch('/api/roic/credit-ratios', {
        method: 'POST',
        body: { ticker: ticker.value }
      }),
      $fetch('/api/roic/liquidity-ratios', {
        method: 'POST',
        body: { ticker: ticker.value }
      }),
      $fetch('/api/roic/yield-analysis-ratios', {
        method: 'POST',
        body: { ticker: ticker.value }
      })
    ]);

    // Reload ticker data to show fresh results
    await loadTickerData();
  } catch (error) {
    console.error('Failed to refresh fundamental data:', error);
  } finally {
    loadingFundamentals.value = false;
  }
};

const refreshEarnings = async () => {
  loadingEarnings.value = true;
  try {
    await $fetch('/api/roic/earnings-calls', {
      method: 'POST',
      body: { ticker: ticker.value }
    });

    // Reload ticker data to show fresh results
    await loadTickerData();
  } catch (error) {
    console.error('Failed to refresh earnings data:', error);
  } finally {
    loadingEarnings.value = false;
  }
};

onMounted(async () => {
  await loadTickerData();
  // Reddit tab is now selected by default via default-value prop
});

watch(() => route.params.ticker, () => {
  if (route.params.ticker) {
    loadTickerData();
  }
});
</script>
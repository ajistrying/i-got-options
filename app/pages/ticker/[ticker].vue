<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <!-- Header -->
      <TickerWorkbenchHeader 
        :ticker="ticker" 
        :lastSearchTime="lastSearchTime"
        :totalSearches="totalSearches"
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
        <TickerWorkbenchStats 
          :stats="statistics"
          :ticker="ticker"
        />

        <!-- Tabs for different views -->
        <UTabs :items="tabs" v-model="selectedTab">
          <template #posts>
            <TickerWorkbenchPosts 
              :posts="allPosts"
              :subreddits="uniqueSubreddits"
              :ticker="ticker"
            />
          </template>

          <template #timeline>
            <TickerWorkbenchTimeline 
              :searches="searchHistory"
              :ticker="ticker"
            />
          </template>

          <template #raw>
            <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Raw Data Export</h3>
                <div class="space-x-2">
                  <UButton 
                    @click="exportJSON" 
                    size="sm" 
                    variant="soft"
                    icon="i-heroicons-arrow-down-tray"
                  >
                    Export JSON
                  </UButton>
                  <UButton 
                    @click="exportCSV" 
                    size="sm" 
                    variant="soft"
                    icon="i-heroicons-arrow-down-tray"
                  >
                    Export CSV
                  </UButton>
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 rounded p-4 overflow-auto max-h-96">
                <pre class="text-xs">{{ JSON.stringify(searchData, null, 2) }}</pre>
              </div>
            </div>
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
const searchData = ref([]);
const statistics = ref({});
const selectedTab = ref(0);

const tabs = [
  {
    key: 'posts',
    label: 'Reddit Posts',
    icon: 'i-heroicons-chat-bubble-left-right'
  },
  {
    key: 'timeline',
    label: 'Search Timeline',
    icon: 'i-heroicons-clock'
  },
  {
    key: 'raw',
    label: 'Raw Data',
    icon: 'i-heroicons-code-bracket'
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

const allPosts = computed(() => {
  const posts = [];
  const seenIds = new Set();
  
  searchData.value.forEach(search => {
    if (search.search_data && Array.isArray(search.search_data)) {
      search.search_data.forEach(post => {
        if (!seenIds.has(post.id)) {
          seenIds.add(post.id);
          posts.push({
            ...post,
            search_date: search.created_at,
            search_subreddit: search.subreddit
          });
        }
      });
    }
  });
  
  return posts.sort((a, b) => (b.score || 0) - (a.score || 0));
});

const uniqueSubreddits = computed(() => {
  const subreddits = new Set(searchData.value.map(s => s.subreddit));
  return Array.from(subreddits);
});

const searchHistory = computed(() => {
  const grouped = {};
  
  searchData.value.forEach(search => {
    const date = search.created_at;
    if (!grouped[date]) {
      grouped[date] = {
        date,
        subreddits: [],
        totalPosts: 0
      };
    }
    grouped[date].subreddits.push(search.subreddit);
    grouped[date].totalPosts += search.search_data?.length || 0;
  });
  
  return Object.values(grouped).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
});

const loadTickerData = async () => {
  loading.value = true;
  try {
    const data = await $fetch(`/api/ticker/${ticker.value}/data`);
    searchData.value = data.searches || [];
    
    // Load statistics
    const stats = await $fetch(`/api/ticker/${ticker.value}/stats`);
    statistics.value = stats;
  } catch (error) {
    console.error('Failed to load ticker data:', error);
    searchData.value = [];
    statistics.value = {};
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

const exportJSON = () => {
  const dataStr = JSON.stringify({
    ticker: ticker.value,
    exportDate: new Date().toISOString(),
    searches: searchData.value,
    statistics: statistics.value
  }, null, 2);
  
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${ticker.value}_workbench_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportCSV = () => {
  const csvData = [];
  csvData.push(['Ticker', 'Subreddit', 'Post Title', 'Score', 'Comments', 'Author', 'Date', 'URL']);
  
  allPosts.value.forEach(post => {
    csvData.push([
      ticker.value,
      post.subreddit,
      `"${post.title.replace(/"/g, '""')}"`,
      post.score,
      post.num_comments,
      post.author,
      new Date(post.created_utc * 1000).toISOString(),
      post.permalink
    ]);
  });
  
  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${ticker.value}_posts_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

onMounted(() => {
  loadTickerData();
});

watch(() => route.params.ticker, () => {
  if (route.params.ticker) {
    loadTickerData();
  }
});
</script>
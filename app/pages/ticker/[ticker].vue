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
        <UTabs :items="tabs" v-model="selectedTab" :default-value="'reddit'">
          <template #reddit>
            <TickerWorkbenchPosts
              :posts="allPosts"
              :subreddits="uniqueSubreddits"
              :ticker="ticker"
            />
          </template>

          <template #news>
            <TickerWorkbenchNews
              :ticker="ticker"
              :articles="newsArticles"
            />
          </template>

          <template #earnings>
            <TickerWorkbenchEarnings
              :ticker="ticker"
              :earnings="earningsData"
            />
          </template>

          <template #fundamentals>
            <TickerWorkbenchFundamentals
              :ticker="ticker"
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
const searchData = ref<any[]>([]);
const statistics = ref<any>({});
const searchMetadata = ref<any>({});
const selectedTab = ref('reddit'); // Use value instead of index

const tabs = [
  {
    slot: 'reddit',
    label: 'Reddit Posts',
    icon: 'i-heroicons-chat-bubble-left-right',
    value: 'reddit'
  },
  {
    slot: 'news',
    label: 'News Articles',
    icon: 'i-heroicons-newspaper',
    value: 'news'
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

// Dummy news articles data
const newsArticles = computed(() => {
  return [
    {
      id: 1,
      headline: `${ticker.value} Surges on Better-Than-Expected Q4 Earnings`,
      source: "Reuters",
      date: "2 hours ago",
      sentiment: "positive",
      summary: "The company reported a 15% revenue growth year-over-year, beating analyst estimates by 8%. CEO highlighted strong performance in cloud services division.",
      url: "#",
      imageUrl: "https://via.placeholder.com/150"
    },
    {
      id: 2,
      headline: `Analysts Upgrade ${ticker.value} to 'Strong Buy' Following Product Launch`,
      source: "Bloomberg",
      date: "5 hours ago",
      sentiment: "positive",
      summary: "Goldman Sachs and Morgan Stanley both raised their price targets following the successful launch of the company's new AI-powered platform.",
      url: "#"
    },
    {
      id: 3,
      headline: `${ticker.value} Faces Regulatory Scrutiny in European Markets`,
      source: "Financial Times",
      date: "1 day ago",
      sentiment: "negative",
      summary: "European regulators are examining the company's data practices, which could result in potential fines. The company states it is cooperating fully.",
      url: "#"
    },
    {
      id: 4,
      headline: `Breaking: ${ticker.value} Announces $5B Share Buyback Program`,
      source: "CNBC",
      date: "2 days ago",
      sentiment: "positive",
      summary: "The board approved a new share repurchase program, signaling confidence in the company's long-term prospects.",
      url: "#"
    },
    {
      id: 5,
      headline: `${ticker.value} Partners with Major Retailer for Distribution Deal`,
      source: "Wall Street Journal",
      date: "3 days ago",
      sentiment: "neutral",
      summary: "The strategic partnership is expected to expand market reach by 30% over the next two years.",
      url: "#"
    }
  ];
});

// Dummy earnings call data
const earningsData = computed(() => {
  return [
    {
      id: 1,
      date: "Q4 2024",
      callDate: "January 15, 2025",
      eps: "$2.45",
      epsEstimate: "$2.32",
      revenue: "$15.2B",
      revenueEstimate: "$14.8B",
      sentiment: "bullish",
      transcriptHighlights: [
        "Revenue exceeded guidance by 8%, driven by strong performance in North American markets",
        "Operating margin expanded 250 basis points year-over-year to 23.5%",
        "Announcing expansion into Asian markets with $500M investment in Q1 2025",
        "R&D investment increased by 20% to accelerate AI product development",
        "Free cash flow reached record $4.2B, up 18% YoY"
      ],
      ceoQuotes: [
        "We're extremely pleased with our performance this quarter, demonstrating the strength of our business model and the dedication of our team.",
        "Looking ahead, we see significant opportunities for growth, particularly in AI and cloud services."
      ],
      guidanceNext: {
        revenue: "$16.0B - $16.5B",
        eps: "$2.50 - $2.65"
      }
    },
    {
      id: 2,
      date: "Q3 2024",
      callDate: "October 18, 2024",
      eps: "$2.28",
      epsEstimate: "$2.25",
      revenue: "$14.1B",
      revenueEstimate: "$14.0B",
      sentiment: "neutral",
      transcriptHighlights: [
        "Sequential improvement in gross margins despite supply chain challenges",
        "Customer acquisition costs decreased by 15%",
        "Successfully launched three new products ahead of schedule"
      ],
      ceoQuotes: [
        "We're navigating a challenging macro environment while continuing to invest in our future."
      ],
      guidanceNext: {
        revenue: "$14.8B - $15.2B",
        eps: "$2.30 - $2.35"
      }
    }
  ];
});

const loadTickerData = async () => {
  loading.value = true;
  try {
    const data = await $fetch(`/api/ticker/${ticker.value}/data`);
    searchData.value = data.searches || [];

    // Extract metadata from the most recent unified search
    const mostRecentUnified = searchData.value.find(s => s.data_version === 2 && s.search_metadata);
    if (mostRecentUnified && mostRecentUnified.search_metadata) {
      searchMetadata.value = mostRecentUnified.search_metadata;
    }

    // Load statistics
    const stats = await $fetch(`/api/ticker/${ticker.value}/stats`);
    statistics.value = stats;
  } catch (error) {
    console.error('Failed to load ticker data:', error);
    searchData.value = [];
    statistics.value = {};
    searchMetadata.value = {};
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
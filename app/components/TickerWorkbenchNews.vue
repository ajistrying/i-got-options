<template>
  <div class="space-y-6">
    <!-- Header with Refresh Button -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">News Articles</h2>
      <UButton
        @click="$emit('refresh')"
        variant="soft"
        icon="i-heroicons-arrow-path"
        size="sm"
        :loading="loading"
      >
        Refresh News
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary-600 mb-4" />
      <p class="text-gray-600 dark:text-gray-400">Refreshing news data...</p>
    </div>

    <!-- News Articles List -->
    <div v-else-if="articles.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-newspaper" class="text-5xl text-gray-400 mb-3" />
      <p class="text-gray-600 dark:text-gray-400">No news articles found</p>
    </div>

    <div v-else class="space-y-4">
      <TransitionGroup name="list">
        <UCard 
          v-for="article in paginatedArticles" 
          :key="article.id"
          class="hover:shadow-lg transition-all duration-200"
        >
          <div class="flex gap-4">
            <!-- Article Image (optional) -->
            <div v-if="article.imageUrl" class="flex-shrink-0">
              <img 
                :src="article.imageUrl" 
                :alt="article.headline"
                class="w-24 h-24 object-cover rounded-lg"
              />
            </div>

            <!-- Article Content -->
            <div class="flex-1 space-y-2">
              <!-- Header -->
              <div class="flex items-start justify-between">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                  {{ article.title }}
                </h3>
                <UBadge
                  :color="getSentimentBadgeColor(article.sentiment?.polarity || 0.5)"
                  variant="subtle"
                  class="ml-2"
                >
                  {{ getSentimentLabel(article.sentiment?.polarity || 0.5) }}
                </UBadge>
              </div>

              <!-- Meta Information -->
              <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span v-if="article.symbols && article.symbols.length > 0" class="flex items-center space-x-1">
                  <UIcon name="i-heroicons-building-office-2" class="w-4 h-4" />
                  <span>{{ article.symbols[0] }}</span>
                </span>
                <span class="flex items-center space-x-1">
                  <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                  <span>{{ formatDate(article.date) }}</span>
                </span>
              </div>

              <!-- Summary -->
              <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {{ article.content ? article.content.substring(0, 200) + '...' : 'No content available' }}
              </p>

              <!-- Actions -->
              <div class="flex items-center justify-between pt-2">
                <div class="flex items-center space-x-3">
                  <button
                    @click="toggleBookmark(article.link)"
                    class="text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <UIcon
                      :name="isBookmarked(article.link) ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
                      class="w-5 h-5"
                    />
                  </button>
                  <button
                    @click="shareArticle(article)"
                    class="text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <UIcon name="i-heroicons-share" class="w-5 h-5" />
                  </button>
                </div>
                <a
                  :href="article.link"
                  target="_blank"
                  class="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center space-x-1"
                >
                  <span>Read full article</span>
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </UCard>
      </TransitionGroup>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-6">
      <UPagination
        v-model:page="currentPage"
        :total="articles.length"
        :items-per-page="pageSize"
      />
    </div>

    <!-- News Summary Stats -->
    <UCard class="mt-6">
      <template #header>
        <h3 class="text-lg font-semibold">News Analysis Summary</h3>
      </template>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ articles.length }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Total Articles</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ positiveCount }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Positive News</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {{ neutralCount }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Neutral News</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-red-600 dark:text-red-400">
            {{ negativeCount }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Negative News</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  ticker: string;
  articles: any[];
  loading?: boolean;
}>();

defineEmits(['refresh']);

// Pagination
const currentPage = ref(1);
const pageSize = 5;

// Bookmarked articles (stored locally)
const bookmarkedArticles = ref(new Set<string>());

const totalPages = computed(() => Math.ceil(props.articles.length / pageSize));

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return props.articles.slice(start, end);
});

// Helper function to determine sentiment from polarity value
const getSentimentLabel = (polarity: number) => {
  if (polarity >= 0.6) return 'positive';
  if (polarity <= 0.4) return 'negative';
  return 'neutral';
};

// Sentiment counts
const positiveCount = computed(() =>
  props.articles.filter(a => getSentimentLabel(a.sentiment?.polarity || 0.5) === 'positive').length
);

const neutralCount = computed(() =>
  props.articles.filter(a => getSentimentLabel(a.sentiment?.polarity || 0.5) === 'neutral').length
);

const negativeCount = computed(() =>
  props.articles.filter(a => getSentimentLabel(a.sentiment?.polarity || 0.5) === 'negative').length
);

// Helper functions
const getSentimentBadgeColor = (polarity: number) => {
  const sentiment = getSentimentLabel(polarity);
  switch (sentiment) {
    case 'positive':
      return 'green';
    case 'negative':
      return 'red';
    case 'neutral':
    default:
      return 'gray';
  }
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

const toggleBookmark = (articleId: string) => {
  if (bookmarkedArticles.value.has(articleId)) {
    bookmarkedArticles.value.delete(articleId);
  } else {
    bookmarkedArticles.value.add(articleId);
  }
};

const isBookmarked = (articleId: string) => {
  return bookmarkedArticles.value.has(articleId);
};

const shareArticle = (article: any) => {
  if (navigator.share) {
    navigator.share({
      title: article.title,
      text: article.content?.substring(0, 200) + '...',
      url: article.link
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${article.title}\n\n${article.link}`);
    alert('Article link copied to clipboard!');
  }
};

</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
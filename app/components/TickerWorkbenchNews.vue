<template>
  <div class="space-y-6">
    <!-- News Articles List -->
    <div v-if="articles.length === 0" class="text-center py-12">
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
                  {{ article.headline }}
                </h3>
                <UBadge 
                  :color="getSentimentBadgeColor(article.sentiment)"
                  variant="subtle"
                  class="ml-2"
                >
                  {{ article.sentiment }}
                </UBadge>
              </div>

              <!-- Meta Information -->
              <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span class="flex items-center space-x-1">
                  <UIcon name="i-heroicons-building-office-2" class="w-4 h-4" />
                  <span>{{ article.source }}</span>
                </span>
                <span class="flex items-center space-x-1">
                  <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                  <span>{{ article.date }}</span>
                </span>
              </div>

              <!-- Summary -->
              <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {{ article.summary }}
              </p>

              <!-- Actions -->
              <div class="flex items-center justify-between pt-2">
                <div class="flex items-center space-x-3">
                  <button 
                    @click="toggleBookmark(article.id)"
                    class="text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <UIcon 
                      :name="isBookmarked(article.id) ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
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
                  :href="article.url"
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
        v-model="currentPage"
        :page-count="pageSize"
        :total="articles.length"
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
}>();

// Pagination
const currentPage = ref(1);
const pageSize = 5;

// Bookmarked articles (stored locally)
const bookmarkedArticles = ref(new Set<number>());

const totalPages = computed(() => Math.ceil(props.articles.length / pageSize));

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return props.articles.slice(start, end);
});

// Sentiment counts
const positiveCount = computed(() => 
  props.articles.filter(a => a.sentiment === 'positive').length
);

const neutralCount = computed(() => 
  props.articles.filter(a => a.sentiment === 'neutral').length
);

const negativeCount = computed(() => 
  props.articles.filter(a => a.sentiment === 'negative').length
);

// Helper functions
const getSentimentBadgeColor = (sentiment: string) => {
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

const toggleBookmark = (articleId: number) => {
  if (bookmarkedArticles.value.has(articleId)) {
    bookmarkedArticles.value.delete(articleId);
  } else {
    bookmarkedArticles.value.add(articleId);
  }
};

const isBookmarked = (articleId: number) => {
  return bookmarkedArticles.value.has(articleId);
};

const shareArticle = (article: any) => {
  if (navigator.share) {
    navigator.share({
      title: article.headline,
      text: article.summary,
      url: article.url
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${article.headline}\n\n${article.summary}\n\n${article.url}`);
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
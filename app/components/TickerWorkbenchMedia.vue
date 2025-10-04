<template>
  <div class="space-y-6">
    <!-- Main Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Media & Social</h2>
    </div>

    <!-- Grid Container for Side-by-Side Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Reddit Posts Section (Left) -->
      <div class="space-y-4">
        <!-- Reddit Header with Refresh Button -->
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Reddit Posts</h3>
          <UButton
            @click="$emit('refresh-reddit')"
            variant="soft"
            icon="i-heroicons-arrow-path"
            size="xs"
            :loading="loadingReddit"
          >
            Refresh
          </UButton>
        </div>

        <!-- Reddit Loading State -->
        <div v-if="loadingReddit" class="text-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl text-primary-600 mb-3" />
          <p class="text-sm text-gray-600 dark:text-gray-400">Refreshing Reddit posts...</p>
        </div>

        <!-- Reddit Empty State -->
        <div v-else-if="posts.length === 0" class="text-center py-8">
          <UIcon name="i-heroicons-document-magnifying-glass" class="text-4xl text-gray-400 mb-2" />
          <p class="text-sm text-gray-600 dark:text-gray-400">No Reddit posts found</p>
        </div>

        <!-- Reddit Posts List -->
        <div v-else class="space-y-3">
          <TransitionGroup name="list">
            <UCard
              v-for="post in paginatedPosts"
              :key="post.id"
              class="hover:shadow-md transition-shadow"
            >
              <div class="space-y-2">
                <!-- Post Title -->
                <h4 class="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                  {{ post.title }}
                </h4>

                <!-- Post Meta -->
                <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span class="flex items-center gap-1">
                    <UIcon name="i-heroicons-user-circle" class="w-3 h-3" />
                    <span>u/{{ post.author }}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <UIcon name="i-heroicons-user-group" class="w-3 h-3" />
                    <span>r/{{ post.subreddit }}</span>
                  </span>
                </div>

                <!-- Post Preview -->
                <p v-if="post.selftext && post.selftext.length > 0"
                   class="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                  {{ post.selftext }}
                </p>

                <!-- Post Stats -->
                <div class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex items-center gap-4 text-xs">
                    <div class="flex items-center gap-1">
                      <UIcon name="i-heroicons-arrow-up" class="w-3 h-3 text-orange-500" />
                      <span class="font-medium">{{ post.score }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <UIcon name="i-heroicons-chat-bubble-left" class="w-3 h-3 text-gray-500" />
                      <span>{{ post.num_comments }}</span>
                    </div>
                    <span class="text-gray-500">{{ formatDate(post.created_utc) }}</span>
                  </div>
                  <a
                    :href="post.permalink"
                    target="_blank"
                    class="text-primary-600 dark:text-primary-400 hover:underline text-xs"
                  >
                    <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3" />
                  </a>
                </div>

                <!-- Comments Toggle (if available) -->
                <div v-if="post.comments && post.comments.length > 0">
                  <UButton
                    size="xs"
                    variant="ghost"
                    @click="toggleComments(post.id)"
                    :icon="expandedPosts[post.id] ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                    class="w-full justify-center text-xs"
                  >
                    {{ expandedPosts[post.id] ? 'Hide' : 'Show' }} {{ post.comments.length }} Comments
                  </UButton>

                  <!-- Comments Section -->
                  <Transition name="slide-fade">
                    <div v-if="expandedPosts[post.id]" class="mt-3 space-y-2">
                      <div v-for="comment in post.comments.slice(0, 3)"
                           :key="comment.id"
                           class="pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span class="font-medium">u/{{ comment.author }}</span>
                          <span>•</span>
                          <span>{{ comment.score }} pts</span>
                        </div>
                        <p class="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{{ comment.body }}</p>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </UCard>
          </TransitionGroup>

          <!-- Reddit Pagination -->
          <div v-if="totalRedditPages > 1" class="flex justify-center mt-4">
            <UPagination
              v-model:page="currentRedditPage"
              :total="sortedPosts.length"
              :items-per-page="redditPageSize"
              size="xs"
            />
          </div>
        </div>
      </div>

      <!-- News Articles Section (Right) -->
      <div class="space-y-4">
        <!-- News Header with Refresh Button -->
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">News Articles</h3>
          <UButton
            @click="$emit('refresh-news')"
            variant="soft"
            icon="i-heroicons-arrow-path"
            size="xs"
            :loading="loadingNews"
          >
            Refresh
          </UButton>
        </div>

        <!-- News Loading State -->
        <div v-if="loadingNews" class="text-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl text-primary-600 mb-3" />
          <p class="text-sm text-gray-600 dark:text-gray-400">Refreshing news...</p>
        </div>

        <!-- News Empty State -->
        <div v-else-if="articles.length === 0" class="text-center py-8">
          <UIcon name="i-heroicons-newspaper" class="text-4xl text-gray-400 mb-2" />
          <p class="text-sm text-gray-600 dark:text-gray-400">No news articles found</p>
        </div>

        <!-- News Articles List -->
        <div v-else class="space-y-3">
          <TransitionGroup name="list">
            <UCard
              v-for="article in paginatedArticles"
              :key="article.id"
              class="hover:shadow-md transition-shadow"
            >
              <div class="space-y-2">
                <!-- Article Header -->
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                    {{ article.title }}
                  </h4>
                  <UBadge
                    :color="getSentimentBadgeColor(article.sentiment?.polarity || 0.5)"
                    variant="subtle"
                    size="xs"
                    class="flex-shrink-0"
                  >
                    {{ getSentimentLabel(article.sentiment?.polarity || 0.5) }}
                  </UBadge>
                </div>

                <!-- Article Meta -->
                <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span v-if="article.symbols && article.symbols.length > 0" class="flex items-center gap-1">
                    <UIcon name="i-heroicons-building-office-2" class="w-3 h-3" />
                    <span>{{ article.symbols[0] }}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                    <span>{{ formatNewsDate(article.date) }}</span>
                  </span>
                </div>

                <!-- Article Summary -->
                <p class="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
                  {{ article.content ? article.content.substring(0, 150) + '...' : 'No content available' }}
                </p>

                <!-- Article Actions -->
                <div class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex items-center gap-2">
                    <button
                      @click="toggleBookmark(article.link)"
                      class="text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <UIcon
                        :name="isBookmarked(article.link) ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
                        class="w-4 h-4"
                      />
                    </button>
                    <button
                      @click="shareArticle(article)"
                      class="text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <UIcon name="i-heroicons-share" class="w-4 h-4" />
                    </button>
                  </div>
                  <a
                    :href="article.link"
                    target="_blank"
                    class="text-primary-600 dark:text-primary-400 hover:underline text-xs flex items-center gap-1"
                  >
                    <span>Read</span>
                    <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3" />
                  </a>
                </div>
              </div>
            </UCard>
          </TransitionGroup>

          <!-- News Pagination -->
          <div v-if="totalNewsPages > 1" class="flex justify-center mt-4">
            <UPagination
              v-model:page="currentNewsPage"
              :total="articles.length"
              :items-per-page="newsPageSize"
              size="xs"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  posts: any[];
  articles: any[];
  subreddits: string[];
  ticker: string;
  loadingReddit?: boolean;
  loadingNews?: boolean;
}>();

defineEmits(['refresh-reddit', 'refresh-news']);

// Separate pagination for Reddit and News
const currentRedditPage = ref(1);
const currentNewsPage = ref(1);
const redditPageSize = 5;
const newsPageSize = 5;

// Expanded posts state for comments
const expandedPosts = ref<Record<string, boolean>>({});

// Bookmarked articles
const bookmarkedArticles = ref(new Set<string>());

// Sort posts by score and comments
const sortedPosts = computed(() => {
  return [...props.posts].sort((a, b) => {
    const aHasComments = a.comments?.length > 0 ? 1 : 0;
    const bHasComments = b.comments?.length > 0 ? 1 : 0;
    if (aHasComments !== bHasComments) {
      return bHasComments - aHasComments;
    }
    return (b.score || 0) - (a.score || 0);
  });
});

// Pagination calculations
const totalRedditPages = computed(() => Math.ceil(sortedPosts.value.length / redditPageSize));
const totalNewsPages = computed(() => Math.ceil(props.articles.length / newsPageSize));

const paginatedPosts = computed(() => {
  const start = (currentRedditPage.value - 1) * redditPageSize;
  const end = start + redditPageSize;
  return sortedPosts.value.slice(start, end);
});

const paginatedArticles = computed(() => {
  const start = (currentNewsPage.value - 1) * newsPageSize;
  const end = start + newsPageSize;
  return props.articles.slice(start, end);
});

// Summary calculations
const totalEngagement = computed(() => {
  const redditEngagement = props.posts.reduce((sum, post) =>
    sum + (post.score || 0) + (post.num_comments || 0), 0
  );
  return redditEngagement;
});

const overallSentiment = computed(() => {
  const sentiments = props.articles.map(a => getSentimentLabel(a.sentiment?.polarity || 0.5));
  const positive = sentiments.filter(s => s === 'positive').length;
  const negative = sentiments.filter(s => s === 'negative').length;
  const neutral = sentiments.filter(s => s === 'neutral').length;

  if (positive > negative && positive > neutral) return 'Positive';
  if (negative > positive && negative > neutral) return 'Negative';
  return 'Neutral';
});

const overallSentimentColor = computed(() => {
  switch (overallSentiment.value) {
    case 'Positive': return 'text-green-600 dark:text-green-400';
    case 'Negative': return 'text-red-600 dark:text-red-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
});

// Helper functions
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m ago`;
};

const formatNewsDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

const getSentimentLabel = (polarity: number) => {
  if (polarity >= 0.6) return 'positive';
  if (polarity <= 0.4) return 'negative';
  return 'neutral';
};

const getSentimentBadgeColor = (polarity: number) => {
  const sentiment = getSentimentLabel(polarity);
  switch (sentiment) {
    case 'positive': return 'green';
    case 'negative': return 'red';
    default: return 'gray';
  }
};

const toggleComments = (postId: string) => {
  expandedPosts.value[postId] = !expandedPosts.value[postId];
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
    navigator.clipboard.writeText(`${article.title}\n\n${article.link}`);
  }
};

// Reset pages when data changes
watch(() => props.posts, () => {
  currentRedditPage.value = 1;
});

watch(() => props.articles, () => {
  currentNewsPage.value = 1;
});
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

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
</style>
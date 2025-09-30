<template>
  <div class="space-y-6">
    <!-- Header with Refresh Button -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Reddit Posts</h2>
      <UButton
        @click="$emit('refresh')"
        variant="soft"
        icon="i-heroicons-arrow-path"
        size="sm"
        :loading="loading"
      >
        Refresh Posts
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary-600 mb-4" />
      <p class="text-gray-600 dark:text-gray-400">Refreshing Reddit posts...</p>
    </div>

    <!-- Posts List -->
    <div v-else-if="posts.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-document-magnifying-glass" class="text-5xl text-gray-400 mb-3" />
      <p class="text-gray-600 dark:text-gray-400">No Reddit posts found for this ticker</p>
    </div>

    <div v-else class="space-y-4">
      <TransitionGroup name="list">
        <UCard 
          v-for="post in paginatedPosts" 
          :key="post.id"
          class="hover:shadow-lg transition-shadow"
        >
          <div class="space-y-3">
            <!-- Post Header -->
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {{ post.title }}
                </h3>
                <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span class="flex items-center space-x-1">
                    <UIcon name="i-heroicons-user-circle" class="w-4 h-4" />
                    <span>u/{{ post.author }}</span>
                  </span>
                  <span class="flex items-center space-x-1">
                    <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                    <span>r/{{ post.subreddit }}</span>
                  </span>
                  <span class="flex items-center space-x-1">
                    <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                    <span>{{ formatDate(post.created_utc) }}</span>
                  </span>
                  <span v-if="post.sort_method" class="flex items-center space-x-1">
                    <UIcon :name="post.sort_method === 'hot' ? 'i-heroicons-fire' : 'i-heroicons-sparkles'" 
                           :class="post.sort_method === 'hot' ? 'text-orange-500' : 'text-blue-500'" 
                           class="w-4 h-4" />
                    <span :class="post.sort_method === 'hot' ? 'text-orange-500' : 'text-blue-500'">
                      {{ post.sort_method }}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Post Content Preview -->
            <div v-if="post.selftext && post.selftext.length > 0" class="text-sm text-gray-700 dark:text-gray-300">
              <p class="line-clamp-3">{{ post.selftext }}</p>
            </div>

            <!-- Post Stats and Actions -->
            <div class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center space-x-6">
                <div class="flex items-center space-x-2">
                  <UIcon name="i-heroicons-arrow-up" class="w-4 h-4 text-orange-500" />
                  <span class="text-sm font-medium">{{ post.score }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <UIcon name="i-heroicons-chat-bubble-left" class="w-4 h-4 text-gray-500" />
                  <span class="text-sm">{{ post.num_comments }} comments</span>
                </div>
                <UButton
                  v-if="post.comments && post.comments.length > 0"
                  size="xs"
                  variant="soft"
                  @click="toggleComments(post.id)"
                  :icon="expandedPosts[post.id] ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                >
                  {{ expandedPosts[post.id] ? 'Hide' : 'Show' }} {{ post.comments.length }} Comments
                </UButton>
              </div>
              <a 
                :href="post.permalink"
                target="_blank"
                class="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center space-x-1"
              >
                <span>View on Reddit</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
              </a>
            </div>

            <!-- Comments Section -->
            <Transition name="slide-fade">
              <div v-if="post.comments && post.comments.length > 0 && expandedPosts[post.id]" 
                   class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 class="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Top Comments</h4>
                <div class="space-y-3">
                  <div v-for="comment in post.comments" 
                       :key="comment.id" 
                       class="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span class="font-medium">u/{{ comment.author }}</span>
                      <span>•</span>
                      <span class="flex items-center space-x-1">
                        <UIcon name="i-heroicons-arrow-up" class="w-3 h-3" />
                        <span>{{ comment.score }}</span>
                      </span>
                      <span>•</span>
                      <span>{{ formatDate(comment.created_utc) }}</span>
                    </div>
                    <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">{{ comment.body }}</p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </UCard>
      </TransitionGroup>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-6">
      <UPagination
        v-model:page="currentPage"
        :total="sortedPosts.length"
        :items-per-page="pageSize"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  posts: any[];
  subreddits: string[];
  ticker: string;
  loading?: boolean;
}>();

defineEmits(['refresh']);

const currentPage = ref(1);
const pageSize = 10;
const expandedPosts = ref<Record<string, boolean>>({});

// Sort posts prioritizing those with comments and score
const sortedPosts = computed(() => {
  return [...props.posts].sort((a, b) => {
    // First prioritize posts with comments
    const aHasComments = a.comments?.length > 0 ? 1 : 0;
    const bHasComments = b.comments?.length > 0 ? 1 : 0;

    if (aHasComments !== bHasComments) {
      return bHasComments - aHasComments;
    }

    // Then sort by score
    return (b.score || 0) - (a.score || 0);
  });
});

const totalPages = computed(() => Math.ceil(sortedPosts.value.length / pageSize));

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return sortedPosts.value.slice(start, end);
});

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  }
};

const toggleComments = (postId: string) => {
  expandedPosts.value[postId] = !expandedPosts.value[postId];
};

// Reset page when posts change
watch(() => props.posts, () => {
  currentPage.value = 1;
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
  transform: translateX(-30px);
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

.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.line-clamp-4 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}
</style>
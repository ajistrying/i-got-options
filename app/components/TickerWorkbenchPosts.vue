<template>
  <div class="space-y-6">
    <!-- Posts List -->
    <div v-if="posts.length === 0" class="text-center py-12">
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
          </div>
        </UCard>
      </TransitionGroup>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-6">
      <UPagination
        v-model="currentPage"
        :page-count="pageSize"
        :total="sortedPosts.length"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  posts: any[];
  subreddits: string[];
  ticker: string;
}>();

const currentPage = ref(1);
const pageSize = 10;

// Simply sort posts by score by default
const sortedPosts = computed(() => {
  return [...props.posts].sort((a, b) => (b.score || 0) - (a.score || 0));
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
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    }
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
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
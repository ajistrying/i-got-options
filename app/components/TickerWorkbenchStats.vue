<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- Total Posts -->
    <UCard class="relative overflow-hidden">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.totalPosts || 0 }}
          </p>
        </div>
        <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
          <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </UCard>

    <!-- Average Score -->
    <UCard class="relative overflow-hidden">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.averageScore || 0 }}
          </p>
        </div>
        <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
          <UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
      </div>
    </UCard>

    <!-- Total Comments -->
    <UCard class="relative overflow-hidden">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Total Comments</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ formatNumber(stats.totalComments || 0) }}
          </p>
        </div>
        <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
          <UIcon name="i-heroicons-chat-bubble-left-right" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </UCard>

    <!-- Active Subreddits -->
    <UCard class="relative overflow-hidden">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Subreddits</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.uniqueSubreddits || 0 }}
          </p>
        </div>
        <div class="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
          <UIcon name="i-heroicons-user-group" class="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
      </div>
    </UCard>
  </div>

  <!-- Additional Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Top Post -->
    <UCard v-if="stats.topPost" class="shadow-lg">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Top Post</h3>
          <UBadge color="green" variant="subtle">
            Score: {{ stats.topPost.score }}
          </UBadge>
        </div>
      </template>
      <div class="space-y-3">
        <p class="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
          {{ stats.topPost.title }}
        </p>
        <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>r/{{ stats.topPost.subreddit }}</span>
          <span>{{ stats.topPost.num_comments }} comments</span>
        </div>
        <div class="flex items-center space-x-2">
          <a 
            :href="stats.topPost.permalink" 
            target="_blank"
            class="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center space-x-1"
          >
            <span>View on Reddit</span>
            <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
          </a>
        </div>
      </div>
    </UCard>

    <!-- Subreddit Distribution -->
    <UCard class="shadow-lg">
      <template #header>
        <h3 class="text-lg font-semibold">Post Distribution</h3>
      </template>
      <div v-if="stats.postsBySubreddit && Object.keys(stats.postsBySubreddit).length > 0" class="space-y-3">
        <div 
          v-for="[subreddit, count] in sortedSubreddits" 
          :key="subreddit"
          class="flex items-center justify-between"
        >
          <div class="flex items-center space-x-3 flex-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              r/{{ subreddit }}
            </span>
            <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(count / maxPostCount) * 100}%` }"
              />
            </div>
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-400 ml-3">
            {{ count }}
          </span>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
        No data available
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  stats: any;
  ticker: string;
}>();

const sortedSubreddits = computed(() => {
  if (!props.stats.postsBySubreddit) return [];
  return Object.entries(props.stats.postsBySubreddit)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Show top 5 subreddits
});

const maxPostCount = computed(() => {
  if (!props.stats.postsBySubreddit) return 0;
  return Math.max(...Object.values(props.stats.postsBySubreddit));
});

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};
</script>
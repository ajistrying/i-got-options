<template>
  <div v-if="results" class="space-y-6">
    <div class="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">
          Results for {{ results.ticker }}
        </h2>
        <span class="text-sm text-gray-500">
          {{ results.total_posts }} posts found
        </span>
      </div>
      
      <div class="text-xs text-gray-500 mb-4">
        Searched at: {{ new Date(results.timestamp).toLocaleString() }}
      </div>
      
      <UTabs :items="tabs" class="w-full">
        <template #formatted>
          <div class="mt-4 space-y-4">
            <div v-for="subredditResult in results.results" :key="subredditResult.subreddit">
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold">r/{{ subredditResult.subreddit }}</h3>
                    <UBadge>{{ subredditResult.count }} posts</UBadge>
                  </div>
                </template>
                
                <div v-if="subredditResult.error" class="text-red-500">
                  {{ subredditResult.error }}
                </div>
                
                <div v-else class="space-y-3">
                  <div
                    v-for="post in subredditResult.posts.slice(0, 5)"
                    :key="post.id"
                    class="border-l-2 border-gray-200 dark:border-gray-700 pl-3"
                  >
                    <div class="text-sm font-medium">{{ post.title }}</div>
                    <div class="text-xs text-gray-500 mt-1">
                      Score: {{ post.score }} | Comments: {{ post.num_comments }} | 
                      <a :href="post.permalink" target="_blank" class="text-blue-500 hover:underline">
                        View on Reddit
                      </a>
                    </div>
                  </div>
                  <div v-if="subredditResult.posts.length > 5" class="text-sm text-gray-500">
                    ... and {{ subredditResult.posts.length - 5 }} more posts
                  </div>
                </div>
              </UCard>
            </div>
          </div>
        </template>
        
        <template #raw>
          <div class="mt-4">
            <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-xs">{{ JSON.stringify(results, null, 2) }}</pre>
          </div>
        </template>
      </UTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  results: {
    type: Object,
    default: null
  }
});

const tabs = [
  {
    label: 'Formatted',
    slot: 'formatted'
  },
  {
    label: 'Raw JSON',
    slot: 'raw'
  }
];
</script>
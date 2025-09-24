<template>
  <div class="space-y-6">
    <!-- Timeline Header -->
    <div class="bg-white dark:bg-gray-900 rounded-lg p-4 shadow">
      <h3 class="text-lg font-semibold mb-2">Search Timeline</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Track the history of searches performed for {{ ticker }}
      </p>
    </div>

    <!-- Timeline -->
    <div v-if="searches.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-calendar-days" class="text-5xl text-gray-400 mb-3" />
      <p class="text-gray-600 dark:text-gray-400">No search history available</p>
    </div>

    <div v-else class="relative">
      <!-- Timeline line -->
      <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700"></div>

      <!-- Timeline items -->
      <div class="space-y-6">
        <div v-for="(search, index) in searches" :key="index" class="relative flex items-start">
          <!-- Timeline dot -->
          <div class="absolute left-8 w-4 h-4 bg-primary-600 rounded-full -translate-x-1/2 border-2 border-white dark:border-gray-900 z-10"></div>
          
          <!-- Content -->
          <div class="ml-16 flex-1">
            <UCard class="shadow-md">
              <div class="space-y-3">
                <!-- Date and Time -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                    <span>{{ formatFullDate(search.date) }}</span>
                  </div>
                  <UBadge size="sm" variant="subtle">
                    {{ search.totalPosts }} posts
                  </UBadge>
                </div>

                <!-- Subreddits -->
                <div>
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subreddits searched:
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <UBadge 
                      v-for="subreddit in search.subreddits" 
                      :key="subreddit"
                      color="gray"
                      variant="outline"
                      size="xs"
                    >
                      r/{{ subreddit }}
                    </UBadge>
                  </div>
                </div>

                <!-- Actions -->
                <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    @click="viewSearchDetails(search)"
                    class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    View search details →
                  </button>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Details Modal -->
    <UModal v-model="showDetailsModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Search Details</h3>
            <UButton 
              @click="showDetailsModal = false"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="sm"
            />
          </div>
        </template>

        <div v-if="selectedSearch" class="space-y-4">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Search Date</p>
            <p class="font-medium">{{ formatFullDate(selectedSearch.date) }}</p>
          </div>

          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Subreddits ({{ selectedSearch.subreddits.length }})</p>
            <div class="flex flex-wrap gap-2">
              <UBadge 
                v-for="subreddit in selectedSearch.subreddits" 
                :key="subreddit"
                color="primary"
                variant="subtle"
              >
                r/{{ subreddit }}
              </UBadge>
            </div>
          </div>

          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Results</p>
            <p class="font-medium">{{ selectedSearch.totalPosts }} posts found</p>
          </div>

          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <UButton 
              @click="repeatSearch"
              variant="soft"
              icon="i-heroicons-arrow-path"
              block
            >
              Repeat this search
            </UButton>
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  searches: any[];
  ticker: string;
}>();

const showDetailsModal = ref(false);
const selectedSearch = ref(null);

const viewSearchDetails = (search: any) => {
  selectedSearch.value = search;
  showDetailsModal.value = true;
};

const repeatSearch = () => {
  // Navigate to search page with pre-filled subreddits
  const subreddits = selectedSearch.value?.subreddits.join(',') || '';
  navigateTo({
    path: '/',
    query: {
      ticker: props.ticker,
      subreddits: subreddits
    }
  });
};

const formatFullDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  // Format time
  const timeFormat = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    }
    return `Today at ${timeFormat}`;
  } else if (diffInHours < 48) {
    return `Yesterday at ${timeFormat}`;
  } else if (diffInHours < 168) { // Less than a week
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} at ${timeFormat}`;
  } else {
    // Full date for older searches
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
};
</script>
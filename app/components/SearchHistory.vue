<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Recent Searches</h2>
      <UButton
        size="sm"
        variant="soft"
        @click="loadHistory"
        :loading="loading"
        icon="i-heroicons-arrow-path"
      >
        Refresh
      </UButton>
    </div>

    <div v-if="loading && !history.length" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl" />
    </div>

    <div v-else-if="!history.length" class="text-center text-gray-500 py-8">
      No search history yet. Start by searching for a ticker above.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="text-left py-3 px-4 font-semibold text-sm">Ticker</th>
            <th class="text-left py-3 px-4 font-semibold text-sm">Search Query</th>
            <th class="text-left py-3 px-4 font-semibold text-sm">Results</th>
            <th class="text-left py-3 px-4 font-semibold text-sm">Subreddits</th>
            <th class="text-left py-3 px-4 font-semibold text-sm">Date</th>
            <th class="text-left py-3 px-4 font-semibold text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="search in history"
            :key="search.id"
            class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            @click="$emit('select-search', search)"
          >
            <td class="py-3 px-4">
              <span class="font-bold text-primary-600 dark:text-primary-400">
                {{ search.ticker }}
              </span>
            </td>
            <td class="py-3 px-4 text-sm">
              {{ search.search_query || search.ticker }}
            </td>
            <td class="py-3 px-4">
              <UBadge size="xs" variant="subtle">
                {{ search.result_count }} posts
              </UBadge>
            </td>
            <td class="py-3 px-4">
              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="subreddit in search.subreddits"
                  :key="subreddit"
                  size="xs"
                  color="gray"
                  variant="solid"
                >
                  r/{{ subreddit }}
                </UBadge>
              </div>
            </td>
            <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
              {{ formatDate(search.created_at) }}
            </td>
            <td class="py-3 px-4">
              <UButton
                size="xs"
                color="red"
                variant="ghost"
                icon="i-heroicons-trash"
                @click.stop="deleteSearch(search.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center">
      <UPagination
        v-model="currentPage"
        :total="totalPages"
        :page-count="pageSize"
        @update:modelValue="loadHistory"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['select-search']);

const loading = ref(false);
const history = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (hours < 48) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const loadHistory = async () => {
  loading.value = true;
  try {
    const data = await $fetch('/api/searches/history', {
      query: {
        page: currentPage.value,
        limit: pageSize.value
      }
    });
    history.value = data.searches;
    totalPages.value = data.totalPages;
  } catch (error) {
    console.error('Failed to load search history:', error);
  } finally {
    loading.value = false;
  }
};

const deleteSearch = async (searchId: string) => {
  if (!confirm('Are you sure you want to delete this search?')) return;
  
  try {
    await $fetch(`/api/searches/${searchId}`, {
      method: 'DELETE'
    });
    await loadHistory();
  } catch (error) {
    console.error('Failed to delete search:', error);
  }
};

onMounted(() => {
  loadHistory();
});

// Refresh when a new search is completed
const refreshHistory = () => {
  loadHistory();
};

defineExpose({ refreshHistory });
</script>
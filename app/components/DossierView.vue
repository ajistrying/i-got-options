<template>
  <div v-if="ticker" class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Dossier for {{ ticker }}</h3>
      <UButton 
        size="sm" 
        variant="soft"
        @click="loadHistory"
        :loading="loading"
      >
        Refresh History
      </UButton>
    </div>
    
    <div v-if="loading" class="text-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>
    
    <div v-else-if="history.length === 0" class="text-center text-gray-500 py-8">
      No search history for {{ ticker }}
    </div>
    
    <div v-else class="space-y-4">
      <UCard v-for="search in history" :key="search.id">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">r/{{ search.subreddit }}</span>
            <span class="text-xs text-gray-500">
              {{ new Date(search.created_at).toLocaleString() }}
            </span>
          </div>
        </template>
        
        <div class="space-y-2">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Found {{ search.search_data.length }} posts
          </div>
          
          <UAccordion
            :items="[{
              label: 'View Raw Data',
              content: ''
            }]"
          >
            <template #content>
              <pre class="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">{{ JSON.stringify(search.search_data, null, 2) }}</pre>
            </template>
          </UAccordion>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  ticker: {
    type: String,
    default: ''
  }
});

const loading = ref(false);
const history = ref([]);

const loadHistory = async () => {
  if (!props.ticker) return;
  
  loading.value = true;
  try {
    const { getTickerHistory } = useRedditSearch();
    history.value = await getTickerHistory(props.ticker);
  } catch (error) {
    console.error('Failed to load history:', error);
  } finally {
    loading.value = false;
  }
};

watch(() => props.ticker, (newTicker) => {
  if (newTicker) {
    loadHistory();
  } else {
    history.value = [];
  }
}, { immediate: true });
</script>
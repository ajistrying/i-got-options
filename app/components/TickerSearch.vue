<template>
  <div class="space-y-4">
    <!-- Ticker Input -->
    <div>
      <label class="block text-sm font-medium mb-2">Stock Ticker</label>
      <UInput
        v-model="ticker"
        placeholder="Enter stock ticker (e.g., AAPL, GME, SPY)"
        size="lg"
        @keyup.enter="handleSearch"
      />
    </div>

    <!-- Subreddit Selection -->
    <div>
      <label class="block text-sm font-medium mb-2">
        Select Subreddits <span class="text-red-500">*</span>
      </label>
      <div v-if="loadingSubreddits" class="flex justify-center py-4">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-xl" />
      </div>
      <div v-else class="space-y-2">
        <div class="flex flex-wrap gap-2">
          <UCheckbox
            v-for="sub in availableSubreddits"
            :key="sub.id"
            v-model="selectedSubreddits"
            :value="sub.subreddit_name"
            :label="`r/${sub.subreddit_name}`"
          />
        </div>
        <div v-if="availableSubreddits.length === 0" class="text-sm text-gray-500">
          No subreddits available. 
          <NuxtLink to="/subreddits" class="text-primary-600 hover:underline">
            Add subreddits
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Selected Subreddits Display -->
    <div v-if="selectedSubreddits.length > 0" class="flex flex-wrap gap-2">
      <UBadge 
        v-for="sub in selectedSubreddits" 
        :key="sub"
        color="primary"
        variant="solid"
        size="sm"
        class="cursor-pointer hover:bg-primary-700"
        @click="removeSubreddit(sub)"
      >
        r/{{ sub }}
        <UIcon name="i-heroicons-x-mark" class="ml-1" />
      </UBadge>
    </div>

    <!-- Search Button -->
    <div class="flex gap-3">
      <UButton
        size="lg"
        @click="handleSearch"
        :loading="loading"
        :disabled="!ticker || selectedSubreddits.length === 0 || loading"
        class="flex-1"
        color="primary"
      >
        Search Reddit
      </UButton>
      <UButton
        size="lg"
        variant="outline"
        @click="clearForm"
        :disabled="loading"
      >
        Clear
      </UButton>
    </div>

    <!-- Validation Message -->
    <UAlert 
      v-if="showValidation" 
      color="yellow" 
      variant="subtle"
      icon="i-heroicons-exclamation-triangle"
    >
      Please select at least one subreddit to search
    </UAlert>

    <!-- Error Message -->
    <UAlert v-if="error" color="red" variant="subtle">
      {{ error }}
    </UAlert>
  </div>
</template>

<script setup lang="ts">
const ticker = ref('');
const selectedSubreddits = ref<string[]>([]);
const availableSubreddits = ref([]);
const loadingSubreddits = ref(false);
const showValidation = ref(false);

const { loading, error, searchTicker } = useRedditSearch();

const emit = defineEmits(['search-complete']);

const loadSubreddits = async () => {
  loadingSubreddits.value = true;
  try {
    const data = await $fetch('/api/subreddits');
    availableSubreddits.value = data.filter(sub => sub.active);
  } catch (error) {
    console.error('Failed to load subreddits:', error);
  } finally {
    loadingSubreddits.value = false;
  }
};

const removeSubreddit = (sub: string) => {
  selectedSubreddits.value = selectedSubreddits.value.filter(s => s !== sub);
};

const handleSearch = async () => {
  showValidation.value = false;
  
  if (!ticker.value) {
    showValidation.value = true;
    return;
  }
  
  if (selectedSubreddits.value.length === 0) {
    showValidation.value = true;
    return;
  }
  
  try {
    const results = await searchTicker(ticker.value, selectedSubreddits.value);
    emit('search-complete', results);
  } catch (err) {
    // Error is already handled in composable
  }
};

const clearForm = () => {
  ticker.value = '';
  selectedSubreddits.value = [];
  showValidation.value = false;
};

onMounted(() => {
  loadSubreddits();
});
</script>
<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Favorite Subreddits</h3>
      <UButton 
        size="sm" 
        variant="soft"
        @click="refreshSubreddits"
        :loading="loading"
      >
        Refresh
      </UButton>
    </div>
    
    <div v-if="loading && !subreddits.length" class="text-center py-4">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>
    
    <div v-else-if="subreddits.length" class="space-y-2">
      <div
        v-for="sub in subreddits"
        :key="sub.id"
        class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
      >
        <div class="flex items-center gap-2">
          <UCheckbox v-model="sub.active" disabled />
          <span class="text-sm">r/{{ sub.subreddit_name }}</span>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center text-gray-500 py-4">
      No subreddits found
    </div>
  </div>
</template>

<script setup lang="ts">
const loading = ref(false);
const subreddits = ref([]);

const refreshSubreddits = async () => {
  loading.value = true;
  try {
    const data = await $fetch('/api/subreddits');
    subreddits.value = data;
  } catch (error) {
    console.error('Failed to fetch subreddits:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  refreshSubreddits();
});
</script>
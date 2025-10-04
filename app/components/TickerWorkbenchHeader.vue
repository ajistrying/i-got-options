<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mb-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-6">
        <!-- Back Button -->
        <UButton
          @click="navigateBack"
          variant="ghost"
          size="sm"
          icon="i-heroicons-arrow-left"
        >
          Back
        </UButton>

        <!-- Ticker Symbol -->
        <div>
          <h1 class="text-4xl font-bold text-primary-600 dark:text-primary-400">
            {{ ticker }}
          </h1>
        </div>

        <!-- Search Info -->
        <div class="border-l border-gray-200 dark:border-gray-700 pl-6">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <div v-if="lastSearchTime" class="flex items-center space-x-2 mb-1">
              <UIcon name="i-heroicons-clock" class="w-4 h-4" />
              <span>Last full search: {{ formatDateString(lastSearchTime) }}</span>
            </div>
            <!-- Individual Data Source Timestamps -->
            <div class="flex items-center space-x-4 text-xs">
              <div v-if="redditSearchTime" class="flex items-center space-x-1">
                <UIcon name="i-simple-icons-reddit" class="w-3 h-3" />
                <span>Reddit: {{ formatDateString(redditSearchTime) }}</span>
              </div>
              <div v-if="newsDataTime" class="flex items-center space-x-1">
                <UIcon name="i-heroicons-newspaper" class="w-3 h-3" />
                <span>News: {{ formatDateString(newsDataTime) }}</span>
              </div>
              <div v-if="fundamentalsDataTime" class="flex items-center space-x-1">
                <UIcon name="i-heroicons-chart-bar" class="w-3 h-3" />
                <span>Fundamentals: {{ formatDateString(fundamentalsDataTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-3">
        <UButton
          @click="emit('open-journal')"
          variant="outline"
          icon="i-heroicons-document-text"
        >
          Journal
        </UButton>
        <UButton
          @click="handleRefresh"
          variant="soft"
          icon="i-heroicons-arrow-path"
          :loading="refreshing"
        >
          Run New Search
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  ticker: string;
  lastSearchTime: string | null;
  totalSearches: number;
  redditSearchTime?: string | null;
  newsDataTime?: string | null;
  fundamentalsDataTime?: string | null;
}>();

const emit = defineEmits(['refresh', 'delete', 'open-journal']);

const refreshing = ref(false);

const menuItems = [
  [{
    label: 'Export JSON',
    icon: 'i-heroicons-arrow-down-tray',
    click: () => exportData('json')
  }, {
    label: 'Export CSV', 
    icon: 'i-heroicons-arrow-down-tray',
    click: () => exportData('csv')
  }],
  [{
    label: 'Delete All Data',
    icon: 'i-heroicons-trash',
    click: () => confirmDelete()
  }]
];

const navigateBack = () => {
  navigateTo('/');
};

const handleRefresh = async () => {
  refreshing.value = true;
  emit('refresh');
  // The parent component will handle navigation
  setTimeout(() => {
    refreshing.value = false;
  }, 1000);
};

const formatDateString = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  return formatDate(dateString);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      // Format as date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }
};

const exportData = (format: 'json' | 'csv') => {
  // This will be handled by the parent component
  const event = new CustomEvent('export-data', { detail: { format } });
  window.dispatchEvent(event);
};

const confirmDelete = async () => {
  if (confirm(`Are you sure you want to delete all data for ${props.ticker}? This cannot be undone.`)) {
    emit('delete');
  }
};
</script>
<template>
  <div class="space-y-6">
    <!-- Header with Refresh Button -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Earnings Calls</h2>
      <UButton
        @click="$emit('refresh')"
        variant="soft"
        icon="i-heroicons-arrow-path"
        size="sm"
        :loading="loading"
      >
        Refresh Earnings
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary-600 mb-4" />
      <p class="text-gray-600 dark:text-gray-400">Refreshing earnings data...</p>
    </div>

    <!-- Earnings Overview -->
    <div v-else class="space-y-6">
    <!-- Earnings Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard class="text-center">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Latest EPS</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ latestEarnings?.eps || '$2.45' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Est: {{ latestEarnings?.epsEstimate || '$2.32' }}
          </p>
        </div>
      </UCard>

      <UCard class="text-center">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Latest Revenue</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ latestEarnings?.revenue || '$15.2B' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Est: {{ latestEarnings?.revenueEstimate || '$14.8B' }}
          </p>
        </div>
      </UCard>

      <UCard class="text-center">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Next Earnings</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Apr 25
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            In 21 days
          </p>
        </div>
      </UCard>
    </div>

    <!-- Earnings Call History -->
    <div v-if="earnings && earnings.length > 0" class="space-y-4">
      <TransitionGroup name="list">
        <UCard
          v-for="earning in earnings"
          :key="`${earning.year}-${earning.quarter}`"
          class="hover:shadow-lg transition-all duration-200"
        >
          <!-- Earnings Header -->
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <h3 class="text-lg font-semibold">Q{{ earning.quarter }} {{ earning.year }}</h3>
                <UBadge color="gray" variant="subtle">
                  {{ earning.symbol }}
                </UBadge>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(earning.date) }}
              </span>
            </div>
          </template>

          <!-- Earnings Content -->
          <div class="space-y-6">
            <!-- Transcript Section -->
            <div v-if="getTranscript(earning)" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                Transcript
              </h4>
              <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {{ getTranscript(earning) }}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center space-x-3">
                <UButton
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-document-text"
                  @click="fetchTranscript(earning)"
                  :loading="isLoadingTranscript(earning)"
                  :disabled="hasTranscript(earning)"
                >
                  {{ hasTranscript(earning) ? 'Transcript Loaded' : 'Retrieve Transcript' }}
                </UButton>
                <UButton
                  v-if="hasTranscript(earning)"
                  size="sm"
                  variant="ghost"
                  icon="i-heroicons-arrow-down-tray"
                  @click="downloadTranscript(earning)"
                >
                  Download
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </TransitionGroup>
    </div>

    <!-- No Earnings Data -->
    <div v-else class="text-center py-16">
      <UIcon name="i-heroicons-document-text" class="text-6xl text-gray-400 mb-4" />
      <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        No earnings calls available
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Click "Refresh Earnings" to fetch earnings call data for {{ ticker }}
      </p>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  ticker: string;
  earnings: any[];
  loading?: boolean;
}>();

const emit = defineEmits(['refresh']);

// State for transcript loading and storage
const loadingTranscripts = ref<Set<string>>(new Set());
const transcripts = ref<Map<string, any>>(new Map());

// Helper function to create unique key for earnings call
const getEarningKey = (earning: any) => `${earning.year}-${earning.quarter}`;

// Check if transcript is loading
const isLoadingTranscript = (earning: any) => {
  return loadingTranscripts.value.has(getEarningKey(earning));
};

// Check if transcript is loaded
const hasTranscript = (earning: any) => {
  return transcripts.value.has(getEarningKey(earning));
};

// Get transcript text
const getTranscript = (earning: any) => {
  const transcript = transcripts.value.get(getEarningKey(earning));
  if (!transcript) return null;

  // Format transcript data - adjust this based on actual API response structure
  return JSON.stringify(transcript, null, 2);
};

// Fetch transcript from API
const fetchTranscript = async (earning: any) => {
  const key = getEarningKey(earning);

  if (loadingTranscripts.value.has(key) || transcripts.value.has(key)) {
    return;
  }

  loadingTranscripts.value.add(key);

  try {
    const response = await $fetch('/api/roic/earnings-transcript', {
      method: 'POST',
      body: {
        ticker: props.ticker,
        year: earning.year,
        quarter: earning.quarter
      }
    });

    if (response.success && response.transcript) {
      transcripts.value.set(key, response.transcript);
    }
  } catch (error) {
    console.error('Failed to fetch transcript:', error);
    alert('Failed to fetch earnings call transcript. Please try again.');
  } finally {
    loadingTranscripts.value.delete(key);
  }
};

// Format date helper
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Download transcript as text file
const downloadTranscript = (earning: any) => {
  const transcript = transcripts.value.get(getEarningKey(earning));
  if (!transcript) return;

  const transcriptContent = `${props.ticker} - Q${earning.quarter} ${earning.year} Earnings Call Transcript
Date: ${formatDate(earning.date)}

${JSON.stringify(transcript, null, 2)}
  `;

  const blob = new Blob([transcriptContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${props.ticker}_Q${earning.quarter}_${earning.year}_transcript.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

// Get latest earnings (for summary cards - currently showing placeholder data)
const latestEarnings = computed(() => {
  return props.earnings && props.earnings.length > 0 ? props.earnings[0] : null;
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
  transform: translateY(10px);
}
</style>
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
                <UBadge color="neutral" variant="subtle">
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
            <!-- Transcript Section - Show if transcript exists -->
            <div v-if="hasTranscript(earning)">
              <button
                @click="toggleTranscript(earning)"
                class="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <UIcon
                    :name="isTranscriptExpanded(earning) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                    class="text-lg"
                  />
                  <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Transcript
                  </h4>
                </div>
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-heroicons-arrow-down-tray"
                  @click.stop="downloadTranscript(earning)"
                >
                  Download
                </UButton>
              </button>

              <!-- Transcript Content (Toggleable) -->
              <div
                v-if="isTranscriptExpanded(earning)"
                class="mt-2 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-mono">
                  {{ getTranscript(earning) }}
                </div>
              </div>
            </div>

            <!-- Retrieve Transcript Button - Show if transcript doesn't exist -->
            <div v-else class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <UIcon name="i-heroicons-document-text" class="text-lg text-gray-500" />
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    Earnings call transcript not retrieved
                  </span>
                </div>
                <UButton
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-document-text"
                  @click="fetchTranscript(earning)"
                  :loading="isLoadingTranscript(earning)"
                >
                  Retrieve Transcript
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
const expandedTranscripts = ref<Set<string>>(new Set());

// Check database for existing transcripts on load
const checkExistingTranscripts = async () => {
  try {
    const response = await $fetch('/api/roic/earnings-transcripts-check', {
      method: 'POST',
      body: { ticker: props.ticker, earningsCalls: props.earnings }
    });

    if (response.success && response.transcripts) {
      Object.entries(response.transcripts).forEach(([key, transcript]) => {
        transcripts.value.set(key, transcript);
      });
    }
  } catch (error) {
    console.error('Failed to check existing transcripts:', error);
  }
};

// Watch for changes in earnings data and check for existing transcripts
watch(() => props.earnings, async (newEarnings) => {
  if (newEarnings && newEarnings.length > 0) {
    await checkExistingTranscripts();
  }
}, { immediate: true });

// Helper function to create unique key for earnings call
const getEarningKey = (earning: any) => `${earning.year}-${earning.quarter}`;

// Toggle transcript expansion
const toggleTranscript = (earning: any) => {
  const key = getEarningKey(earning);
  expandedTranscripts.value.has(key)
    ? expandedTranscripts.value.delete(key)
    : expandedTranscripts.value.add(key);
};

// Check if transcript is expanded
const isTranscriptExpanded = (earning: any) => {
  return expandedTranscripts.value.has(getEarningKey(earning));
};

// Check if transcript is loading
const isLoadingTranscript = (earning: any) => {
  return loadingTranscripts.value.has(getEarningKey(earning));
};

// Check if transcript is loaded
const hasTranscript = (earning: any) => {
  return transcripts.value.has(getEarningKey(earning));
};

// Format transcript for display
const formatTranscript = (transcriptData: any): string => {
  if (!transcriptData) return '';

  // If it's a string, return it directly
  if (typeof transcriptData === 'string') return transcriptData;

  // If it has a transcript property (nested structure)
  if (transcriptData.transcript) {
    return formatTranscript(transcriptData.transcript);
  }

  // If it's an array of sections/speakers
  if (Array.isArray(transcriptData)) {
    return transcriptData.map((section: any, index: number) => {
      if (typeof section === 'string') return section;

      // Format section with speaker
      if (section.speaker && section.text) {
        const speakerPrefix = index > 0 ? '\n' : '';
        return `${speakerPrefix}${section.speaker}:\n${section.text}`;
      }

      // Format section with title and content
      if (section.title && section.content) {
        return `=== ${section.title} ===\n${section.content}\n`;
      }

      return JSON.stringify(section, null, 2);
    }).join('\n\n');
  }

  // If it has sections property
  if (transcriptData.sections && Array.isArray(transcriptData.sections)) {
    return formatTranscript(transcriptData.sections);
  }

  // If it has text or content property
  if (transcriptData.text) return transcriptData.text;
  if (transcriptData.content) return transcriptData.content;

  // Fallback to formatted JSON
  return JSON.stringify(transcriptData, null, 2);
};

// Get transcript text
const getTranscript = (earning: any) => {
  const transcript = transcripts.value.get(getEarningKey(earning));
  return transcript ? formatTranscript(transcript) : null;
};

// Fetch transcript from API
const fetchTranscript = async (earning: any) => {
  const key = getEarningKey(earning);
  if (loadingTranscripts.value.has(key) || transcripts.value.has(key)) return;

  loadingTranscripts.value.add(key);

  try {
    const response = await $fetch('/api/roic/earnings-transcript', {
      method: 'POST',
      body: { ticker: props.ticker, year: earning.year, quarter: earning.quarter }
    });

    if (response.success && 'transcript' in response && response.transcript) {
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
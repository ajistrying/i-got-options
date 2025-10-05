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
    <div v-if="earnings && earnings.length > 0">
      <TransitionGroup name="list" tag="div" class="space-y-4">
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
                <div class="flex items-center space-x-2">
                  <UButton
                    size="xs"
                    variant="ghost"
                    icon="i-heroicons-sparkles"
                    @click.stop="generateSummary(earning)"
                    :loading="isLoadingSummary(earning)"
                  >
                    {{ hasSummary(earning) ? 'Regenerate Summary' : 'Generate Summary' }}
                  </UButton>
                  <UButton
                    size="xs"
                    variant="ghost"
                    icon="i-heroicons-arrow-down-tray"
                    @click.stop="downloadTranscript(earning)"
                  >
                    Download
                  </UButton>
                </div>
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

            <!-- AI Summary Section - Show if summary exists -->
            <div v-if="hasSummary(earning)" class="mt-6">
              <button
                @click="toggleSummary(earning)"
                class="w-full flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <UIcon
                    :name="isSummaryExpanded(earning) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                    class="text-lg"
                  />
                  <UIcon name="i-heroicons-sparkles" class="text-lg text-blue-600 dark:text-blue-400" />
                  <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">
                    AI Summary
                  </h4>
                </div>
              </button>

              <!-- Summary Content (Toggleable) -->
              <div
                v-if="isSummaryExpanded(earning)"
                class="mt-2 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div v-if="getSummary(earning)" class="space-y-4 text-sm">
                  <!-- Positives -->
                  <div v-if="getSummary(earning).positives?.length > 0">
                    <h5 class="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center">
                      <UIcon name="i-heroicons-arrow-trending-up" class="mr-2" />
                      Key Positives
                    </h5>
                    <div class="text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(getSummary(earning).positives)" />
                  </div>

                  <!-- Negatives -->
                  <div v-if="getSummary(earning).negatives?.length > 0">
                    <h5 class="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center">
                      <UIcon name="i-heroicons-arrow-trending-down" class="mr-2" />
                      Key Challenges
                    </h5>
                    <div class="text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(getSummary(earning).negatives)" />
                  </div>

                  <!-- Short-term Impacts -->
                  <div v-if="getSummary(earning).shortTermImpacts?.length > 0">
                    <h5 class="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center">
                      <UIcon name="i-heroicons-clock" class="mr-2" />
                      Short-term Impacts (1-3 quarters)
                    </h5>
                    <div class="text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(getSummary(earning).shortTermImpacts)" />
                  </div>

                  <!-- Medium-term Impacts -->
                  <div v-if="getSummary(earning).mediumTermImpacts?.length > 0">
                    <h5 class="font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center">
                      <UIcon name="i-heroicons-calendar" class="mr-2" />
                      Medium-term Impacts (1-2 years)
                    </h5>
                    <div class="text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(getSummary(earning).mediumTermImpacts)" />
                  </div>

                  <!-- Long-term Impacts -->
                  <div v-if="getSummary(earning).longTermImpacts?.length > 0">
                    <h5 class="font-semibold text-indigo-700 dark:text-indigo-400 mb-2 flex items-center">
                      <UIcon name="i-heroicons-chart-bar" class="mr-2" />
                      Long-term Impacts (2+ years)
                    </h5>
                    <div class="text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(getSummary(earning).longTermImpacts)" />
                  </div>

                  <!-- Management Commentary -->
                  <div v-if="getSummary(earning).managementCommentary?.length > 0">
                    <h5 class="font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center">
                      <UIcon name="i-heroicons-chat-bubble-left-right" class="mr-2" />
                      Notable Management Commentary
                    </h5>
                    <div class="text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(getSummary(earning).managementCommentary)" />
                  </div>

                  <!-- Market Context -->
                  <div v-if="getSummary(earning).marketContext">
                    <h5 class="font-semibold text-teal-700 dark:text-teal-400 mb-2 flex items-center">
                      <UIcon name="i-heroicons-globe-alt" class="mr-2" />
                      Market Context
                    </h5>
                    <div class="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(getSummary(earning).marketContext)" />
                  </div>
                </div>
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
import { marked } from 'marked';

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

// State for AI summary loading and storage
const loadingSummaries = ref<Set<string>>(new Set());
const summaries = ref<Map<string, any>>(new Map());
const expandedSummaries = ref<Set<string>>(new Set());

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

    if (response.success && response.summaries) {
      Object.entries(response.summaries).forEach(([key, summary]) => {
        summaries.value.set(key, summary);
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

// Check if summary is loading
const isLoadingSummary = (earning: any) => {
  return loadingSummaries.value.has(getEarningKey(earning));
};

// Check if summary exists
const hasSummary = (earning: any) => {
  const summary = summaries.value.has(getEarningKey(earning));
  return summary;
};

// Get summary data
const getSummary = (earning: any) => {
  return summaries.value.get(getEarningKey(earning)) || null;
};

// Toggle summary expansion
const toggleSummary = (earning: any) => {
  const key = getEarningKey(earning);
  expandedSummaries.value.has(key)
    ? expandedSummaries.value.delete(key)
    : expandedSummaries.value.add(key);
};

// Check if summary is expanded
const isSummaryExpanded = (earning: any) => {
  return expandedSummaries.value.has(getEarningKey(earning));
};

// Render markdown to HTML
const renderMarkdown = (text: string) => {
  if (!text) return '';
  return marked.parse(text, {
    async: false,
    breaks: true,  // Convert single line breaks to <br>
    gfm: true      // Enable GitHub Flavored Markdown
  }) as string;
};

// Generate AI summary of transcript
const generateSummary = async (earning: any) => {
  const key = getEarningKey(earning);
  if (loadingSummaries.value.has(key) || summaries.value.has(key)) return;

  loadingSummaries.value.add(key);

  try {
    const response = await $fetch('/api/openai/summarizeEarningsCallTranscript', {
      method: 'POST',
      body: { ticker: props.ticker, year: earning.year, quarter: earning.quarter }
    });

    if (response.success && 'summary' in response && response.summary) {
      summaries.value.set(key, response.summary);
    }
  } catch (error) {
    console.error('Failed to generate summary:', error);
    alert('Failed to generate AI summary. Please ensure the transcript is loaded and try again.');
  } finally {
    loadingSummaries.value.delete(key);
  }
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
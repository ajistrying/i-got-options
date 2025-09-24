<template>
  <div class="space-y-6">
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
    <div class="space-y-4">
      <TransitionGroup name="list">
        <UCard 
          v-for="earning in earnings" 
          :key="earning.id"
          class="hover:shadow-lg transition-all duration-200"
        >
          <!-- Earnings Header -->
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <h3 class="text-lg font-semibold">{{ earning.date }}</h3>
                <UBadge 
                  :color="earning.sentiment === 'bullish' ? 'green' : earning.sentiment === 'bearish' ? 'red' : 'gray'"
                  variant="subtle"
                >
                  {{ earning.sentiment }}
                </UBadge>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ earning.callDate }}
              </span>
            </div>
          </template>

          <!-- Earnings Content -->
          <div class="space-y-6">
            <!-- Key Metrics -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400">EPS</p>
                <p class="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {{ earning.eps }}
                </p>
                <p class="text-xs" :class="getMetricColor(earning.eps, earning.epsEstimate)">
                  vs {{ earning.epsEstimate }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400">Revenue</p>
                <p class="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {{ earning.revenue }}
                </p>
                <p class="text-xs" :class="getMetricColor(earning.revenue, earning.revenueEstimate)">
                  vs {{ earning.revenueEstimate }}
                </p>
              </div>
              <div class="md:col-span-2">
                <p class="text-xs text-gray-600 dark:text-gray-400">Next Quarter Guidance</p>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Revenue: {{ earning.guidanceNext.revenue }}
                </p>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  EPS: {{ earning.guidanceNext.eps }}
                </p>
              </div>
            </div>

            <!-- Transcript Highlights -->
            <div>
              <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                Key Highlights
              </h4>
              <ul class="space-y-2">
                <li 
                  v-for="(highlight, index) in earning.transcriptHighlights" 
                  :key="index"
                  class="flex items-start space-x-2"
                >
                  <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ highlight }}</span>
                </li>
              </ul>
            </div>

            <!-- CEO Quotes -->
            <div v-if="earning.ceoQuotes && earning.ceoQuotes.length > 0">
              <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                CEO Commentary
              </h4>
              <div class="space-y-3">
                <blockquote 
                  v-for="(quote, index) in earning.ceoQuotes" 
                  :key="index"
                  class="border-l-4 border-primary-600 pl-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-r"
                >
                  <p class="text-sm italic text-gray-700 dark:text-gray-300">
                    "{{ quote }}"
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    — CEO, {{ ticker }}
                  </p>
                </blockquote>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center space-x-3">
                <UButton
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-document-text"
                  @click="downloadTranscript(earning)"
                >
                  Full Transcript
                </UButton>
                <UButton
                  size="sm"
                  variant="ghost"
                  icon="i-heroicons-play"
                  @click="playAudioRecording(earning)"
                >
                  Audio Recording
                </UButton>
              </div>
              <UButton
                size="sm"
                variant="ghost"
                icon="i-heroicons-arrow-top-right-on-square"
                @click="openInvestorRelations()"
              >
                Investor Relations
              </UButton>
            </div>
          </div>
        </UCard>
      </TransitionGroup>
    </div>

    <!-- Earnings Calendar -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Upcoming Earnings Events</h3>
      </template>
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-primary-100 dark:bg-primary-900 rounded">
              <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Q1 2025 Earnings Call</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">April 25, 2025 • 4:30 PM EST</p>
            </div>
          </div>
          <UButton
            size="sm"
            variant="soft"
            icon="i-heroicons-bell"
          >
            Set Reminder
          </UButton>
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <UIcon name="i-heroicons-presentation-chart-line" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Annual Shareholder Meeting</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">June 15, 2025 • Virtual Event</p>
            </div>
          </div>
          <UButton
            size="sm"
            variant="ghost"
            icon="i-heroicons-arrow-right"
          >
            Details
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  ticker: string;
  earnings: any[];
}>();

// Get latest earnings
const latestEarnings = computed(() => {
  return props.earnings && props.earnings.length > 0 ? props.earnings[0] : null;
});

// Helper functions
const getMetricColor = (actual: string, estimate: string) => {
  // Simple comparison based on string values
  // In a real app, you'd parse and compare numerical values
  const actualNum = parseFloat(actual.replace(/[$B]/g, ''));
  const estimateNum = parseFloat(estimate.replace(/[$B]/g, ''));
  
  if (actualNum > estimateNum) {
    return 'text-green-600 dark:text-green-400';
  } else if (actualNum < estimateNum) {
    return 'text-red-600 dark:text-red-400';
  }
  return 'text-gray-600 dark:text-gray-400';
};

const downloadTranscript = (earning: any) => {
  // Simulate downloading transcript
  const transcriptContent = `
${props.ticker} - ${earning.date} Earnings Call Transcript
Date: ${earning.callDate}

Key Metrics:
- EPS: ${earning.eps} (Est: ${earning.epsEstimate})
- Revenue: ${earning.revenue} (Est: ${earning.revenueEstimate})

Highlights:
${earning.transcriptHighlights.join('\n')}

CEO Commentary:
${earning.ceoQuotes.join('\n\n')}

Forward Guidance:
- Revenue: ${earning.guidanceNext.revenue}
- EPS: ${earning.guidanceNext.eps}
  `;
  
  const blob = new Blob([transcriptContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${props.ticker}_${earning.date}_transcript.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

const playAudioRecording = (earning: any) => {
  // In a real app, this would open an audio player
  alert(`Audio recording for ${earning.date} earnings call would play here`);
};

const openInvestorRelations = () => {
  // In a real app, this would open the company's IR page
  window.open(`https://investors.example.com/${props.ticker.toLowerCase()}`, '_blank');
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
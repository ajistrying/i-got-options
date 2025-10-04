<template>
  <div>
    <!-- Main Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Sentiment Score -->
      <UCard class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Sentiment</p>
            <div class="flex items-center space-x-2">
              <p class="text-2xl font-bold" :class="sentimentColor">
                {{ sentimentDisplay }}
              </p>
              <span class="text-sm" :class="sentimentColor">
                {{ sentimentEmoji }}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ stats.sentiment?.positive || 65 }}% positive
            </p>
          </div>
        </div>
      </UCard>

      <!-- Analyst Rating -->
      <UCard class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Analyst Rating</p>
            <div class="flex items-center space-x-2">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {{ stats.analystRating?.score || 4.2 }}
              </p>
              <span class="text-sm text-gray-500">/5</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              from {{ stats.analystRating?.count || 12 }} analysts
            </p>
          </div>
        </div>
      </UCard>

      <!-- Stock Price -->
      <UCard class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Stock Price</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${{ stats.currentPrice || '145.32' }}
            </p>
            <div class="flex items-center space-x-1 mt-1">
              <UIcon :name="priceChangeIcon" class="w-6 h-4" :class="priceChangeColor" />
              <span class="text-xs" :class="priceChangeColor">
                {{ priceChangeDisplay }}
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Meme Factor -->
      <UCard class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Meme Factor</p>
            <div class="flex items-center space-x-2">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {{ stats.memeFactor?.score || 8.5 }}
              </p>
              <span class="text-xl">{{ memeEmoji }}</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ stats.memeFactor?.momentum || '🔥 Hot' }}
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  stats: any;
  ticker: string;
}>();

// Sentiment calculations
const sentimentScore = computed(() => props.stats.sentiment?.score || 0.55);
const sentimentDisplay = computed(() => {
  const score = sentimentScore.value;
  if (score > 0.5) return 'Bullish';
  if (score < -0.5) return 'Bearish';
  return 'Neutral';
});

const sentimentColor = computed(() => {
  const score = sentimentScore.value;
  if (score > 0.5) return 'text-green-600 dark:text-green-400';
  if (score < -0.5) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
});

const sentimentBgColor = computed(() => {
  const score = sentimentScore.value;
  if (score > 0.5) return 'bg-green-100 dark:bg-green-900';
  if (score < -0.5) return 'bg-red-100 dark:bg-red-900';
  return 'bg-gray-100 dark:bg-gray-800';
});

const sentimentIconColor = computed(() => {
  const score = sentimentScore.value;
  if (score > 0.5) return 'text-green-600 dark:text-green-400';
  if (score < -0.5) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
});

const sentimentEmoji = computed(() => {
  const score = sentimentScore.value;
  if (score > 0.7) return '🚀';
  if (score > 0.3) return '📈';
  if (score < -0.7) return '📉';
  if (score < -0.3) return '⚠️';
  return '➖';
});

// Price change calculations
const priceChange = computed(() => props.stats.priceChange || 3.45);
const priceChangePercent = computed(() => props.stats.priceChangePercent || 2.43);

const priceChangeDisplay = computed(() => {
  const change = priceChange.value;
  const percent = priceChangePercent.value;
  const sign = change >= 0 ? '+' : '';
  return `${sign}$${Math.abs(change).toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
});

const priceChangeColor = computed(() => {
  return priceChange.value >= 0 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';
});

const priceChangeIcon = computed(() => {
  return priceChange.value >= 0 
    ? 'i-heroicons-arrow-trending-up' 
    : 'i-heroicons-arrow-trending-down';
});

// Meme factor
const memeEmoji = computed(() => {
  const score = props.stats.memeFactor?.score || 8.5;
  if (score >= 9) return '🔥🔥🔥';
  if (score >= 7) return '🔥🔥';
  if (score >= 5) return '🔥';
  if (score >= 3) return '💫';
  return '❄️';
});

// Sentiment distribution
const sentimentDistribution = computed(() => {
  return props.stats.sentimentDistribution || [
    { label: "Very Positive", value: 25 },
    { label: "Positive", value: 40 },
    { label: "Neutral", value: 25 },
    { label: "Negative", value: 8 },
    { label: "Very Negative", value: 2 }
  ];
});

const positiveSentimentTotal = computed(() => {
  const dist = sentimentDistribution.value;
  return dist
    .filter(item => item.label.toLowerCase().includes('positive') && !item.label.toLowerCase().includes('negative'))
    .reduce((sum, item) => sum + item.value, 0);
});

const neutralSentimentTotal = computed(() => {
  const dist = sentimentDistribution.value;
  return dist
    .filter(item => item.label.toLowerCase().includes('neutral'))
    .reduce((sum, item) => sum + item.value, 0);
});

const negativeSentimentTotal = computed(() => {
  const dist = sentimentDistribution.value;
  return dist
    .filter(item => item.label.toLowerCase().includes('negative'))
    .reduce((sum, item) => sum + item.value, 0);
});

const getSentimentBarColor = (label: string) => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('very positive')) return 'bg-green-600';
  if (lowerLabel.includes('positive') && !lowerLabel.includes('negative')) return 'bg-green-500';
  if (lowerLabel.includes('neutral')) return 'bg-gray-500';
  if (lowerLabel.includes('very negative')) return 'bg-red-600';
  if (lowerLabel.includes('negative')) return 'bg-red-500';
  return 'bg-gray-500';
};
</script>
<template>
  <div class="space-y-8">
    <!-- Header with Period Selector -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Fundamental Data
      </h2>
      <UButtonGroup>
        <UButton
          :variant="selectedPeriod === 'yearly' ? 'solid' : 'outline'"
          @click="selectedPeriod = 'yearly'"
          size="sm"
        >
          Yearly
        </UButton>
        <UButton
          :variant="selectedPeriod === 'quarterly' ? 'solid' : 'outline'"
          @click="selectedPeriod = 'quarterly'"
          size="sm"
        >
          Quarterly
        </UButton>
      </UButtonGroup>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl text-primary-600" />
    </div>

    <!-- No Data State -->
    <div v-else-if="!hasData" class="text-center py-8">
      <UIcon name="i-heroicons-chart-bar" class="text-5xl text-gray-400 mb-4" />
      <p class="text-gray-500 dark:text-gray-400">
        No fundamental data available for {{ ticker }}
      </p>
      <UButton @click="fetchFundamentalData" variant="outline" size="sm" class="mt-4">
        Fetch Fundamental Data
      </UButton>
    </div>

    <!-- Charts Stack -->
    <div v-else class="space-y-6">
      <!-- Revenue & Net Income Chart -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Revenue & Net Income</h3>
        </template>
        <LineChart
          :data="revenueIncomeData"
          :categories="revenueIncomeCategories"
          :height="300"
          :x-formatter="(i) => revenueIncomeData[i]?.period || ''"
          :y-formatter="formatCurrency"
          :show-legend="true"
          :curve-type="'linear'"
        />
      </UCard>

      <!-- Cash Flow Chart -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Cash Flow</h3>
        </template>
        <BarChart
          :data="cashFlowData"
          :categories="cashFlowCategories"
          :y-axis="['operating', 'investing', 'financing']"
          :height="300"
          :x-formatter="(i) => cashFlowData[i]?.period || ''"
          :y-formatter="formatCurrency"
          :show-legend="true"
        />
      </UCard>

      <!-- Profitability Margins Chart -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Profitability Margins</h3>
        </template>
        <LineChart
          :data="marginData"
          :categories="marginCategories"
          :height="300"
          :x-formatter="(i) => marginData[i]?.period || ''"
          :y-formatter="formatPercentage"
          :show-legend="true"
          :curve-type="'linear'"
        />
      </UCard>

      <!-- Balance Sheet Chart -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Balance Sheet Overview</h3>
        </template>
        <BarChart
          :data="balanceSheetData"
          :categories="balanceSheetCategories"
          :y-axis="['assets', 'liabilities', 'equity']"
          :height="300"
          :x-formatter="(i) => balanceSheetData[i]?.period || ''"
          :y-formatter="formatCurrency"
          :show-legend="true"
          :stacked="false"
        />
      </UCard>

      <!-- Free Cash Flow Chart -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Free Cash Flow</h3>
        </template>
        <BarChart
          :data="freeCashFlowData"
          :categories="freeCashFlowCategories"
          :y-axis="['freeCashFlow']"
          :height="300"
          :x-formatter="(i) => freeCashFlowData[i]?.period || ''"
          :y-formatter="formatCurrency"
          :show-legend="false"
        />
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LineChart, BarChart } from '#components';

const props = defineProps<{
  ticker: string;
}>();

const loading = ref(false);
const fundamentalData = ref<any>(null);
const selectedPeriod = ref<'yearly' | 'quarterly'>('yearly');

const hasData = computed(() => {
  return fundamentalData.value && fundamentalData.value.financials;
});

// Format large numbers with appropriate suffixes
const formatValue = (value: number): string => {
  if (value === null || value === undefined) return 'N/A';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e12) {
    return `${sign}$${(absValue / 1e12).toFixed(2)}T`;
  } else if (absValue >= 1e9) {
    return `${sign}$${(absValue / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}$${(absValue / 1e6).toFixed(2)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}$${(absValue / 1e3).toFixed(2)}K`;
  } else {
    return `${sign}$${absValue.toFixed(2)}`;
  }
};

const formatCurrency = (value: number): string => {
  return formatValue(value);
};

const formatPercentage = (value: number): string => {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
};

// Helper function to get period label
const getPeriodLabel = (period: string): string => {
  // For quarterly data: "2024-09-30" -> "Q3 2024"
  // For yearly data: "2024-12-31" -> "2024"
  const date = new Date(period);
  const year = date.getFullYear();

  if (selectedPeriod.value === 'quarterly') {
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    return `Q${quarter} ${year}`;
  }

  return year.toString();
};

// Revenue & Income Data
const revenueIncomeData = computed(() => {
  if (!hasData.value) return [];

  const incomeStatement = fundamentalData.value.financials.incomeStatement[selectedPeriod.value];
  if (!incomeStatement || !Array.isArray(incomeStatement)) return [];

  return incomeStatement.slice(0, 8).reverse().map(item => ({
    period: getPeriodLabel(item.period),
    revenue: item.totalRevenue || 0,
    netIncome: item.netIncome || 0
  }));
});

const revenueIncomeCategories = {
  revenue: { name: 'Revenue', color: '#3b82f6' },
  netIncome: { name: 'Net Income', color: '#10b981' }
};

// Cash Flow Data
const cashFlowData = computed(() => {
  if (!hasData.value) return [];

  const cashFlow = fundamentalData.value.financials.cashFlow[selectedPeriod.value];
  if (!cashFlow || !Array.isArray(cashFlow)) return [];

  return cashFlow.slice(0, 8).reverse().map(item => ({
    period: getPeriodLabel(item.period),
    operating: item.totalCashFromOperatingActivities || 0,
    investing: item.totalCashflowsFromInvestingActivities || 0,
    financing: item.totalCashFromFinancingActivities || 0
  }));
});

const cashFlowCategories = {
  operating: { name: 'Operating', color: '#3b82f6' },
  investing: { name: 'Investing', color: '#f59e0b' },
  financing: { name: 'Financing', color: '#8b5cf6' }
};

// Margin Data
const marginData = computed(() => {
  if (!hasData.value) return [];

  const incomeStatement = fundamentalData.value.financials.incomeStatement[selectedPeriod.value];
  if (!incomeStatement || !Array.isArray(incomeStatement)) return [];

  return incomeStatement.slice(0, 8).reverse().map(item => {
    const revenue = item.totalRevenue || 0;
    const grossProfit = item.grossProfit || 0;
    const operatingIncome = item.operatingIncome || 0;
    const netIncome = item.netIncome || 0;

    return {
      period: getPeriodLabel(item.period),
      grossMargin: revenue ? grossProfit / revenue : 0,
      operatingMargin: revenue ? operatingIncome / revenue : 0,
      netMargin: revenue ? netIncome / revenue : 0
    };
  });
});

const marginCategories = {
  grossMargin: { name: 'Gross Margin', color: '#3b82f6' },
  operatingMargin: { name: 'Operating Margin', color: '#10b981' },
  netMargin: { name: 'Net Margin', color: '#f59e0b' }
};

// Balance Sheet Data
const balanceSheetData = computed(() => {
  if (!hasData.value) return [];

  const balanceSheet = fundamentalData.value.financials.balanceSheet[selectedPeriod.value];
  if (!balanceSheet || !Array.isArray(balanceSheet)) return [];

  return balanceSheet.slice(0, 8).reverse().map(item => ({
    period: getPeriodLabel(item.period),
    assets: item.totalAssets || 0,
    liabilities: item.totalLiab || 0,
    equity: item.totalStockholderEquity || 0
  }));
});

const balanceSheetCategories = {
  assets: { name: 'Total Assets', color: '#3b82f6' },
  liabilities: { name: 'Total Liabilities', color: '#ef4444' },
  equity: { name: 'Shareholder Equity', color: '#10b981' }
};

// Free Cash Flow Data
const freeCashFlowData = computed(() => {
  if (!hasData.value) return [];

  const cashFlow = fundamentalData.value.financials.cashFlow[selectedPeriod.value];
  if (!cashFlow || !Array.isArray(cashFlow)) return [];

  return cashFlow.slice(0, 8).reverse().map(item => ({
    period: getPeriodLabel(item.period),
    freeCashFlow: item.freeCashFlow || 0
  }));
});

const freeCashFlowCategories = {
  freeCashFlow: { name: 'Free Cash Flow', color: '#10b981' }
};

// Fetch fundamental data
const fetchFundamentalData = async () => {
  loading.value = true;
  try {
    const data = await $fetch(`/api/ticker/${props.ticker}/fundamentals`);
    fundamentalData.value = data.fundamentalData;
  } catch (error) {
    console.error('Failed to fetch fundamental data:', error);
  } finally {
    loading.value = false;
  }
};

// Fetch data on mount
onMounted(() => {
  fetchFundamentalData();
});

// Refetch when ticker changes
watch(() => props.ticker, () => {
  fetchFundamentalData();
});
</script>
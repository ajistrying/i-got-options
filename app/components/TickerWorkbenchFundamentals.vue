<template>
  <div class="space-y-8">
    <!-- Header with Period Selector and Refresh Button -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Fundamental Data
      </h2>
      <div class="flex items-center space-x-3">
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
        <UButton
          @click="handleRefresh"
          variant="soft"
          icon="i-heroicons-arrow-path"
          size="sm"
          :loading="loading"
        >
          Refresh Data
        </UButton>
      </div>
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
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Key Insights:</span> Revenue shows top-line growth and market demand. Net income reveals bottom-line profitability. The gap between them indicates operational efficiency - a narrowing gap suggests improving margins.
          </p>
        </div>
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
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Key Insights:</span> Operating cash flow shows core business health (positive is essential). Investing cash flow reveals growth investments (negative often means expansion). Financing cash flow indicates capital structure changes.
          </p>
        </div>
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
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Key Insights:</span> Gross margin shows pricing power. Operating margin reveals operational efficiency. Net margin indicates overall profitability. Stable or rising margins suggest competitive advantages.
          </p>
        </div>
      </UCard>

      <!-- Operating Performance Chart -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Operating Performance</h3>
        </template>
        <LineChart
          :data="operatingPerformanceData"
          :categories="operatingPerformanceCategories"
          :height="300"
          :x-formatter="(i) => operatingPerformanceData[i]?.period || ''"
          :y-formatter="formatCurrency"
          :show-legend="true"
          :curve-type="'linear'"
        />
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Key Insights:</span> EBITDA shows earnings before financing and tax decisions. EBIT includes depreciation costs. Operating Income reflects core business performance. Consistent growth indicates strong operations.
          </p>
        </div>
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
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Key Insights:</span> Assets show company resources. Liabilities represent obligations. Equity is shareholder value (Assets - Liabilities). Look for growing assets, controlled liabilities, and increasing equity.
          </p>
        </div>
      </UCard>

      <!-- Debt & Liquidity Chart -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Debt & Liquidity</h3>
        </template>
        <BarChart
          :data="debtLiquidityData"
          :categories="debtLiquidityCategories"
          :y-axis="['cash', 'shortTermDebt', 'longTermDebt', 'netDebt']"
          :height="300"
          :x-formatter="(i) => debtLiquidityData[i]?.period || ''"
          :y-formatter="formatCurrency"
          :show-legend="true"
          :stacked="false"
        />
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Key Insights:</span> Cash provides operational flexibility. Debt levels indicate financial risk. Net debt (total debt minus cash) shows real debt burden. Negative net debt means more cash than debt - a sign of financial strength.
          </p>
        </div>
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
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Key Insights:</span> Cash available after capital expenditures. Used for expansion, dividends, or debt reduction. Positive and growing FCF indicates strong cash generation and financial flexibility.
          </p>
        </div>
      </UCard>

      <!-- Credit Ratios Chart -->
      <UCard v-if="hasCreditRatios">
        <template #header>
          <h3 class="text-lg font-semibold">Credit & Debt Ratios</h3>
        </template>
        <LineChart
          :data="creditRatiosData"
          :categories="creditRatiosCategories"
          :height="300"
          :x-formatter="(i) => creditRatiosData[i]?.period || ''"
          :y-formatter="(v) => v.toFixed(2)"
          :show-legend="true"
          :curve-type="'linear'"
        />
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Key Insights:</span> Total Debt/EBITDA shows leverage relative to earnings. Debt/Equity measures financial leverage. Lower ratios indicate less financial risk and stronger balance sheet health.
          </p>
        </div>
      </UCard>

      <!-- Liquidity Ratios Chart -->
      <UCard v-if="hasLiquidityRatios">
        <template #header>
          <h3 class="text-lg font-semibold">Liquidity Ratios</h3>
        </template>
        <LineChart
          :data="liquidityRatiosData"
          :categories="liquidityRatiosCategories"
          :height="300"
          :x-formatter="(i) => liquidityRatiosData[i]?.period || ''"
          :y-formatter="(v) => v.toFixed(2)"
          :show-legend="true"
          :curve-type="'linear'"
        />
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Key Insights:</span> Current Ratio >1 means more current assets than liabilities. Quick Ratio excludes inventory. Altman Z-Score >2.99 suggests low bankruptcy risk. Higher ratios indicate stronger short-term financial health.
          </p>
        </div>
      </UCard>

      <!-- Yield Analysis Ratios Chart -->
      <UCard v-if="hasYieldRatios">
        <template #header>
          <h3 class="text-lg font-semibold">Yield Analysis Ratios</h3>
        </template>
        <LineChart
          :data="yieldRatiosData"
          :categories="yieldRatiosCategories"
          :height="300"
          :x-formatter="(i) => yieldRatiosData[i]?.period || ''"
          :y-formatter="formatPercentage"
          :show-legend="true"
          :curve-type="'linear'"
        />
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Key Insights:</span> FCF Yield shows cash generation relative to market cap. Shareholder Yield includes buybacks and dividends. Capital Yield measures total capital returned. Higher yields indicate better returns to investors.
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LineChart, BarChart } from '#components';

const props = defineProps<{
  ticker: string;
}>();

const emit = defineEmits(['refresh']);

const loading = ref(false);
const fundamentalData = ref<any>(null);
const ratiosData = ref<any>({
  credit: null,
  liquidity: null,
  yield: null
});
const selectedPeriod = ref<'yearly' | 'quarterly'>('yearly');

const handleRefresh = () => {
  emit('refresh');
};

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

// Operating Performance Data
const operatingPerformanceData = computed(() => {
  if (!hasData.value) return [];

  const incomeStatement = fundamentalData.value.financials.incomeStatement[selectedPeriod.value];
  if (!incomeStatement || !Array.isArray(incomeStatement)) return [];

  return incomeStatement.slice(0, 8).reverse().map(item => ({
    period: getPeriodLabel(item.period),
    ebitda: item.ebitda || 0,
    ebit: item.ebit || 0,
    operatingIncome: item.operatingIncome || 0
  }));
});

const operatingPerformanceCategories = {
  ebitda: { name: 'EBITDA', color: '#3b82f6' },
  ebit: { name: 'EBIT', color: '#10b981' },
  operatingIncome: { name: 'Operating Income', color: '#f59e0b' }
};

// Debt & Liquidity Data
const debtLiquidityData = computed(() => {
  if (!hasData.value) return [];

  const balanceSheet = fundamentalData.value.financials.balanceSheet[selectedPeriod.value];
  if (!balanceSheet || !Array.isArray(balanceSheet)) return [];

  return balanceSheet.slice(0, 8).reverse().map(item => ({
    period: getPeriodLabel(item.period),
    cash: item.cash || 0,
    shortTermDebt: item.shortTermDebt || 0,
    longTermDebt: item.longTermDebt || 0,
    netDebt: item.netDebt || 0
  }));
});

const debtLiquidityCategories = {
  cash: { name: 'Cash', color: '#10b981' },
  shortTermDebt: { name: 'Short-term Debt', color: '#f59e0b' },
  longTermDebt: { name: 'Long-term Debt', color: '#ef4444' },
  netDebt: { name: 'Net Debt', color: '#8b5cf6' }
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

// Credit Ratios Data
const hasCreditRatios = computed(() => {
  return ratiosData.value.credit && (ratiosData.value.credit.annual?.length > 0 || ratiosData.value.credit.quarterly?.length > 0);
});

const creditRatiosData = computed(() => {
  if (!hasCreditRatios.value) return [];

  const period = selectedPeriod.value === 'yearly' ? 'annual' : 'quarterly';
  const data = ratiosData.value.credit[period] || [];

  return data.slice(0, 8).reverse().map(item => ({
    period: item.period_label || item.period,
    debtToEbitda: item.tot_debt_to_ebitda || 0,
    debtToEquity: item.tot_debt_to_tot_eqy || 0,
    debtToAssets: item.tot_debt_to_tot_asset || 0
  }));
});

const creditRatiosCategories = {
  debtToEbitda: { name: 'Debt/EBITDA', color: '#3b82f6' },
  debtToEquity: { name: 'Debt/Equity', color: '#ef4444' },
  debtToAssets: { name: 'Debt/Assets', color: '#f59e0b' }
};

// Liquidity Ratios Data
const hasLiquidityRatios = computed(() => {
  return ratiosData.value.liquidity && (ratiosData.value.liquidity.annual?.length > 0 || ratiosData.value.liquidity.quarterly?.length > 0);
});

const liquidityRatiosData = computed(() => {
  if (!hasLiquidityRatios.value) return [];

  const period = selectedPeriod.value === 'yearly' ? 'annual' : 'quarterly';
  const data = ratiosData.value.liquidity[period] || [];

  return data.slice(0, 8).reverse().map(item => ({
    period: item.period_label || item.period,
    currentRatio: item.cur_ratio || 0,
    quickRatio: item.quick_ratio || 0,
    altmanZScore: item.altman_z_score || 0
  }));
});

const liquidityRatiosCategories = {
  currentRatio: { name: 'Current Ratio', color: '#3b82f6' },
  quickRatio: { name: 'Quick Ratio', color: '#10b981' },
  altmanZScore: { name: 'Altman Z-Score', color: '#8b5cf6' }
};

// Yield Ratios Data
const hasYieldRatios = computed(() => {
  return ratiosData.value.yield && (ratiosData.value.yield.annual?.length > 0 || ratiosData.value.yield.quarterly?.length > 0);
});

const yieldRatiosData = computed(() => {
  if (!hasYieldRatios.value) return [];

  const period = selectedPeriod.value === 'yearly' ? 'annual' : 'quarterly';
  const data = ratiosData.value.yield[period] || [];

  return data.slice(0, 8).reverse().map(item => ({
    period: item.period_label || item.period,
    fcfYield: (item.free_cash_flow_yield || 0) / 100,
    shareholderYield: (item.shareholder_yield_ex_debt || 0) / 100,
    capitalYield: (item.capital_yield || 0) / 100
  }));
});

const yieldRatiosCategories = {
  fcfYield: { name: 'FCF Yield', color: '#3b82f6' },
  shareholderYield: { name: 'Shareholder Yield', color: '#10b981' },
  capitalYield: { name: 'Capital Yield', color: '#f59e0b' }
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

// Fetch ratios data from database
const fetchRatiosData = async () => {
  try {
    const data = await $fetch(`/api/ticker/${props.ticker}/data`);
    const searches = data.searches || [];

    // Get the most recent search with ratios data
    const searchWithRatios = searches.find((s: any) =>
      s.credit_ratios_data || s.liquidity_ratios_data || s.yield_ratios_data
    );

    if (searchWithRatios) {
      ratiosData.value = {
        credit: searchWithRatios.credit_ratios_data || null,
        liquidity: searchWithRatios.liquidity_ratios_data || null,
        yield: searchWithRatios.yield_ratios_data || null
      };
    }
  } catch (error) {
    console.error('Failed to fetch ratios data:', error);
  }
};

// Fetch data on mount
onMounted(() => {
  fetchFundamentalData();
  fetchRatiosData();
});

// Refetch when ticker changes
watch(() => props.ticker, () => {
  fetchFundamentalData();
  fetchRatiosData();
});
</script>
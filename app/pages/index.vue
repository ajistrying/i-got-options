<template>
	<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
		<div class="container mx-auto p-6 max-w-7xl">
			<div class="mb-8">
				<h1 class="text-3xl font-bold mb-2">Stock Options Research Hub</h1>
				<p class="text-gray-600 dark:text-gray-400">OptionsThing</p>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div class="lg:col-span-2 space-y-6">
					<UCard>
						<template #header>
							<h2 class="text-lg font-semibold">Search Ticker</h2>
						</template>
						<TickerSearch @search-complete="handleSearchComplete" />
					</UCard>

					<SearchResults :results="searchResults" />
				</div>

				<div class="space-y-6">
					<UCard>
						<SubredditManager />
					</UCard>

					<UCard v-if="lastSearchedTicker">
						<DossierView :ticker="lastSearchedTicker" />
					</UCard>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const searchResults = ref(null);
const lastSearchedTicker = ref("");

const handleSearchComplete = (results: any) => {
	searchResults.value = results;
	if (results?.ticker) {
		lastSearchedTicker.value = results.ticker;
	}
};
</script>

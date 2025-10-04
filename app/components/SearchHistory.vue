<template>
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">Recent Searches</h2>
			<UButton
				size="sm"
				variant="soft"
				@click="loadHistory"
				:loading="loading"
				icon="i-heroicons-arrow-path"
			>
				Refresh
			</UButton>
		</div>

		<div v-if="loading && !history.length" class="flex justify-center py-8">
			<UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl" />
		</div>

		<div v-else-if="!history.length" class="text-center text-gray-500 py-8">
			No search history yet. Start by searching for a ticker above.
		</div>

		<div v-else class="space-y-2">
			<UCard
				v-for="tickerGroup in groupedHistory"
				:key="tickerGroup.ticker"
				:ui="{
					body: { padding: 'p-0' },
				}"
				class="overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 hover:cursor-pointer"
				@click.stop="navigateToWorkbench(tickerGroup.ticker)"
			>
				<!-- Main Row -->
				<div
					class="flex items-center justify-between p-1  transition-colors"
				>
					<div class="flex items-center space-x-4 flex-1">

						<!-- Ticker -->
						<span class="font-bold text-primary-600 dark:text-primary-400 text-lg">
							{{ tickerGroup.ticker }}
						</span>
					</div>

					<!-- Actions -->
					<div class="flex items-center space-x-2">
						<UButton
							size="xs"
							color="red"
							variant="ghost"
							icon="i-heroicons-trash"
							@click.stop="deleteAllSearchesForTicker(tickerGroup.ticker)"
						/>
					</div>
				</div>
			</UCard>
		</div>

		<!-- Pagination -->
		<div v-if="totalPages > 1" class="flex justify-center">
			<UPagination
				v-model="currentPage"
				:total="totalPages"
				:page-count="pageSize"
				@update:modelValue="loadHistory"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
const emit = defineEmits(["select-search"]);

const loading = ref(false);
const history = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);


// Group searches by ticker
const groupedHistory = computed(() => {
	const groups = {};

	history.value.forEach((search) => {
		const ticker = search.ticker;
		if (!groups[ticker]) {
			groups[ticker] = {
				ticker,
				searches: [],
				totalPosts: 0,
				searchCount: 0,
				mostRecentSearch: search,
			};
		}

		groups[ticker].searches.push(search);
		groups[ticker].totalPosts += search.result_count || 0;
		groups[ticker].searchCount++;
	});

	// Convert to array and sort by most recent date
	const sortedGroups = Object.values(groups).sort(
		(a, b) => new Date(b.mostRecentDate) - new Date(a.mostRecentDate)
	);

	return sortedGroups
});


const loadHistory = async () => {
	loading.value = true;
	try {
		const data = await $fetch("/api/searches/history", {
			query: {
				page: currentPage.value,
				limit: pageSize.value,
			},
		});
		history.value = data.searches;
		totalPages.value = data.totalPages;
	} catch (error) {
		console.error("Failed to load search history:", error);
	} finally {
		loading.value = false;
	}
};

const deleteSearch = async (searchId: string) => {
	if (!confirm("Are you sure you want to delete this search?")) return;

	try {
		await $fetch(`/api/searches/${searchId}`, {
			method: "DELETE",
		});
		await loadHistory();
	} catch (error) {
		console.error("Failed to delete search:", error);
	}
};

const deleteAllSearchesForTicker = async (ticker: string) => {
	const tickerGroup = groupedHistory.value.find((g) => g.ticker === ticker);
	if (!tickerGroup) return;

	const searchCount = tickerGroup.searchCount;
	const message =
		searchCount === 1
			? `Are you sure you want to delete the search for ${ticker}?`
			: `Are you sure you want to delete all ${searchCount} searches for ${ticker}?`;

	if (!confirm(message)) return;

	try {
		// Delete all searches for this ticker
		for (const search of tickerGroup.searches) {
			await $fetch(`/api/searches/${search.id}`, {
				method: "DELETE",
			});
		}
		await loadHistory();
	} catch (error) {
		console.error("Failed to delete searches:", error);
	}
};

const navigateToWorkbench = (ticker: string) => {
	navigateTo(`/ticker/${ticker}`);
};

onMounted(() => {
	loadHistory();
});

// Refresh when a new search is completed
const refreshHistory = () => {
	loadHistory();
};

defineExpose({ refreshHistory });
</script>

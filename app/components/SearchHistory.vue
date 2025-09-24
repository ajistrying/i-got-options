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
				class="overflow-hidden"
			>
				<!-- Main Row -->
				<div
					class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
				>
					<div class="flex items-center space-x-4 flex-1">

						<!-- Ticker -->
						<span class="font-bold text-primary-600 dark:text-primary-400 text-lg">
							{{ tickerGroup.ticker }}
						</span>

						<!-- Most Recent Date -->
						<span class="text-sm text-gray-600 dark:text-gray-400">
							{{ formatDate(tickerGroup.mostRecentDate) }}
						</span>

						<!-- Total Posts Across All Searches -->
						<UBadge size="sm" variant="subtle">
							{{ tickerGroup.totalPosts }} total posts
						</UBadge>

						<!-- Number of Searches -->
						<UBadge size="sm" color="gray" variant="outline">
							{{ tickerGroup.searchCount }} search{{
								tickerGroup.searchCount > 1 ? "es" : ""
							}}
						</UBadge>
					</div>

					<!-- Actions -->
					<div class="flex items-center space-x-2">
						<UButton
							size="xs"
							variant="soft"
							@click.stop="navigateToWorkbench(tickerGroup.ticker)"
							icon="i-heroicons-beaker"
							class="text-primary-600 hover:bg-primary-100"
						>
							Open Workbench
						</UButton>
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
				mostRecentDate: search.created_at,
				mostRecentSearch: search,
			};
		}

		groups[ticker].searches.push(search);
		groups[ticker].totalPosts += search.result_count || 0;
		groups[ticker].searchCount++;

		// Update if this search is more recent
		if (new Date(search.created_at) > new Date(groups[ticker].mostRecentDate)) {
			groups[ticker].mostRecentDate = search.created_at;
			groups[ticker].mostRecentSearch = search;
		}
	});

	// Convert to array and sort by most recent date
	return Object.values(groups).sort(
		(a, b) => new Date(b.mostRecentDate) - new Date(a.mostRecentDate)
	);
});

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	const now = new Date();

	// Helper function to get ordinal suffix
	const getOrdinalSuffix = (day: number) => {
		if (day > 3 && day < 21) return "th";
		switch (day % 10) {
			case 1:
				return "st";
			case 2:
				return "nd";
			case 3:
				return "rd";
			default:
				return "th";
		}
	};

	// Format as "January 15th, 2025 4:45pm EST"
	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZone: "America/New_York",
	});

	const parts = formatter.formatToParts(date);
	const month = parts.find((part) => part.type === "month")?.value;
	const day = parseInt(parts.find((part) => part.type === "day")?.value || "0");
	const year = parts.find((part) => part.type === "year")?.value;
	const hour = parts.find((part) => part.type === "hour")?.value;
	const minute = parts.find((part) => part.type === "minute")?.value;
	const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value?.toLowerCase();

	// Determine if it's EST or EDT based on the date
	const isEST = date.getTimezoneOffset() === 300; // EST is UTC-5 (300 minutes)
	const timeZone = isEST ? "EST" : "EDT";

	return `${month} ${day}${getOrdinalSuffix(
		day
	)}, ${year} ${hour}:${minute}${dayPeriod} ${timeZone}`;
};


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

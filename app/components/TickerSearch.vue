<template>
	<div class="space-y-4">
		<div class="flex gap-2">
			<UInput
				v-model="ticker"
				placeholder="Enter ticker (e.g., AAPL, GME, SPY)"
				size="lg"
				class="flex-1"
				@keyup.enter="handleSearch"
			/>
			<UButton
				size="lg"
				@click="handleSearch"
				:loading="loading"
				:disabled="!ticker || loading"
			>
				Search Reddit
			</UButton>
		</div>

		<UAlert v-if="error" color="error" variant="subtle">
			{{ error }}
		</UAlert>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRedditSearch } from "../composables/useRedditSearch";

const ticker = ref("");
const { loading, error, searchTicker } = useRedditSearch();

const emit = defineEmits(["search-complete"]);

const handleSearch = async () => {
	if (!ticker.value) return;

	try {
		const results = await searchTicker(ticker.value);
		emit("search-complete", results);
	} catch (err) {
		// Error is already handled in composable
	}
};
</script>

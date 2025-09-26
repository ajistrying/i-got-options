export const useTickerDataPipeline = () => {
    const loading = ref(false);
    const error = ref<string | null>(null);

    const { runFundamentalDataSearch } = useEODHDSearch();
    const { searchReddit } = useRedditSearch();

    const runPipeline = async (ticker: string, subreddits: string[] = []) => {
        loading.value = true;
        error.value = null;

        try {
            // Run all API calls sequentially
            // If any fails, the error will bubble up and stop the chain

            // Step 1: Get fundamental data for ticker
            const fundamentalData = await runFundamentalDataSearch(ticker);

            // Step 2: Search ticker onReddit
            const redditData = await searchReddit(ticker, subreddits);

            // Step 3: Future AI agent calls will go here
            // const agent1Result = await callAgent1(ticker);
            // const agent2Result = await callAgent2(ticker);

            return {
                success: true,
                fundamental: fundamentalData,
                reddit: redditData,
                // agent1: agent1Result,
                // agent2: agent2Result
            };

        } catch (err: any) {
            // Any error from any step stops the chain
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return {
        loading: readonly(loading),
        error: readonly(error),
        runPipeline
    };
};
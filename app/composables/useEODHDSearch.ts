export const useEODHDSearch = () => {
    const runFundamentalDataSearch = async (ticker: string) => {
        try {
            const data = await $fetch(`/api/eodhd/fundamentalData`, {
                method: 'POST',
                body: {
                    ticker
                }
            });

            return data;
        } catch (error: any) {
            // Preserve the original error from the server
            console.error('Error fetching fundamental data:', error);

            // Re-throw the error to maintain the chain's ability to stop
            // The error object from $fetch already contains statusCode, statusMessage, and data
            throw error;
        }
    };

    return {
        runFundamentalDataSearch
    };
}
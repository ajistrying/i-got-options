import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { ticker } = body;

    if (!ticker) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ticker is required'
        });
    }

    // Initialize Supabase client
    const supabase = createClient(
        config.public.supabaseUrl,
        config.public.supabasePublishableKey
    );

    try {
        const tickerWithExchangeCode = ticker.toUpperCase().concat('.US');
        const response = await fetch(`https://eodhd.com/api/fundamentals/${tickerWithExchangeCode}?api_token=${process.env.eodhdApiToken}&fmt=json`);

        if(!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage: response.statusText
            });
        }

        const data = await response.json();

        // Helper function to clean and parse financial values
        const cleanFinancialValue = (value: any) => {
            if (value === null || value === undefined || value === "NA" || value === "") {
                return null;
            }
            // If it's a string number, parse it
            if (typeof value === 'string' && !isNaN(parseFloat(value))) {
                return parseFloat(value);
            }
            return value;
        };

        // Helper function to clean financial data object
        const cleanFinancialData = (dataObj: any) => {
            if (!dataObj) return null;
            const cleaned: any = {};
            Object.keys(dataObj).forEach(key => {
                cleaned[key] = cleanFinancialValue(dataObj[key]);
            });
            return cleaned;
        };

        // Helper function to filter and convert data for the past 5 years into an array
        const filterPast5YearsToArray = (dataObject: any) => {
            if (!dataObject) return [];
            const currentYear = new Date().getFullYear();
            const fiveYearsAgo = currentYear - 5;

            const filtered: any[] = [];
            Object.keys(dataObject).forEach(key => {
                // Check if the key is a date (YYYY-MM-DD or YYYY format)
                const yearMatch = key.match(/^(\d{4})/);
                if (yearMatch) {
                    const year = parseInt(yearMatch[1]);
                    if (year >= fiveYearsAgo && year <= currentYear) {
                        // Clean the financial data and add the period
                        const cleanedData = cleanFinancialData(dataObject[key]);
                        if (cleanedData) {
                            filtered.push({
                                period: key,
                                ...cleanedData
                            });
                        }
                    }
                }
            });

            // Sort by period (newest first)
            return filtered.sort((a, b) => b.period.localeCompare(a.period));
        };

        // Extract the specific fields you want with null safety
        const extractedData = {
            name: data.General?.Name || null,
            code: data.General?.Code || null,
            sector: data.General?.Sector || null,
            description: data.General?.Description || null,
            highlights: {
                marketCap: cleanFinancialValue(data.Highlights?.MarketCapitalization),
                peRatio: cleanFinancialValue(data.Highlights?.PERatio),
                pegRatio: cleanFinancialValue(data.Highlights?.PEGRatio),
                wallStreetTargetPrice: cleanFinancialValue(data.Highlights?.WallStreetTargetPrice),
                bookValue: cleanFinancialValue(data.Highlights?.BookValue),
                dividendYield: cleanFinancialValue(data.Highlights?.DividendYield),
                earningsShare: cleanFinancialValue(data.Highlights?.EarningsShare),
                epsEstimateCurrentYear: cleanFinancialValue(data.Highlights?.EPSEstimateCurrentYear),
                epsEstimateNextYear: cleanFinancialValue(data.Highlights?.EPSEstimateNextYear),
                profitMargin: cleanFinancialValue(data.Highlights?.ProfitMargin),
                operatingMarginTTM: cleanFinancialValue(data.Highlights?.OperatingMarginTTM),
                returnOnAssetsTTM: cleanFinancialValue(data.Highlights?.ReturnOnAssetsTTM),
                returnOnEquityTTM: cleanFinancialValue(data.Highlights?.ReturnOnEquityTTM),
                revenueTTM: cleanFinancialValue(data.Highlights?.RevenueTTM),
                revenuePerShareTTM: cleanFinancialValue(data.Highlights?.RevenuePerShareTTM),
                quarterlyRevenueGrowthYOY: cleanFinancialValue(data.Highlights?.QuarterlyRevenueGrowthYOY),
                quarterlyEarningsGrowthYOY: cleanFinancialValue(data.Highlights?.QuarterlyEarningsGrowthYOY),
                grossProfitTTM: cleanFinancialValue(data.Highlights?.GrossProfitTTM)
            },
            financials: {
                balanceSheet: {
                    quarterly: filterPast5YearsToArray(data.Financials?.Balance_Sheet?.quarterly),
                    yearly: filterPast5YearsToArray(data.Financials?.Balance_Sheet?.yearly)
                },
                cashFlow: {
                    quarterly: filterPast5YearsToArray(data.Financials?.Cash_Flow?.quarterly),
                    yearly: filterPast5YearsToArray(data.Financials?.Cash_Flow?.yearly)
                },
                incomeStatement: {
                    quarterly: filterPast5YearsToArray(data.Financials?.Income_Statement?.quarterly),
                    yearly: filterPast5YearsToArray(data.Financials?.Income_Statement?.yearly)
                }
            },
            valuation: data.Valuation || null,
            analystRatings: data.AnalystRatings || null
        };

        // Store data in database if needed
        // const { error } = await supabase

        return extractedData;

    } catch (error) {
        console.error('Error fetching fundamental data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error'
        });
    }
});
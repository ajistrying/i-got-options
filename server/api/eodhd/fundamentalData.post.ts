import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { ticker } = body;

    if (!ticker) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ticker is required',
            message: 'Ticker is required'
        });
    }

    // Initialize Supabase client
    const supabase = createClient(
        config.public.supabaseUrl,
        config.public.supabasePublishableKey
    );

    try {
        const tickerWithExchangeCode = ticker.toUpperCase().concat('.US');
        const response = await fetch(`https://eodhd.com/api/fundamentals/${tickerWithExchangeCode}?api_token=${process.env.EODHD_API_KEY}&fmt=json`);

        if(!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage: `Error fetching fundamental data from EODHD`,
                message: response.statusText
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
            }
        };

        // Store or update fundamental data in the database
        // First, check if a record exists for this ticker
        const { data: existingRecord, error: fetchError } = await supabase
            .from('ticker_searches')
            .select('id')
            .eq('ticker', ticker.toUpperCase())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (existingRecord) {
            // Update existing record with fundamental data
            const { error: updateError } = await supabase
                .from('ticker_searches')
                .update({
                    fundamental_data: extractedData,
                    fundamental_data_updated_at: new Date().toISOString()
                })
                .eq('id', existingRecord.id);

            if (updateError) {
                throw createError({
                    statusCode: 500,
                    statusMessage: `Error updating ticker search record`,
                    message: updateError.message
                });
            }
        } else {
            // Create new record with fundamental data
            const { error: insertError } = await supabase
                .from('ticker_searches')
                .insert({
                    ticker: ticker.toUpperCase(),
                    fundamental_data: extractedData,
                    fundamental_data_updated_at: new Date().toISOString(),
                    data_version: 2 // Using new unified format
                });

            if (insertError) {
                throw createError({
                    statusCode: 500,
                    statusMessage: `Error inserting ticker search record`,
                    message: insertError.message
                });
            }
        }

        return {
            success: true,
            message: `Fundamental data for ${ticker.toUpperCase()} fetched and stored successfully`,
            ticker: ticker.toUpperCase()
        };

    } catch (error: any) {
        console.error('Error fetching fundamental data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: `Internal Server Error`,
            message: error.message || 'Internal Server Error'
        });
    }
});
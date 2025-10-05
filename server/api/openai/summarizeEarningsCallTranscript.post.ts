import { createClient } from '@supabase/supabase-js';
import { run  } from '@openai/agents';
import {EarningsAnalysisAgent} from '../../../app/agents/ticker/earningsAnalysis';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { ticker, year, quarter } = body;

    if (!ticker || !year || !quarter) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ticker, year, and quarter are required',
            message: 'Ticker, year, and quarter are required'
        });
    }

    // Validate quarter is between 1-4
    if (quarter < 1 || quarter > 4) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Quarter must be between 1 and 4',
            message: 'Quarter must be between 1 and 4'
        });
    }

    // Initialize Supabase client
    const supabase = createClient(
        config.public.supabaseUrl,
        config.public.supabasePublishableKey
    );

    try {
        // Fetch the transcript from the database
        const { data: transcriptRecord, error: fetchError } = await supabase
            .from('earnings_call_transcripts')
            .select('*')
            .eq('ticker', ticker.toUpperCase())
            .eq('year', year)
            .eq('quarter', quarter)
            .single();

        if (fetchError || !transcriptRecord) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Earnings call transcript not found',
                message: 'Please fetch the transcript first before generating a summary'
            });
        }

        // Check if summary already exists and is recent (less than 30 days old)
        if (transcriptRecord.ai_summary && transcriptRecord.ai_summary_generated_at) {
            const summaryAge = Date.now() - new Date(transcriptRecord.ai_summary_generated_at).getTime();
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

            if (summaryAge < thirtyDaysInMs) {
                return {
                    success: true,
                    ticker: ticker.toUpperCase(),
                    year,
                    quarter,
                    summary: transcriptRecord.ai_summary,
                    fromCache: true,
                    generatedAt: transcriptRecord.ai_summary_generated_at
                };
            }
        }

        // Generate the AI summary
        const result = await run(EarningsAnalysisAgent, transcriptRecord.transcript_data.content);

        // Save the summary to the database
        const { data: updatedRecord, error: updateError } = await supabase
            .from('earnings_call_transcripts')
            .update({
                ai_summary: result.finalOutput,
                ai_summary_generated_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', transcriptRecord.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error saving AI summary:', updateError);
            // Don't throw error, just return the summary without saving
            return {
                success: true,
                ticker: ticker.toUpperCase(),
                year,
                quarter,
                summary: result.finalOutput,
                fromCache: false,
                warning: 'Summary generated but not saved to database'
            };
        }

        return {
            success: true,
            ticker: ticker.toUpperCase(),
            year,
            quarter,
            summary: result.finalOutput,
            fromCache: false,
            generatedAt: updatedRecord.ai_summary_generated_at
        };

    } catch (error: any) {
        console.error('Error generating earnings summary:', error);
        throw createError({
            statusCode: 500,
            statusMessage: `Internal Server Error`,
            message: error.message || error || 'Internal Server Error'
        });
    }
});
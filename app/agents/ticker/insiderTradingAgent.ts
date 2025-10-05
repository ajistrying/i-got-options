import { Agent } from '@openai/agents';
import { z } from 'zod';

// TODO: Future implementation for insider trading analysis
// This agent will analyze insider buying and selling patterns:
// - Recent insider transactions (Form 4 filings)
// - Clustering of insider buys (bullish signal)
// - Significant insider selling (potential warning)
// - Insider ownership levels
// - C-suite vs. director vs. 10% owner activity
// - Transaction timing relative to earnings or events
// - Historical insider trading track record

// TODO: Data source needed
// - SEC Form 4 filings (insider transactions)
// - Can use SEC EDGAR API or services like OpenInsider
// - Insider ownership data from proxy statements

// TODO: Output schema definition
export const InsiderTradingOutput = z.object({
    // TODO: Define schema for insider trading analysis
    placeholder: z.string().describe('Placeholder for future implementation'),
});

const prompt = `TODO: Agent prompt for analyzing insider trading patterns`;

export const insiderTradingAgent = new Agent({
    name: 'InsiderTradingAgent',
    instructions: prompt,
    outputType: InsiderTradingOutput,
});

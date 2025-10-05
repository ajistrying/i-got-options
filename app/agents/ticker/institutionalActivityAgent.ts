import { Agent } from '@openai/agents';
import { z } from 'zod';

// TODO: Future implementation for institutional activity analysis
// This agent will analyze institutional holdings and activity:
// - 13F filings showing institutional ownership changes
// - Which funds are buying/selling (smart money tracking)
// - Ownership concentration and changes over time
// - Insider buying/selling patterns
// - Institutional ownership percentage trends
// - Notable new positions or exits by major funds

// TODO: Data source needed
// - SEC 13F filings (can use SEC EDGAR API)
// - Insider trading data (Form 4 filings)
// - Institutional ownership databases (WhaleWisdom, etc.)

// TODO: Output schema definition
export const InstitutionalActivityOutput = z.object({
    // TODO: Define schema for institutional activity analysis
    placeholder: z.string().describe('Placeholder for future implementation'),
});

const prompt = `TODO: Agent prompt for analyzing institutional holdings and activity`;

export const institutionalActivityAgent = new Agent({
    name: 'InstitutionalActivityAgent',
    instructions: prompt,
    outputType: InstitutionalActivityOutput,
});

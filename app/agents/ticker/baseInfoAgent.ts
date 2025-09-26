import { Agent } from '@openai/agents';
import { z } from 'zod';

// Agent Prompt
const prompt = `You are a financial data agent that takes in general information about a company and crafts a compact summary of the company.`;

export const BaseInfoSummary = z.object({
    summary: z.string().describe('A short text summary of the company')
})

export const baseInfoAgent = new Agent({
    name: 'BaseInfoAgent',
    instructions: prompt,
    outputType: BaseInfoSummary,
});
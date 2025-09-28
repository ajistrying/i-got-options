import { Agent } from '@openai/agents';
import { z } from 'zod';

// Agent Prompt
const prompt = `You are a financial data aggregation agent that takes in SEC filings and crafts a summary of the company`;

export const SecFilingsSummary = z.object({});
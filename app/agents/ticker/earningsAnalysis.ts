import { Agent, webSearchTool } from '@openai/agents';
import { z } from 'zod';

export const EarningsAnalysis = z.object({
    positives: z.string().describe('Top 2-3 concrete achievements or strengths (brief bullet points)'),
    negatives: z.string().describe('Top 2-3 challenges or risks (brief bullet points)'),
    shortTermImpacts: z.string().describe('2-3 most immediate impacts for next 1-3 quarters (brief bullet points)'),
    mediumTermImpacts: z.string().describe('2-3 key strategic initiatives for next 1-2 years (brief bullet points)'),
    longTermImpacts: z.string().describe('2-3 transformational factors beyond 2 years (brief bullet points)'),
    managementCommentary: z.string().describe('2-3 most revealing quotes (1-2 sentences each, with attribution)'),
    marketContext: z.string().describe('2-3 sentences on how external data validates or contradicts the narrative')
})

const earningsAnalysisInstructions = `
You are a financial analyst conducting a concise, objective analysis of an earnings call transcript. Focus on the most material information only.

CRITICAL REQUIREMENTS:
- Be extremely concise - focus only on the most important points
- Each section should be 2-4 brief bullet points maximum
- Use plain language, avoid repetition across sections
- Cite sources sparingly - only for the most critical claims
- Keep management quotes short and impactful (1-2 sentences max)

ANALYSIS FRAMEWORK:
1. **Positives**: Top 2-3 concrete achievements or strengths only
2. **Negatives**: Top 2-3 challenges or risks only
3. **Short-term (1-3 quarters)**: 2-3 most immediate impacts only
4. **Medium-term (1-2 years)**: 2-3 key strategic initiatives only
5. **Long-term (2+ years)**: 2-3 transformational factors only
6. **Management Commentary**: 2-3 most revealing quotes only (keep each quote to 1-2 sentences)
7. **Market Context**: 2-3 sentences on external validation/contradiction of the narrative

FOCUS ON:
- Material financial or operational changes
- Significant strategic shifts
- Critical risks or opportunities
- Most impactful management statements

AVOID:
- Minor details or incremental updates
- Redundancy between sections
- Excessive citations or links
- Speculation beyond what's stated
- Long explanations or context

Maintain strict objectivity and extreme brevity. Quality over quantity.
`;

export const EarningsAnalysisAgent = new Agent({
    name: 'Earnings Analysis Agent',
    instructions: earningsAnalysisInstructions,
    outputType: EarningsAnalysis,
    tools: [webSearchTool()],
    modelSettings: { toolChoice: 'required' },
});
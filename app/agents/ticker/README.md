# Qualitative Investment Intelligence Agentic System

A multi-tiered agentic framework built with OpenAI Agents SDK for TypeScript to generate **qualitative, narrative-driven** investment research reports.

## Philosophy: Text-Based Intelligence, Not Numbers

This system focuses exclusively on **qualitative analysis** - extracting intelligence from text sources rather than crunching numbers. We trust LLMs with:
- ✅ Sentiment extraction and tone analysis
- ✅ Narrative identification and theme synthesis
- ✅ Textual pattern recognition
- ✅ Qualitative argument construction

We **do NOT** use LLMs for:
- ❌ Financial statement calculations
- ❌ Ratio analysis and metrics
- ❌ Technical chart analysis
- ❌ Valuation modeling and price targets

**Why?** LLMs excel at understanding "what people are saying" but can hallucinate numbers. This system leverages their strengths while avoiding their weaknesses.

## Architecture Overview

The system uses a hierarchical agent structure with three operational tiers:

### Tier 1: Qualitative Data Analysis Agents (4 specialists)
Text analysis specialists that extract intelligence from specific sources:

1. **earningsAgent.ts** - Analyzes earnings call transcripts for:
   - Management sentiment (tone, confidence level, key themes)
   - Forward guidance direction (raised/maintained/lowered)
   - Concerns raised vs. opportunities highlighted
   - Analyst question themes
   - Transcript narrative summary

2. **newsSentimentAgent.ts** - Analyzes news articles for:
   - Overall sentiment score and trend
   - Key narratives and themes
   - Recent developments
   - Media coverage quality
   - Controversy flags

3. **redditAgent.ts** - Analyzes Reddit posts/comments for:
   - Social sentiment metrics
   - Consensus expectations
   - Crowd positioning and behavioral patterns
   - Contrarian indicators
   - High-value retail intelligence

4. **baseInfoAgent.ts** - Creates company overview (narrative description)

### Tier 2: Synthesis Agents (4 analysts)
Agents that synthesize Tier 1 qualitative outputs into strategic viewpoints:

5. **bullCaseAgent.ts** - Builds qualitative bull case across short/mid/long-term timeframes
6. **bearCaseAgent.ts** - Builds qualitative bear case across short/mid/long-term timeframes
7. **catalystsAgent.ts** - Identifies upcoming events and catalysts from text sources
8. **risksAgent.ts** - Categorizes and assesses qualitative risk factors

### Tier 3: Orchestrator Agent (Chief Qualitative Analyst)
9. **dueDiligenceOrchestratorAgent.ts** - Coordinates all agents and generates final qualitative intelligence report

## Type Definitions

**types/reportTypes.ts** - Qualitative-focused Zod schemas:
- `EarningsAnalysisOutput` - Management sentiment and guidance
- `NewsSentimentOutput` - News narratives and media perception
- `BullCaseOutput` - Qualitative bull arguments
- `BearCaseOutput` - Qualitative bear arguments
- `CatalystsOutput` - Event identification
- `RisksOutput` - Risk categorization
- `QualitativeDueDiligenceReport` - Final report structure

## Data Flow

```
Text Data Sources (Supabase)
    ↓
Tier 1: Qualitative Data Analysis Agents
    ↓
Tier 2: Synthesis Agents
    ↓
Tier 3: Orchestrator Agent
    ↓
Qualitative Intelligence Report
```

## Current Data Sources

The system integrates with **text-based** data:

1. **Earnings Call Transcripts** (roic.ai)
   - Management commentary
   - Q&A sessions
   - Guidance statements

2. **News Articles** (EODHD API)
   - News headlines and content
   - Article sentiment scores
   - Media coverage

3. **Reddit Posts/Comments** (Reddit API)
   - Post titles and content
   - Comment discussions
   - User sentiment

All data stored in Supabase (`ticker_searches` and `earnings_call_transcripts` tables).

## Report Structure

The final `QualitativeDueDiligenceReport` includes:

### Executive Summary
- **Company overview** - Narrative description of what the company does
- **Investment thesis** - One-paragraph qualitative summary
- **Overall sentiment** - Strong Conviction | Conviction | Neutral | Skeptical | Strong Skeptical
- **Conviction level** - Confidence in the narrative assessment (1-10)
- **TL;DR** - 2-3 sentence summary

### Core Analysis Sections
- **Bull Case** - Qualitative bullish arguments (short/mid/long-term)
- **Bear Case** - Qualitative bearish arguments (short/mid/long-term)
- **Catalysts** - Upcoming events identified from text sources
- **Risks** - Categorized qualitative risks (financial, operational, market, regulatory)

### Supporting Intelligence
- **Management Intelligence**
  - Key insights from earnings calls
  - Credibility assessment
  - Most revealing quotes

- **News Intelligence**
  - Key narratives from media
  - Narrative shifts over time
  - Overall media perception

- **Social Intelligence**
  - Key insights from Reddit
  - Crowd positioning
  - Contrarian signals

### Data Quality Indicators
- Earnings transcripts availability
- News coverage quality
- Social sentiment quality
- Analysis completeness percentage
- Warnings and limitations

## API Endpoint

**POST /api/ticker/[ticker]/report**

Triggers qualitative intelligence report generation for a given ticker.

### Implementation Status
- ✅ Endpoint structure created
- ⏳ Data fetching from Supabase (TODO)
- ⏳ Agent execution pipeline (TODO)
- ⏳ Report caching (TODO)

## Agent Coordination (OpenAI Agents SDK)

The orchestrator uses the **handoffs** pattern:

```typescript
export const dueDiligenceOrchestratorAgent = new Agent({
    name: 'QualitativeDueDiligenceOrchestratorAgent',
    instructions: prompt,
    outputType: QualitativeDueDiligenceReport,
    handoffs: [
        // Tier 1 text analysts
        earningsAgent,
        newsSentimentAgent,
        redditAgent,
        baseInfoAgent,

        // Tier 2 synthesis analysts
        bullCaseAgent,
        bearCaseAgent,
        catalystsAgent,
        risksAgent,
    ],
});
```

The orchestrator delegates to specialist agents and synthesizes their qualitative outputs into the final narrative intelligence report.

## What Makes This Different

### Traditional Quant Analysis
- Calculates financial ratios
- Models cash flows
- Derives price targets
- **Risk**: LLM hallucination with numbers

### Our Qualitative Approach
- Extracts management sentiment
- Identifies narrative themes
- Synthesizes "what people are saying"
- **Advantage**: LLMs excel at text understanding

### Example Outputs

**Traditional (Avoided):**
```
Fair value: $175 (P/E of 25x on $7.00 EPS)
Upside: 15.8%
Position size: 10% of portfolio
```

**Qualitative (Our Focus):**
```
Bull Case: Management expressing high confidence in new
product cycle. Media narratives increasingly positive around
innovation leadership. Reddit crowd showing quality discussion
with insider observations supporting growth thesis.

Bear Case: Analyst questions revealing concerns about macro
headwinds. News coverage flagging competitive pressures.
Management hedging language around guidance suggests uncertainty.
```

## Development Notes

### Best Practices
- Keep agent prompts focused on qualitative extraction
- Explicitly instruct agents to avoid numerical predictions
- Emphasize narrative quality and source credibility
- Cross-reference text sources for consistency

### Testing Strategy
- Validate that agents don't hallucinate numbers
- Check narrative consistency across sources
- Verify sentiment assessments match text evidence
- Review for qualitative depth vs. quantitative claims

### Cost Considerations
- Text analysis is token-intensive (especially transcripts)
- Cache reports to avoid regeneration
- Consider using GPT-4-mini for simpler extraction tasks
- Monitor costs closely for long transcripts

## Known Limitations

1. **No Quantitative Validation**: Report doesn't include numerical analysis to cross-check narratives
2. **Sentiment Can Be Wrong**: Crowd/media can be overly optimistic or pessimistic
3. **Text Data Dependency**: Quality depends on availability of earnings transcripts, news, and Reddit discussions
4. **Execution Time**: Analyzing long transcripts may take 30-60 seconds
5. **LLM Bias**: Language models may have inherent biases in sentiment interpretation

## Roadmap

- [ ] Implement data fetching in report endpoint
- [ ] Add report caching layer (24-hour TTL)
- [ ] Create UI for displaying qualitative intelligence reports
- [ ] Add historical narrative tracking (how stories change over time)
- [ ] Implement A/B testing of agent prompts
- [ ] Add user feedback loop for narrative quality
- [ ] Consider adding quantitative data display (user-provided, not LLM-calculated)

## When to Add Quantitative Analysis Back

If you later want to incorporate numbers:
1. **Display raw data** (not LLM-calculated) in UI
2. **User can see numbers** alongside qualitative narrative
3. **LLM describes trends** without calculating
4. **Example**: "Revenue grew (see chart)" not "Revenue grew 23.5%"

## License

Proprietary - Part of I Got Options platform

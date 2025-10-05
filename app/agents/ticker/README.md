# Investment Due Diligence Agentic System

A multi-tiered agentic framework built with OpenAI Agents SDK for TypeScript to generate comprehensive investment research reports.

## Architecture Overview

The system uses a hierarchical agent structure with three operational tiers plus future expansion agents:

### Tier 1: Data Analysis Agents (Specialists)
Individual specialist agents that analyze specific data types:

1. **fundamentalAnalysisAgent.ts** - Analyzes financial statements (balance sheets, income statements, cash flows)
2. **ratiosAnalysisAgent.ts** - Analyzes financial ratios (credit, liquidity, yield metrics)
3. **earningsAgent.ts** - Analyzes earnings call transcripts for management sentiment and guidance
4. **newsSentimentAgent.ts** - Analyzes news articles for sentiment and narratives
5. **redditAgent.ts** - Analyzes Reddit posts for social sentiment and trading intelligence
6. **technicalAnalysisAgent.ts** - Analyzes price action, support/resistance, momentum indicators
7. **baseInfoAgent.ts** - Creates company overview summaries

### Tier 2: Synthesis Agents (Analysts)
Agents that synthesize Tier 1 outputs into specific viewpoints:

8. **bullCaseAgent.ts** - Builds comprehensive bull thesis across short/mid/long-term timeframes
9. **bearCaseAgent.ts** - Builds comprehensive bear thesis across short/mid/long-term timeframes
10. **catalystsAgent.ts** - Identifies upcoming catalysts and trigger events
11. **risksAgent.ts** - Catalogs and assesses risk factors across categories
12. **valuationAgent.ts** - Determines fair value and position sizing recommendations

### Tier 3: Orchestrator Agent (Chief Analyst)
13. **dueDiligenceOrchestratorAgent.ts** - Coordinates all agents and generates final comprehensive report

### Tier 4: Future Agents (Stubs)
Placeholder agents for future data integration:

- **optionsFlowAgent.ts** - Unusual options activity analysis
- **institutionalActivityAgent.ts** - 13F filings and institutional holdings changes
- **insiderTradingAgent.ts** - Insider buying/selling patterns
- **competitiveAnalysisAgent.ts** - Competitor comparison and market positioning
- **economicDataAgent.ts** - Macroeconomic indicators and impact analysis
- **secFilingsAgent.ts** - SEC regulatory filings and legal disclosures

## Type Definitions

**types/reportTypes.ts** - Comprehensive Zod schemas defining:
- Individual agent output structures
- Final comprehensive report schema
- Type exports for TypeScript usage

## Data Flow

```
Raw Data Sources (Supabase)
    ↓
Tier 1: Data Analysis Agents
    ↓
Tier 2: Synthesis Agents
    ↓
Tier 3: Orchestrator Agent
    ↓
Comprehensive Due Diligence Report
```

## Current Data Sources

The system currently integrates with:

1. **EODHD API** - Fundamental financial data, news articles
2. **roic.ai API** - Earnings call transcripts, financial ratios
3. **Reddit API** - Social sentiment from favorite subreddits
4. **Supabase** - Data storage and retrieval

All data is stored in the `ticker_searches` and `earnings_call_transcripts` tables.

## Report Structure

The final `ComprehensiveDueDiligenceReport` includes:

### Executive Summary
- Company overview
- Investment thesis (one paragraph)
- Overall recommendation (Strong Buy/Buy/Hold/Sell/Strong Sell)
- Conviction level (1-10)
- TL;DR (2-3 sentences)

### Core Analysis Sections
- **Bull Case** - Short/mid/long-term bullish thesis with key drivers and confidence levels
- **Bear Case** - Short/mid/long-term bearish thesis with risks and severity levels
- **Catalysts** - Upcoming events that could move the stock
- **Risks** - Categorized risks (financial, operational, market, regulatory/legal)
- **Valuation** - Fair value range, upside/downside, position sizing recommendation

### Supporting Summaries
- Fundamental summary
- Technical summary
- Sentiment summary

### Data Quality Indicators
- Data availability flags
- Analysis completeness percentage
- Warnings and limitations

## API Endpoint

**POST /api/ticker/[ticker]/report**

Triggers report generation for a given ticker.

### Current Status
The endpoint structure is created but implementation is pending:
- TODO: Implement Supabase data fetching
- TODO: Structure data payload for orchestrator agent
- TODO: Execute dueDiligenceOrchestratorAgent
- TODO: Handle errors and partial data scenarios
- TODO: Store generated reports for caching
- TODO: Add rate limiting and cost controls

## Usage (Once Implemented)

```typescript
// Frontend/client code
const response = await $fetch(`/api/ticker/AAPL/report`, {
    method: 'POST',
});

// response.report will contain ComprehensiveDueDiligenceReport
const report = response.report;
console.log(report.executive_summary.overall_recommendation); // "Strong Buy"
console.log(report.valuation.fair_value_range.base); // 175.50
console.log(report.bull_case.overall_bull_score); // 8
```

## Agent Coordination (OpenAI Agents SDK)

The orchestrator uses the **handoffs** pattern:

```typescript
export const dueDiligenceOrchestratorAgent = new Agent({
    name: 'DueDiligenceOrchestratorAgent',
    instructions: prompt,
    outputType: ComprehensiveDueDiligenceReport,
    handoffs: [
        // Tier 1 agents
        fundamentalAnalysisAgent,
        ratiosAnalysisAgent,
        // ... etc

        // Tier 2 agents
        bullCaseAgent,
        bearCaseAgent,
        // ... etc
    ],
});
```

The orchestrator can delegate to specialist agents and synthesize their outputs into the final report.

## Future Expansion

To add a new data source and agent:

1. **Add data source integration**
   - Create API endpoint in `/server/api/`
   - Add database migration if storing data
   - Update data pipeline composable

2. **Create Tier 1 analysis agent**
   - Define output schema in `types/reportTypes.ts`
   - Create agent file with prompt and logic
   - Export agent for orchestrator

3. **Update orchestrator**
   - Import new agent
   - Add to handoffs array
   - Update prompt to utilize new data

4. **Update Tier 2 agents (if needed)**
   - Modify synthesis agents to incorporate new insights
   - Update prompts to reference new data source

5. **Update final report schema (if needed)**
   - Add new sections to `ComprehensiveDueDiligenceReport`
   - Update orchestrator to populate new fields

## Development Notes

### Best Practices
- Keep agent prompts detailed and specific
- Define strict Zod schemas for structured output
- Handle missing data gracefully
- Log agent execution for debugging
- Version control prompts (they're critical IP)

### Testing Strategy
- Unit test individual agents with sample data
- Integration test full pipeline with real ticker
- Monitor token usage and costs
- Validate output schema compliance
- Review agent outputs for hallucinations

### Cost Considerations
- Each report generation calls multiple LLM agents
- Use caching to avoid regenerating recent reports
- Consider rate limiting per user
- Monitor OpenAI API costs closely
- Potentially use cheaper models for some agents (e.g., GPT-4-mini for data extraction)

### Performance Optimization
- Agents can potentially run in parallel (Tier 1 agents are independent)
- Cache frequently requested ticker reports
- Lazy-load Tier 4 agents only when data available
- Stream results progressively to user if possible

## Known Limitations

1. **Data Dependency**: Report quality depends on data availability in Supabase
2. **Real-time Data**: Currently uses stored data, not real-time market data
3. **API Costs**: Multiple LLM calls per report can be expensive at scale
4. **Execution Time**: Full report generation may take 30-60 seconds
5. **Hallucination Risk**: LLM agents may occasionally generate plausible but incorrect analysis

## Roadmap

- [ ] Implement data fetching in report endpoint
- [ ] Add report caching layer
- [ ] Implement Tier 4 agents as data sources become available
- [ ] Add streaming responses for progressive report loading
- [ ] Create UI for displaying reports
- [ ] Add report versioning and historical comparison
- [ ] Implement A/B testing of agent prompts
- [ ] Add user feedback loop to improve agent quality

## License

Proprietary - Part of I Got Options platform

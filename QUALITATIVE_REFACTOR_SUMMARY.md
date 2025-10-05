# Qualitative Refactor Summary

## What Changed

The agentic system has been refactored to focus **exclusively on qualitative, text-based intelligence** - no numerical calculations or quantitative analysis.

## Before vs. After

### Before (19 agents)
**Tier 1:** 7 agents (fundamentals, ratios, earnings, news, Reddit, technical, base info)
**Tier 2:** 5 agents (bull, bear, catalysts, risks, valuation)
**Tier 3:** 1 orchestrator
**Tier 4:** 6 future stubs

**Focus:** Mixed - both quantitative and qualitative analysis

### After (9 agents)
**Tier 1:** 4 agents (earnings, news, Reddit, base info)
**Tier 2:** 4 agents (bull, bear, catalysts, risks)
**Tier 3:** 1 orchestrator

**Focus:** Pure qualitative - text analysis only

## Agents Removed (10 total)

### Quantitative Analysis (Tier 1)
1. ❌ **fundamentalAnalysisAgent.ts** - Financial statement calculations
2. ❌ **ratiosAnalysisAgent.ts** - Credit/liquidity/yield ratio analysis
3. ❌ **technicalAnalysisAgent.ts** - Price charts, support/resistance, indicators

### Numerical Predictions (Tier 2)
4. ❌ **valuationAgent.ts** - Fair value calculations and price targets

### Future Stubs (Tier 4)
5. ❌ **optionsFlowAgent.ts** - Options data analysis
6. ❌ **institutionalActivityAgent.ts** - 13F holdings tracking
7. ❌ **insiderTradingAgent.ts** - Insider transaction analysis
8. ❌ **economicDataAgent.ts** - Macroeconomic indicators
9. ❌ **competitiveAnalysisAgent.ts** - Market share analysis
10. ❌ **secFilingsAgent.ts** - Was mostly a stub anyway

## Agents Kept (9 total)

### Tier 1: Text Analysis (4 agents)
✅ **earningsAgent.ts** - Extracts management sentiment, tone, guidance from transcripts
✅ **newsSentimentAgent.ts** - Analyzes news narratives, themes, controversies
✅ **redditAgent.ts** - Social sentiment, crowd positioning, contrarian signals
✅ **baseInfoAgent.ts** - Company description (narrative only)

### Tier 2: Synthesis (4 agents)
✅ **bullCaseAgent.ts** - Qualitative bull arguments (no price targets)
✅ **bearCaseAgent.ts** - Qualitative bear arguments (no risk percentages)
✅ **catalystsAgent.ts** - Event identification from text sources
✅ **risksAgent.ts** - Risk categorization (qualitative severity)

### Tier 3: Orchestrator (1 agent)
✅ **dueDiligenceOrchestratorAgent.ts** - Renamed to QualitativeDueDiligenceOrchestratorAgent

## Schema Changes

### Removed Schemas
- `FundamentalAnalysisOutput`
- `RatiosAnalysisOutput`
- `TechnicalAnalysisOutput`
- `ValuationOutput`

### Kept Schemas
- `EarningsAnalysisOutput` - Management sentiment analysis
- `NewsSentimentOutput` - News narrative analysis
- `BullCaseOutput` - Qualitative bullish arguments
- `BearCaseOutput` - Qualitative bearish arguments
- `CatalystsOutput` - Event identification
- `RisksOutput` - Risk categorization

### Renamed Schema
- `ComprehensiveDueDiligenceReport` → **`QualitativeDueDiligenceReport`**

## New Report Structure

### Executive Summary
- Company overview (narrative description)
- Investment thesis (qualitative summary)
- **Overall sentiment**: Strong Conviction | Conviction | Neutral | Skeptical | Strong Skeptical
- Conviction level (1-10 based on narrative quality)
- TL;DR

### Core Sections
- **Bull Case** - Qualitative arguments across timeframes
- **Bear Case** - Qualitative risks across timeframes
- **Catalysts** - Upcoming events from text sources
- **Risks** - Categorized qualitative risks

### Intelligence Summaries
- **Management Intelligence**
  - Key insights from earnings
  - Credibility assessment
  - Most revealing quotes

- **News Intelligence**
  - Key narratives
  - Narrative shifts over time
  - Media perception

- **Social Intelligence**
  - Retail crowd insights
  - Crowd positioning
  - Contrarian signals

## Key Philosophy

### What LLMs Are Good At ✅
- Understanding sentiment and tone
- Extracting themes from text
- Identifying narrative patterns
- Synthesizing "what people are saying"

### What LLMs Are Bad At ❌
- Calculating financial ratios accurately
- Performing numerical modeling
- Deriving precise price targets
- Avoiding hallucination with numbers

## Example: Before vs. After

### Before (Avoided)
```
Fundamental Analysis:
- Revenue: $123.45B (+23.5% YoY)
- Operating Margin: 28.3% (expanding)
- ROE: 45.2% (best in sector)
- Debt/Equity: 0.85 (healthy)

Valuation:
- Fair Value: $175 (P/E 25x on $7.00 EPS)
- Upside: 15.8%
- Position Size: Medium (10% portfolio)
```

### After (Our Focus)
```
Management Intelligence:
- Very positive tone with high confidence (8/10)
- Raised guidance for first time in 3 quarters
- Key theme: "Product cycle acceleration ahead"
- Credibility: High (consistent track record)

News Intelligence:
- Sentiment improving (+6 to +8 over 30 days)
- Key narrative: Innovation leadership regained
- Media coverage: Extensive (tier-1 sources)
- No major controversies

Social Intelligence:
- Reddit crowd bullish with quality reasoning
- Insider observations supporting growth thesis
- Contrarian signal: Moderate (not over-extended)
- Discussion quality: High
```

## Why This Matters

1. **Avoids LLM Hallucination**: No made-up financial calculations
2. **Leverages LLM Strengths**: Text understanding is what they excel at
3. **Unique Value**: Most tools focus on quant - we focus on "what people are saying"
4. **Complementary**: User can see actual numbers in UI alongside qualitative narrative

## Future Possibilities

If you want to add numbers back later:

### Option 1: Display Raw Data (Recommended)
- Show actual financial data in UI (not LLM-calculated)
- LLM describes trends: "Revenue grew (see chart)" not "Revenue grew 23.5%"
- User sees numbers, LLM provides narrative context

### Option 2: Hybrid Approach
- Keep qualitative agents as-is
- Add separate quantitative display module (no LLM involvement)
- LLM narrative + User-visible raw data = Complete picture

### Option 3: Calculated Risk
- Re-add quantitative agents BUT
- Add validation layers
- Cross-check with actual data
- Flag discrepancies prominently

## Implementation Status

### Completed ✅
- Removed 10 quantitative agent files
- Updated type schemas
- Refactored orchestrator
- Updated README with new philosophy
- Committed and pushed to PR

### Next Steps
- Implement data fetching in API endpoint
- Test report generation with real ticker data
- Create UI for displaying qualitative intelligence
- Monitor for any numerical hallucinations in outputs
- Consider adding raw data display alongside narratives

## Files Modified

**Deleted:**
- 10 agent files (fundamentals, ratios, technical, valuation, + 6 stubs)

**Updated:**
- `types/reportTypes.ts` - Removed numerical schemas
- `dueDiligenceOrchestratorAgent.ts` - Qualitative focus, updated imports
- `README.md` - Complete rewrite with qualitative philosophy

**Unchanged:**
- All Tier 1 text analysis agents (earnings, news, Reddit)
- All Tier 2 synthesis agents (bull, bear, catalysts, risks)
- API endpoint structure

## Line Count Change

**Before:** ~2,769 lines added in initial PR
**After:** ~1,679 net lines (removed ~1,090 lines of quantitative code)

## Commit Message

```
refactor: Focus agentic system on qualitative text analysis only

Remove all quantitative/numerical analysis agents and schemas to focus
exclusively on qualitative, narrative-driven intelligence gathering.
```

## PR Status

✅ Changes pushed to `ajistrying/agentic-reports` branch
✅ PR #10 automatically updated on GitHub
✅ Ready for review and testing

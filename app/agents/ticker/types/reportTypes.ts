import { z } from 'zod';

// ============================================================================
// TIER 1: DATA ANALYSIS AGENT OUTPUT SCHEMAS
// ============================================================================

// Fundamental Analysis Output
export const FundamentalAnalysisOutput = z.object({
    financial_health_score: z.number().min(1).max(10).describe('Overall financial health (1-10)'),
    revenue_trend: z.enum(['accelerating', 'growing', 'stable', 'declining']).describe('Revenue growth trajectory'),
    profitability_assessment: z.string().describe('Profit margins, ROE, ROA analysis'),
    balance_sheet_strength: z.string().describe('Debt levels, liquidity, asset quality'),
    cash_flow_analysis: z.string().describe('Operating cash flow, free cash flow trends'),
    key_metrics: z.object({
        pe_ratio: z.number().nullable(),
        price_to_book: z.number().nullable(),
        debt_to_equity: z.number().nullable(),
        current_ratio: z.number().nullable(),
        roe: z.number().nullable(),
    }),
    notable_trends: z.array(z.string()).describe('Key trends from 5-year data'),
});

// Ratios Analysis Output
export const RatiosAnalysisOutput = z.object({
    credit_health: z.object({
        score: z.number().min(1).max(10).describe('Credit strength (1-10)'),
        trend: z.enum(['improving', 'stable', 'deteriorating']),
        key_insights: z.array(z.string()),
    }),
    liquidity_health: z.object({
        score: z.number().min(1).max(10).describe('Liquidity strength (1-10)'),
        altman_z_score: z.number().nullable().describe('Bankruptcy risk indicator'),
        trend: z.enum(['improving', 'stable', 'deteriorating']),
        key_insights: z.array(z.string()),
    }),
    yield_analysis: z.object({
        score: z.number().min(1).max(10).describe('Yield attractiveness (1-10)'),
        shareholder_return_quality: z.string().describe('FCF yield, buybacks, dividends'),
        key_insights: z.array(z.string()),
    }),
    overall_assessment: z.string().describe('Integrated view of all ratios'),
});

// Earnings Transcript Analysis Output
export const EarningsAnalysisOutput = z.object({
    management_sentiment: z.object({
        overall_tone: z.enum(['very_positive', 'positive', 'neutral', 'cautious', 'negative']),
        confidence_level: z.number().min(1).max(10).describe('Management confidence (1-10)'),
        key_themes: z.array(z.string()).describe('Major topics discussed'),
    }),
    forward_guidance: z.object({
        direction: z.enum(['raised', 'maintained', 'lowered', 'not_provided']),
        specifics: z.string().describe('Detailed guidance notes'),
        credibility: z.enum(['high', 'medium', 'low']).describe('Based on historical accuracy'),
    }),
    concerns_raised: z.array(z.string()).describe('Risks, headwinds, challenges mentioned'),
    opportunities_highlighted: z.array(z.string()).describe('Growth drivers, tailwinds'),
    analyst_question_themes: z.array(z.string()).describe('What analysts are focused on'),
    transcript_summary: z.string().describe('Key takeaways from most recent earnings'),
});

// News Sentiment Analysis Output
export const NewsSentimentOutput = z.object({
    overall_sentiment: z.object({
        score: z.number().min(-10).max(10).describe('Sentiment score: -10 (very bearish) to +10 (very bullish)'),
        trend: z.enum(['improving', 'stable', 'deteriorating']).describe('Sentiment direction'),
        volume: z.number().describe('Number of articles analyzed'),
    }),
    key_narratives: z.array(z.object({
        theme: z.string(),
        sentiment: z.enum(['positive', 'neutral', 'negative']),
        prominence: z.enum(['high', 'medium', 'low']),
    })).describe('Major stories and themes'),
    recent_developments: z.array(z.string()).describe('Latest news items (last 30 days)'),
    media_coverage_quality: z.enum(['extensive', 'moderate', 'limited']).describe('Breadth of coverage'),
    controversy_flags: z.array(z.string()).describe('Negative news or scandals'),
});

// Technical Analysis Output
export const TechnicalAnalysisOutput = z.object({
    trend_analysis: z.object({
        primary_trend: z.enum(['strong_uptrend', 'uptrend', 'sideways', 'downtrend', 'strong_downtrend']),
        trend_strength: z.number().min(1).max(10).describe('Conviction in trend (1-10)'),
        timeframe: z.enum(['short_term', 'intermediate', 'long_term']).describe('Trend horizon'),
    }),
    support_resistance: z.object({
        key_support_levels: z.array(z.number()).describe('Major support price levels'),
        key_resistance_levels: z.array(z.number()).describe('Major resistance price levels'),
        current_price_position: z.string().describe('Where price sits relative to levels'),
    }),
    momentum_indicators: z.object({
        rsi: z.number().min(0).max(100).nullable().describe('Relative Strength Index'),
        macd_signal: z.enum(['bullish', 'neutral', 'bearish']).describe('MACD indicator'),
        volume_trend: z.enum(['increasing', 'stable', 'decreasing']),
    }),
    chart_patterns: z.array(z.string()).describe('Notable patterns identified'),
    technical_summary: z.string().describe('Overall technical picture'),
});

// ============================================================================
// TIER 2: SYNTHESIS AGENT OUTPUT SCHEMAS
// ============================================================================

// Bull Case Output (used by bullCaseAgent)
export const BullCaseOutput = z.object({
    short_term: z.object({
        timeframe: z.string().describe('e.g., "Next 1-3 months"'),
        thesis: z.string().describe('Short-term bullish case'),
        key_drivers: z.array(z.string()).describe('Catalysts and factors'),
        confidence: z.number().min(1).max(10).describe('Conviction level (1-10)'),
    }),
    mid_term: z.object({
        timeframe: z.string().describe('e.g., "Next 6-12 months"'),
        thesis: z.string().describe('Mid-term bullish case'),
        key_drivers: z.array(z.string()).describe('Catalysts and factors'),
        confidence: z.number().min(1).max(10).describe('Conviction level (1-10)'),
    }),
    long_term: z.object({
        timeframe: z.string().describe('e.g., "Next 2-5 years"'),
        thesis: z.string().describe('Long-term bullish case'),
        key_drivers: z.array(z.string()).describe('Catalysts and factors'),
        confidence: z.number().min(1).max(10).describe('Conviction level (1-10)'),
    }),
    overall_bull_score: z.number().min(1).max(10).describe('Overall bullish conviction (1-10)'),
});

// Bear Case Output (used by bearCaseAgent)
export const BearCaseOutput = z.object({
    short_term: z.object({
        timeframe: z.string().describe('e.g., "Next 1-3 months"'),
        thesis: z.string().describe('Short-term bearish case'),
        key_risks: z.array(z.string()).describe('Risks and headwinds'),
        severity: z.number().min(1).max(10).describe('Risk severity (1-10)'),
    }),
    mid_term: z.object({
        timeframe: z.string().describe('e.g., "Next 6-12 months"'),
        thesis: z.string().describe('Mid-term bearish case'),
        key_risks: z.array(z.string()).describe('Risks and headwinds'),
        severity: z.number().min(1).max(10).describe('Risk severity (1-10)'),
    }),
    long_term: z.object({
        timeframe: z.string().describe('e.g., "Next 2-5 years"'),
        thesis: z.string().describe('Long-term bearish case'),
        key_risks: z.array(z.string()).describe('Risks and headwinds'),
        severity: z.number().min(1).max(10).describe('Risk severity (1-10)'),
    }),
    overall_bear_score: z.number().min(1).max(10).describe('Overall bearish conviction (1-10)'),
});

// Catalysts Output (used by catalystsAgent)
export const CatalystsOutput = z.object({
    upcoming_catalysts: z.array(z.object({
        event: z.string().describe('Catalyst event name'),
        date: z.string().describe('Expected date or timeframe'),
        potential_impact: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']),
        probability: z.enum(['high', 'medium', 'low']).describe('Likelihood of occurring'),
        description: z.string().describe('Details and implications'),
    })),
    positive_catalysts: z.array(z.string()).describe('Summary of upside triggers'),
    negative_catalysts: z.array(z.string()).describe('Summary of downside triggers'),
    catalyst_timeline: z.string().describe('Calendar of key dates'),
});

// Risks Output (used by risksAgent)
export const RisksOutput = z.object({
    financial_risks: z.array(z.object({
        risk: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        description: z.string(),
    })),
    operational_risks: z.array(z.object({
        risk: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        description: z.string(),
    })),
    market_risks: z.array(z.object({
        risk: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        description: z.string(),
    })),
    regulatory_legal_risks: z.array(z.object({
        risk: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        description: z.string(),
    })),
    overall_risk_assessment: z.string().describe('Summary of risk profile'),
    risk_score: z.number().min(1).max(10).describe('Overall risk level (1=low, 10=critical)'),
});

// Valuation Output (used by valuationAgent)
export const ValuationOutput = z.object({
    fair_value_range: z.object({
        low: z.number().describe('Conservative fair value estimate'),
        base: z.number().describe('Base case fair value estimate'),
        high: z.number().describe('Optimistic fair value estimate'),
    }),
    current_price: z.number(),
    valuation_assessment: z.enum(['significantly_undervalued', 'undervalued', 'fairly_valued', 'overvalued', 'significantly_overvalued']),
    upside_potential: z.number().describe('Percentage upside to base fair value'),
    downside_risk: z.number().describe('Percentage downside from current price'),
    position_sizing: z.object({
        recommended_allocation: z.enum(['large', 'medium', 'small', 'none']).describe('Position size recommendation'),
        reasoning: z.string().describe('Why this allocation'),
        risk_reward_ratio: z.number().describe('Expected return vs. risk'),
        max_portfolio_weight: z.number().describe('Maximum recommended portfolio percentage'),
    }),
    valuation_multiples_summary: z.string().describe('P/E, P/B, EV/EBITDA context vs peers/historical'),
});

// ============================================================================
// TIER 3: FINAL COMPREHENSIVE REPORT SCHEMA
// ============================================================================

export const ComprehensiveDueDiligenceReport = z.object({
    ticker: z.string(),
    company_name: z.string(),
    generated_at: z.string().describe('ISO timestamp of report generation'),

    // Executive Summary
    executive_summary: z.object({
        company_overview: z.string().describe('What the company does'),
        investment_thesis: z.string().describe('One-paragraph summary of opportunity'),
        overall_recommendation: z.enum(['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']),
        conviction_level: z.number().min(1).max(10).describe('Overall confidence (1-10)'),
        tldr: z.string().describe('2-3 sentence summary for quick reference'),
    }),

    // Core Analysis Sections
    bull_case: BullCaseOutput,
    bear_case: BearCaseOutput,
    catalysts: CatalystsOutput,
    risks: RisksOutput,
    valuation: ValuationOutput,

    // Supporting Data Summaries
    fundamental_summary: z.string().describe('Key fundamental highlights'),
    technical_summary: z.string().describe('Key technical highlights'),
    sentiment_summary: z.string().describe('News and social sentiment overview'),

    // Data Quality Indicators
    data_quality: z.object({
        fundamental_data_available: z.boolean(),
        earnings_transcripts_available: z.boolean(),
        news_coverage_quality: z.enum(['excellent', 'good', 'fair', 'limited']),
        social_sentiment_quality: z.enum(['excellent', 'good', 'fair', 'limited']),
        analysis_completeness: z.number().min(0).max(100).describe('Percentage of data sources available'),
    }),

    // Metadata
    metadata: z.object({
        data_sources_used: z.array(z.string()).describe('Which data sources contributed'),
        agents_executed: z.array(z.string()).describe('Which agents ran successfully'),
        warnings: z.array(z.string()).describe('Any data gaps or limitations'),
    }),
});

// Export types for TypeScript usage
export type FundamentalAnalysisOutput = z.infer<typeof FundamentalAnalysisOutput>;
export type RatiosAnalysisOutput = z.infer<typeof RatiosAnalysisOutput>;
export type EarningsAnalysisOutput = z.infer<typeof EarningsAnalysisOutput>;
export type NewsSentimentOutput = z.infer<typeof NewsSentimentOutput>;
export type TechnicalAnalysisOutput = z.infer<typeof TechnicalAnalysisOutput>;
export type BullCaseOutput = z.infer<typeof BullCaseOutput>;
export type BearCaseOutput = z.infer<typeof BearCaseOutput>;
export type CatalystsOutput = z.infer<typeof CatalystsOutput>;
export type RisksOutput = z.infer<typeof RisksOutput>;
export type ValuationOutput = z.infer<typeof ValuationOutput>;
export type ComprehensiveDueDiligenceReport = z.infer<typeof ComprehensiveDueDiligenceReport>;

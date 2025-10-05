import { z } from 'zod';

// ============================================================================
// TIER 1: QUALITATIVE DATA ANALYSIS AGENT OUTPUT SCHEMAS
// ============================================================================
// Focus: Text-based intelligence gathering, narrative analysis, sentiment extraction
// Excludes: Numerical calculations, financial metrics, quantitative valuations

// Earnings Transcript Analysis Output
export const EarningsAnalysisOutput = z.object({
    management_sentiment: z.object({
        overall_tone: z.enum(['very_positive', 'positive', 'neutral', 'cautious', 'negative']),
        confidence_level: z.number().min(1).max(10).describe('Management confidence (1-10)'),
        key_themes: z.array(z.string()).describe('Major topics discussed'),
    }),
    forward_guidance: z.object({
        direction: z.enum(['raised', 'maintained', 'lowered', 'not_provided']),
        specifics: z.string().describe('Detailed guidance notes (qualitative description)'),
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

// ============================================================================
// TIER 2: SYNTHESIS AGENT OUTPUT SCHEMAS
// ============================================================================
// Focus: Qualitative argument construction, narrative synthesis, thematic analysis

// Bull Case Output (used by bullCaseAgent)
export const BullCaseOutput = z.object({
    short_term: z.object({
        timeframe: z.string().describe('e.g., "Next 1-3 months"'),
        thesis: z.string().describe('Short-term bullish case (qualitative narrative)'),
        key_drivers: z.array(z.string()).describe('Catalysts and factors'),
        confidence: z.number().min(1).max(10).describe('Conviction level (1-10)'),
    }),
    mid_term: z.object({
        timeframe: z.string().describe('e.g., "Next 6-12 months"'),
        thesis: z.string().describe('Mid-term bullish case (qualitative narrative)'),
        key_drivers: z.array(z.string()).describe('Catalysts and factors'),
        confidence: z.number().min(1).max(10).describe('Conviction level (1-10)'),
    }),
    long_term: z.object({
        timeframe: z.string().describe('e.g., "Next 2-5 years"'),
        thesis: z.string().describe('Long-term bullish case (qualitative narrative)'),
        key_drivers: z.array(z.string()).describe('Catalysts and factors'),
        confidence: z.number().min(1).max(10).describe('Conviction level (1-10)'),
    }),
    overall_bull_score: z.number().min(1).max(10).describe('Overall bullish conviction (1-10)'),
});

// Bear Case Output (used by bearCaseAgent)
export const BearCaseOutput = z.object({
    short_term: z.object({
        timeframe: z.string().describe('e.g., "Next 1-3 months"'),
        thesis: z.string().describe('Short-term bearish case (qualitative narrative)'),
        key_risks: z.array(z.string()).describe('Risks and headwinds'),
        severity: z.number().min(1).max(10).describe('Risk severity (1-10)'),
    }),
    mid_term: z.object({
        timeframe: z.string().describe('e.g., "Next 6-12 months"'),
        thesis: z.string().describe('Mid-term bearish case (qualitative narrative)'),
        key_risks: z.array(z.string()).describe('Risks and headwinds'),
        severity: z.number().min(1).max(10).describe('Risk severity (1-10)'),
    }),
    long_term: z.object({
        timeframe: z.string().describe('e.g., "Next 2-5 years"'),
        thesis: z.string().describe('Long-term bearish case (qualitative narrative)'),
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

// ============================================================================
// TIER 3: FINAL QUALITATIVE INTELLIGENCE REPORT SCHEMA
// ============================================================================

export const QualitativeDueDiligenceReport = z.object({
    ticker: z.string(),
    company_name: z.string(),
    generated_at: z.string().describe('ISO timestamp of report generation'),

    // Executive Summary
    executive_summary: z.object({
        company_overview: z.string().describe('What the company does (narrative description)'),
        investment_thesis: z.string().describe('One-paragraph qualitative summary of the opportunity'),
        overall_sentiment: z.enum(['strong_conviction', 'conviction', 'neutral', 'skeptical', 'strong_skeptical']).describe('Qualitative assessment based on narrative analysis'),
        conviction_level: z.number().min(1).max(10).describe('Overall confidence in the narrative (1-10)'),
        tldr: z.string().describe('2-3 sentence summary for quick reference'),
    }),

    // Core Analysis Sections
    bull_case: BullCaseOutput,
    bear_case: BearCaseOutput,
    catalysts: CatalystsOutput,
    risks: RisksOutput,

    // Supporting Intelligence Summaries
    management_intelligence: z.object({
        summary: z.string().describe('Key insights from earnings calls'),
        credibility_assessment: z.string().describe('How trustworthy is management based on tone and track record'),
        key_quotes: z.array(z.string()).describe('Most revealing management statements'),
    }),
    news_intelligence: z.object({
        summary: z.string().describe('Key narratives from news coverage'),
        narrative_shifts: z.array(z.string()).describe('How the story is changing over time'),
        media_sentiment: z.string().describe('Overall media perception'),
    }),
    social_intelligence: z.object({
        summary: z.string().describe('Key insights from social media (Reddit)'),
        crowd_positioning: z.string().describe('What is the retail crowd doing/thinking'),
        contrarian_signals: z.array(z.string()).describe('Signs of over-optimism or over-pessimism'),
    }),

    // Data Quality Indicators
    data_quality: z.object({
        earnings_transcripts_available: z.boolean(),
        news_coverage_quality: z.enum(['excellent', 'good', 'fair', 'limited']),
        social_sentiment_quality: z.enum(['excellent', 'good', 'fair', 'limited']),
        analysis_completeness: z.number().min(0).max(100).describe('Percentage of qualitative data sources available'),
    }),

    // Metadata
    metadata: z.object({
        data_sources_used: z.array(z.string()).describe('Which data sources contributed'),
        agents_executed: z.array(z.string()).describe('Which agents ran successfully'),
        warnings: z.array(z.string()).describe('Any data gaps or limitations'),
    }),
});

// Export types for TypeScript usage
export type EarningsAnalysisOutput = z.infer<typeof EarningsAnalysisOutput>;
export type NewsSentimentOutput = z.infer<typeof NewsSentimentOutput>;
export type BullCaseOutput = z.infer<typeof BullCaseOutput>;
export type BearCaseOutput = z.infer<typeof BearCaseOutput>;
export type CatalystsOutput = z.infer<typeof CatalystsOutput>;
export type RisksOutput = z.infer<typeof RisksOutput>;
export type QualitativeDueDiligenceReport = z.infer<typeof QualitativeDueDiligenceReport>;

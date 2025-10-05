import { run } from '@openai/agents';
import { earningsAgent } from './earningsAgent';
import { newsSentimentAgent } from './newsSentimentAgent';
import { redditAgent } from './redditAgent';
import { baseInfoAgent } from './baseInfoAgent';
import { bullCaseAgent } from './bullCaseAgent';
import { bearCaseAgent } from './bearCaseAgent';
import { catalystsAgent } from './catalystsAgent';
import { risksAgent } from './risksAgent';
import {
  QualitativeDueDiligenceReport,
  EarningsAnalysisOutput,
  NewsSentimentOutput,
  BullCaseOutput,
  BearCaseOutput,
  CatalystsOutput,
  RisksOutput,
} from './types/reportTypes';

export interface TickerData {
  companyInfo: any;
  transcripts: any[];
  newsArticles: any[];
  redditPosts: any[];
}

export interface Tier1Context {
  earnings: EarningsAnalysisOutput;
  news: NewsSentimentOutput;
  social: any; // RedditPostSummary from redditAgent
  baseInfo: any; // BaseInfoSummary from baseInfoAgent
}

export class QualitativeIntelligenceManager {
  async run(ticker: string, data: TickerData): Promise<QualitativeDueDiligenceReport> {
    console.log(`[start] Starting qualitative analysis for ${ticker}...`);

    // Phase 1: Tier 1 - Data Analysis (run in parallel for speed)
    console.log('[phase-1] Running Tier 1 data analysis agents...');
    const [earnings, news, social, baseInfo] = await Promise.all([
      this.analyzeEarnings(data.transcripts),
      this.analyzeNews(data.newsArticles),
      this.analyzeSocial(data.redditPosts),
      this.analyzeBaseInfo(data.companyInfo),
    ]);

    // Phase 2: Tier 2 - Synthesis (run in parallel, all consume Tier 1 outputs)
    console.log('[phase-2] Running Tier 2 synthesis agents...');
    const tier1Context: Tier1Context = {
      earnings,
      news,
      social,
      baseInfo,
    };

    const [bullCase, bearCase, catalysts, risks] = await Promise.all([
      this.buildBullCase(tier1Context),
      this.buildBearCase(tier1Context),
      this.identifyCatalysts(tier1Context),
      this.assessRisks(tier1Context),
    ]);

    // Phase 3: Final Report Assembly (pure TypeScript, no LLM calls)
    console.log('[phase-3] Assembling final report...');
    const report = this.assembleReport(
      ticker,
      tier1Context,
      bullCase,
      bearCase,
      catalysts,
      risks,
      data
    );

    console.log('[complete] Qualitative intelligence report generated successfully');
    return report;
  }

  // ===========================================================================
  // TIER 1 AGENT RUNNERS
  // ===========================================================================

  private async analyzeEarnings(transcripts: any[]): Promise<EarningsAnalysisOutput> {
    console.log(`[tier-1] Analyzing ${transcripts.length} earnings transcripts...`);
    if (!transcripts || transcripts.length === 0) {
      console.log('[tier-1] No earnings transcripts available, using placeholder');
      // Return placeholder when no data
      return {
        management_sentiment: {
          overall_tone: 'neutral',
          confidence_level: 5,
          key_themes: ['No earnings data available'],
        },
        forward_guidance: {
          direction: 'not_provided',
          specifics: 'No earnings transcripts available for analysis',
          credibility: 'medium',
        },
        concerns_raised: [],
        opportunities_highlighted: [],
        analyst_question_themes: [],
        transcript_summary: 'No earnings transcripts available for analysis',
      };
    }

    const result = await run(earningsAgent, JSON.stringify(transcripts));
    return result.finalOutput as EarningsAnalysisOutput;
  }

  private async analyzeNews(newsArticles: any[]): Promise<NewsSentimentOutput> {
    console.log(`[tier-1] Analyzing ${newsArticles?.length || 0} news articles...`);
    if (!newsArticles || newsArticles.length === 0) {
      console.log('[tier-1] No news articles available, using placeholder');
      return {
        overall_sentiment: {
          score: 0,
          trend: 'stable',
          volume: 0,
        },
        key_narratives: [],
        recent_developments: ['No news data available'],
        media_coverage_quality: 'limited',
        controversy_flags: [],
      };
    }

    const result = await run(newsSentimentAgent, JSON.stringify(newsArticles));
    return result.finalOutput as NewsSentimentOutput;
  }

  private async analyzeSocial(redditPosts: any[]) {
    console.log(`[tier-1] Analyzing ${redditPosts?.length || 0} Reddit posts...`);
    if (!redditPosts || redditPosts.length === 0) {
      console.log('[tier-1] No Reddit posts available, using placeholder');
      return {
        sentiment: {
          bullish_percent: 50,
          neutral_percent: 50,
          bearish_percent: 0,
          intensity_score: 5,
          velocity: 'stable',
          unique_users: 0,
        },
        consensus: {
          bullish_thesis: 'No social data available',
          bearish_thesis: 'No social data available',
          price_targets: [],
          timeline_expectations: 'Unknown',
          key_events: [],
        },
        trading_signals: {
          quality_score: 5,
          manipulation_risk: 'low',
          contrarian_opportunity: false,
          conviction_follow: 5,
          conviction_fade: 5,
        },
        insights: {
          key_finding: 'No Reddit data available for analysis',
          predicted_outcome: 'Insufficient data',
          options_strategy: 'Insufficient data',
          consensus_trade: {
            direction: 'calls',
            strike: 'Unknown',
            expiration: 'Unknown',
            confidence: 'low',
          },
        },
      };
    }

    const result = await run(redditAgent, JSON.stringify(redditPosts));
    return result.finalOutput;
  }

  private async analyzeBaseInfo(companyInfo: any) {
    console.log('[tier-1] Analyzing company information...');
    if (!companyInfo || Object.keys(companyInfo).length === 0) {
      console.log('[tier-1] No company info available, using placeholder');
      return {
        summary: 'Company information not available',
      };
    }

    const result = await run(baseInfoAgent, JSON.stringify(companyInfo));
    return result.finalOutput;
  }

  // ===========================================================================
  // TIER 2 AGENT RUNNERS
  // ===========================================================================

  private async buildBullCase(tier1Context: Tier1Context): Promise<BullCaseOutput> {
    console.log('[tier-2] Building qualitative bull case...');
    const result = await run(bullCaseAgent, JSON.stringify(tier1Context));
    return result.finalOutput as BullCaseOutput;
  }

  private async buildBearCase(tier1Context: Tier1Context): Promise<BearCaseOutput> {
    console.log('[tier-2] Building qualitative bear case...');
    const result = await run(bearCaseAgent, JSON.stringify(tier1Context));
    return result.finalOutput as BearCaseOutput;
  }

  private async identifyCatalysts(tier1Context: Tier1Context): Promise<CatalystsOutput> {
    console.log('[tier-2] Identifying catalysts...');
    const result = await run(catalystsAgent, JSON.stringify(tier1Context));
    return result.finalOutput as CatalystsOutput;
  }

  private async assessRisks(tier1Context: Tier1Context): Promise<RisksOutput> {
    console.log('[tier-2] Assessing qualitative risks...');
    const result = await run(risksAgent, JSON.stringify(tier1Context));
    return result.finalOutput as RisksOutput;
  }

  // ===========================================================================
  // FINAL ASSEMBLY (Pure TypeScript - No LLM calls)
  // ===========================================================================

  private assembleReport(
    ticker: string,
    tier1: Tier1Context,
    bullCase: BullCaseOutput,
    bearCase: BearCaseOutput,
    catalysts: CatalystsOutput,
    risks: RisksOutput,
    data: TickerData
  ): QualitativeDueDiligenceReport {

    const sentiment = this.determineSentiment(bullCase.overall_bull_score, bearCase.overall_bear_score);
    const conviction = this.calculateConviction(bullCase, bearCase);

    return {
      ticker: ticker.toUpperCase(),
      company_name: tier1.baseInfo.summary || ticker.toUpperCase(),
      generated_at: new Date().toISOString(),

      executive_summary: {
        company_overview: tier1.baseInfo.summary || 'Company information not available',
        investment_thesis: this.synthesizeThesis(bullCase, bearCase, tier1),
        overall_sentiment: sentiment,
        conviction_level: conviction,
        tldr: this.generateTLDR(ticker, bullCase, bearCase, sentiment),
      },

      bull_case: bullCase,
      bear_case: bearCase,
      catalysts: catalysts,
      risks: risks,

      management_intelligence: {
        summary: tier1.earnings.transcript_summary,
        credibility_assessment: this.assessManagementCredibility(tier1.earnings),
        key_quotes: this.extractKeyQuotes(tier1.earnings),
      },

      news_intelligence: {
        summary: this.summarizeNewsNarrative(tier1.news),
        narrative_shifts: tier1.news.recent_developments,
        media_sentiment: this.describeMediaSentiment(tier1.news),
      },

      social_intelligence: {
        summary: tier1.social.insights?.key_finding || 'No social data available',
        crowd_positioning: this.describeCrowdPositioning(tier1.social),
        contrarian_signals: this.identifyContrarianSignals(tier1.social),
      },

      data_quality: {
        earnings_transcripts_available: data.transcripts?.length > 0,
        news_coverage_quality: tier1.news.media_coverage_quality,
        social_sentiment_quality: this.assessSocialQuality(tier1.social),
        analysis_completeness: this.calculateCompleteness(data),
      },

      metadata: {
        data_sources_used: this.listDataSources(data),
        agents_executed: [
          'earningsAgent',
          'newsSentimentAgent',
          'redditAgent',
          'baseInfoAgent',
          'bullCaseAgent',
          'bearCaseAgent',
          'catalystsAgent',
          'risksAgent',
        ],
        warnings: this.generateWarnings(data),
      },
    };
  }

  // ===========================================================================
  // HELPER METHODS (Pure TypeScript logic)
  // ===========================================================================

  private determineSentiment(
    bullScore: number,
    bearScore: number
  ): 'strong_conviction' | 'conviction' | 'neutral' | 'skeptical' | 'strong_skeptical' {
    const net = bullScore - bearScore;
    if (net >= 4) return 'strong_conviction';
    if (net >= 2) return 'conviction';
    if (net >= -2) return 'neutral';
    if (net >= -4) return 'skeptical';
    return 'strong_skeptical';
  }

  private calculateConviction(bullCase: BullCaseOutput, bearCase: BearCaseOutput): number {
    // Average the scores, inverting bear score
    return Math.round((bullCase.overall_bull_score + (10 - bearCase.overall_bear_score)) / 2);
  }

  private synthesizeThesis(bullCase: BullCaseOutput, bearCase: BearCaseOutput, tier1: Tier1Context): string {
    const bullThesis = bullCase.mid_term.thesis.substring(0, 150);
    const bearThesis = bearCase.mid_term.thesis.substring(0, 150);

    return `Bulls argue: ${bullThesis}... Bears counter: ${bearThesis}... Based on ${tier1.earnings.management_sentiment.overall_tone} management tone and ${tier1.news.overall_sentiment.trend} news sentiment.`;
  }

  private generateTLDR(ticker: string, bullCase: BullCaseOutput, bearCase: BearCaseOutput, sentiment: string): string {
    const sentimentWord = sentiment.replace('_', ' ');
    const keyBullDriver = bullCase.short_term.key_drivers[0] || 'positive narratives';
    const keyBearRisk = bearCase.short_term.key_risks[0] || 'identified concerns';

    return `${sentimentWord} on ${ticker}. ${keyBullDriver} vs. ${keyBearRisk}.`;
  }

  private assessManagementCredibility(earnings: EarningsAnalysisOutput): string {
    const tone = earnings.management_sentiment.overall_tone;
    const confidence = earnings.management_sentiment.confidence_level;
    const credibility = earnings.forward_guidance.credibility;

    return `Management exhibits ${tone} tone with ${confidence}/10 confidence. Historical guidance credibility: ${credibility}.`;
  }

  private extractKeyQuotes(earnings: EarningsAnalysisOutput): string[] {
    // Extract from concerns and opportunities
    return [
      ...earnings.opportunities_highlighted.slice(0, 2),
      ...earnings.concerns_raised.slice(0, 1),
    ];
  }

  private summarizeNewsNarrative(news: NewsSentimentOutput): string {
    const topNarratives = news.key_narratives.slice(0, 3).map(n => n.theme).join(', ');
    return `Key media themes: ${topNarratives}. Overall sentiment ${news.overall_sentiment.trend} with score of ${news.overall_sentiment.score}/10.`;
  }

  private describeMediaSentiment(news: NewsSentimentOutput): string {
    const score = news.overall_sentiment.score;
    if (score >= 5) return 'Positive media perception with favorable coverage';
    if (score >= 0) return 'Mixed media perception with balanced coverage';
    return 'Negative media perception with critical coverage';
  }

  private describeCrowdPositioning(social: any): string {
    const bullish = social.sentiment?.bullish_percent || 50;
    const bearish = social.sentiment?.bearish_percent || 0;

    if (bullish > 70) return 'Heavily bullish crowd with high conviction';
    if (bullish > 55) return 'Moderately bullish crowd positioning';
    if (bearish > 70) return 'Heavily bearish crowd with high conviction';
    if (bearish > 55) return 'Moderately bearish crowd positioning';
    return 'Mixed crowd positioning with no clear consensus';
  }

  private identifyContrarianSignals(social: any): string[] {
    const signals: string[] = [];

    if (social.trading_signals?.contrarian_opportunity) {
      signals.push('Contrarian opportunity identified by social analysis');
    }

    const bullish = social.sentiment?.bullish_percent || 50;
    if (bullish > 85) {
      signals.push('Extreme bullish positioning may indicate crowded trade');
    }
    if (bullish < 15) {
      signals.push('Extreme bearish positioning may indicate capitulation opportunity');
    }

    return signals;
  }

  private assessSocialQuality(social: any): 'excellent' | 'good' | 'fair' | 'limited' {
    const quality = social.trading_signals?.quality_score || 5;
    if (quality >= 8) return 'excellent';
    if (quality >= 6) return 'good';
    if (quality >= 4) return 'fair';
    return 'limited';
  }

  private calculateCompleteness(data: TickerData): number {
    let available = 0;
    let total = 4;

    if (data.transcripts?.length > 0) available++;
    if (data.newsArticles?.length > 0) available++;
    if (data.redditPosts?.length > 0) available++;
    if (data.companyInfo && Object.keys(data.companyInfo).length > 0) available++;

    return Math.round((available / total) * 100);
  }

  private listDataSources(data: TickerData): string[] {
    const sources: string[] = [];
    if (data.transcripts?.length > 0) sources.push('Earnings Call Transcripts');
    if (data.newsArticles?.length > 0) sources.push('News Articles');
    if (data.redditPosts?.length > 0) sources.push('Reddit Social Sentiment');
    if (data.companyInfo && Object.keys(data.companyInfo).length > 0) sources.push('Company Information');
    return sources;
  }

  private generateWarnings(data: TickerData): string[] {
    const warnings: string[] = [];

    if (!data.transcripts || data.transcripts.length === 0) {
      warnings.push('No earnings transcripts available - management analysis limited');
    }
    if (!data.newsArticles || data.newsArticles.length === 0) {
      warnings.push('Limited news coverage - may indicate small-cap or low media attention');
    }
    if (!data.redditPosts || data.redditPosts.length === 0) {
      warnings.push('Minimal Reddit discussion found - limited retail sentiment data');
    }

    return warnings;
  }
}

import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const ticker = getRouterParam(event, 'ticker')?.toUpperCase();

  if (!ticker) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ticker parameter is required'
    });
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey
  );

  try {
    // Fetch all searches for this ticker
    const { data: searches, error } = await supabase
      .from('ticker_searches')
      .select('*')
      .eq('ticker', ticker);

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch ticker statistics'
      });
    }

    // Calculate statistics with dummy data for new features
    const stats: any = {
      // Original stats
      totalSearches: 0,
      totalPosts: 0,
      uniqueSubreddits: 0,
      averageScore: 0,
      totalComments: 0,
      topPost: null,
      mostActiveSubreddit: null,
      dateRange: {
        first: null,
        last: null
      },
      postsBySubreddit: {} as Record<string, number>,
      postsByDate: {} as Record<string, number>,
      
      // New stats with dummy data
      // Stock price data
      currentPrice: 145.32 + Math.random() * 10,
      priceChange: 3.45 + (Math.random() - 0.5) * 5,
      priceChangePercent: 2.43 + (Math.random() - 0.5) * 3,
      
      // Sentiment analysis
      sentiment: {
        positive: 65 + Math.floor(Math.random() * 10),
        neutral: 25,
        negative: 10,
        score: 0.55 + (Math.random() - 0.5) * 0.3 // -1 to 1 scale
      },
      
      // Analyst data
      analystRating: {
        score: 4.2 + (Math.random() - 0.5) * 0.5,
        count: 12 + Math.floor(Math.random() * 5),
        breakdown: {
          strongBuy: 5,
          buy: 4,
          hold: 2,
          sell: 1,
          strongSell: 0
        }
      },
      
      // Meme factor
      memeFactor: {
        score: 8.5 + (Math.random() - 0.5) * 2,
        trending: true,
        mentions24h: 1250 + Math.floor(Math.random() * 500),
        momentum: Math.random() > 0.5 ? "🔥 Hot" : "📈 Rising"
      },
      
      // Sentiment distribution for visualization
      sentimentDistribution: [
        { label: "Very Positive", value: 25 + Math.floor(Math.random() * 10) },
        { label: "Positive", value: 40 + Math.floor(Math.random() * 10) },
        { label: "Neutral", value: 25 },
        { label: "Negative", value: 8 },
        { label: "Very Negative", value: 2 }
      ]
    };

    if (!searches || searches.length === 0) {
      // Normalize sentiment distribution to add up to 100%
      const total = stats.sentimentDistribution.reduce((sum: number, item: any) => sum + item.value, 0);
      stats.sentimentDistribution = stats.sentimentDistribution.map((item: any) => ({
        ...item,
        value: Math.round((item.value / total) * 100)
      }));
      return stats;
    }

    let allPosts: any[] = [];
    const subredditCounts: Record<string, number> = {};
    const uniqueSearchDates = new Set<string>();
    const uniqueSubreddits = new Set<string>();

    searches.forEach((search: any) => {
      uniqueSearchDates.add(search.created_at);
      uniqueSubreddits.add(search.subreddit);
      
      if (search.search_data && Array.isArray(search.search_data)) {
        const posts = search.search_data;
        allPosts = allPosts.concat(posts);
        
        // Count posts by subreddit
        if (!subredditCounts[search.subreddit]) {
          subredditCounts[search.subreddit] = 0;
        }
        subredditCounts[search.subreddit] += posts.length;
        
        // Count posts by date
        const dateKey = new Date(search.created_at).toISOString().split('T')[0];
        if (!stats.postsByDate[dateKey]) {
          stats.postsByDate[dateKey] = 0;
        }
        stats.postsByDate[dateKey] += posts.length;
      }
    });

    // Remove duplicates based on post ID
    const uniquePosts: any[] = [];
    const seenIds = new Set<string>();
    allPosts.forEach((post: any) => {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        uniquePosts.push(post);
      }
    });

    stats.totalSearches = uniqueSearchDates.size;
    stats.totalPosts = uniquePosts.length;
    stats.uniqueSubreddits = uniqueSubreddits.size;
    
    if (uniquePosts.length > 0) {
      // Calculate average score
      const totalScore = uniquePosts.reduce((sum: number, post: any) => sum + (post.score || 0), 0);
      stats.averageScore = Math.round(totalScore / uniquePosts.length);
      
      // Calculate total comments
      stats.totalComments = uniquePosts.reduce((sum: number, post: any) => sum + (post.num_comments || 0), 0);
      
      // Find top post by score
      stats.topPost = uniquePosts.reduce((top: any, post: any) => 
        (!top || (post.score || 0) > (top.score || 0)) ? post : top
      , null);
      
      // Find most active subreddit
      const maxCount = Math.max(...Object.values(subredditCounts));
      stats.mostActiveSubreddit = Object.entries(subredditCounts)
        .find(([_, count]) => count === maxCount)?.[0] || null;
    }
    
    stats.postsBySubreddit = subredditCounts;
    
    // Calculate date range
    const dates = Array.from(uniqueSearchDates).map((d: string) => new Date(d));
    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      stats.dateRange.first = dates[0]?.toISOString() || null;
      stats.dateRange.last = dates[dates.length - 1]?.toISOString() || null;
    }

    // Normalize sentiment distribution to add up to 100%
    const total = stats.sentimentDistribution.reduce((sum: number, item: any) => sum + item.value, 0);
    stats.sentimentDistribution = stats.sentimentDistribution.map((item: any) => ({
      ...item,
      value: Math.round((item.value / total) * 100)
    }));
    
    // Ensure sentiment.positive matches the distribution
    stats.sentiment.positive = stats.sentimentDistribution
      .filter((item: any) => item.label.includes('Positive'))
      .reduce((sum: number, item: any) => sum + item.value, 0);
    stats.sentiment.neutral = stats.sentimentDistribution
      .filter((item: any) => item.label === 'Neutral')
      .reduce((sum: number, item: any) => sum + item.value, 0);
    stats.sentiment.negative = stats.sentimentDistribution
      .filter((item: any) => item.label.includes('Negative'))
      .reduce((sum: number, item: any) => sum + item.value, 0);
    
    // Round analyst rating score to 1 decimal
    stats.analystRating.score = Math.round(stats.analystRating.score * 10) / 10;
    
    // Round meme factor score to 1 decimal
    stats.memeFactor.score = Math.round(stats.memeFactor.score * 10) / 10;
    
    // Round price to 2 decimals
    stats.currentPrice = Math.round(stats.currentPrice * 100) / 100;
    stats.priceChange = Math.round(stats.priceChange * 100) / 100;
    stats.priceChangePercent = Math.round(stats.priceChangePercent * 100) / 100;
    
    return stats;
  } catch (error) {
    console.error('Error calculating ticker statistics:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to calculate ticker statistics'
    });
  }
});
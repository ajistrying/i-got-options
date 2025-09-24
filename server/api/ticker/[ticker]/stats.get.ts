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

    // Calculate statistics
    const stats: any = {
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
      postsByDate: {} as Record<string, number>
    };

    if (!searches || searches.length === 0) {
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

    return stats;
  } catch (error) {
    console.error('Error calculating ticker statistics:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to calculate ticker statistics'
    });
  }
});
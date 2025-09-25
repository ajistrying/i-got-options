import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const { ticker, subreddits } = body;

  if (!ticker) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ticker is required'
    });
  }

  if (!subreddits || !Array.isArray(subreddits) || subreddits.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one subreddit must be selected'
    });
  }

  // Initialize Supabase client
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey
  );

  // Helper function to fetch comments for a post
  const fetchPostComments = async (subreddit: string, postId: string, limit = 10) => {
    try {
      const commentsUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;
      const response: any = await $fetch(commentsUrl, {
        headers: {
          'User-Agent': 'OptionsTracker/1.0'
        },
        query: {
          limit,
          sort: 'best',
          raw_json: 1
        }
      });

      if (response && response[1]?.data?.children) {
        return response[1].data.children
          .filter((child: any) => child.kind === 't1') // Only comments, not 'more' objects
          .slice(0, limit)
          .map((child: any) => ({
            id: child.data.id,
            author: child.data.author,
            body: child.data.body,
            score: child.data.score,
            created_utc: child.data.created_utc,
            permalink: `https://reddit.com${child.data.permalink}`
          }));
      }
      return [];
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return [];
    }
  };

  // Helper function to fetch posts with a specific sort
  const fetchSubredditPosts = async (subreddit: string, sort: 'hot' | 'new', limit = 25) => {
    try {
      const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json`;
      const searchResponse: any = await $fetch(searchUrl, {
        headers: {
          'User-Agent': 'OptionsTracker/1.0'
        },
        query: {
          q: ticker,
          restrict_sr: 'true',
          sort,
          t: sort === 'hot' ? 'week' : 'day', // Hot posts from past week, new posts from past day
          limit,
          raw_json: 1
        }
      });

      if (searchResponse?.data?.children) {
        return searchResponse.data.children.map((child: any) => ({
          id: child.data.id,
          title: child.data.title,
          author: child.data.author,
          subreddit: child.data.subreddit,
          score: child.data.score,
          num_comments: child.data.num_comments,
          created_utc: child.data.created_utc,
          selftext: child.data.selftext || '',
          url: child.data.url,
          permalink: `https://reddit.com${child.data.permalink}`,
          sort_method: sort
        }));
      }
      return [];
    } catch (error) {
      console.error(`Error fetching ${sort} posts from ${subreddit}:`, error);
      return [];
    }
  };

  // Helper function to add delay for rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    const unifiedSearchData: any = {
      subreddits: {}
    };
    
    const searchMetadata = {
      ticker: ticker.toUpperCase(),
      subreddits_searched: subreddits,
      search_timestamp: new Date().toISOString(),
      total_posts: 0,
      total_comments: 0,
      posts_with_comments: 0
    };

    // Process each subreddit
    for (const subreddit of subreddits) {
      try {
        // Fetch both hot and new posts in parallel
        const [hotPosts, newPosts] = await Promise.all([
          fetchSubredditPosts(subreddit, 'hot', 15),
          fetchSubredditPosts(subreddit, 'new', 15)
        ]);

        // Combine and deduplicate posts
        const postsMap = new Map();
        [...hotPosts, ...newPosts].forEach(post => {
          if (!postsMap.has(post.id) || postsMap.get(post.id).score < post.score) {
            postsMap.set(post.id, post);
          }
        });

        // Convert to array and sort by a combination of recency and engagement
        let posts = Array.from(postsMap.values()).sort((a, b) => {
          // Calculate a relevance score combining recency and engagement
          const now = Date.now() / 1000;
          const aAge = (now - a.created_utc) / 3600; // Age in hours
          const bAge = (now - b.created_utc) / 3600;
          
          // Score formula: engagement score / (age in hours + 2)
          // This prioritizes high engagement recent posts
          const aRelevance = (a.score + a.num_comments * 2) / (aAge + 2);
          const bRelevance = (b.score + b.num_comments * 2) / (bAge + 2);
          
          return bRelevance - aRelevance;
        });

        // Limit to top posts
        posts = posts.slice(0, 20);

        // Fetch comments for top 5 posts with high engagement
        const topPostsForComments = posts
          .filter(post => post.num_comments > 0)
          .slice(0, 5);

        for (const post of topPostsForComments) {
          await delay(300); // Rate limiting delay
          post.comments = await fetchPostComments(subreddit, post.id, 10);
          if (post.comments.length > 0) {
            searchMetadata.posts_with_comments++;
            searchMetadata.total_comments += post.comments.length;
          }
        }

        // Store subreddit data in unified structure
        unifiedSearchData.subreddits[subreddit] = {
          posts,
          count: posts.length,
          fetched_at: new Date().toISOString()
        };

        searchMetadata.total_posts += posts.length;

      } catch (error) {
        console.error(`Error processing ${subreddit}:`, error);
        unifiedSearchData.subreddits[subreddit] = {
          posts: [],
          count: 0,
          error: `Failed to search ${subreddit}`,
          fetched_at: new Date().toISOString()
        };
      }
    }

    // Store unified search results in database
    const { error: dbError } = await supabase
      .from('ticker_searches')
      .insert({
        ticker: ticker.toUpperCase(),
        unified_search_data: unifiedSearchData,
        search_metadata: searchMetadata,
        search_query: ticker,
        data_version: 2, // Mark as new unified format
        // Keep backward compatibility fields null
        subreddit: null,
        search_data: null
      });

    if (dbError) {
      console.error('Error storing unified search data:', dbError);
    }

    // Return response in a format compatible with existing frontend
    const formattedResults = Object.entries(unifiedSearchData.subreddits).map(([subreddit, data]: [string, any]) => ({
      subreddit,
      count: data.count,
      posts: data.posts,
      error: data.error
    }));

    return {
      ticker: ticker.toUpperCase(),
      timestamp: searchMetadata.search_timestamp,
      results: formattedResults,
      total_posts: searchMetadata.total_posts,
      total_comments: searchMetadata.total_comments,
      posts_with_comments: searchMetadata.posts_with_comments,
      metadata: searchMetadata
    };
  } catch (error) {
    console.error('Reddit API error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search Reddit'
    });
  }
});
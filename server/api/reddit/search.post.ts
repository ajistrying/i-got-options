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

  // Helper function to fetch posts from a subreddit
  const fetchSubredditPosts = async (subreddit: string, sortMethod: string, limit: number) => {
    try {
      const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json`;
      const searchResponse: any = await $fetch(searchUrl, {
        headers: {
          'User-Agent': 'OptionsTracker/1.0'
        },
        query: {
          q: ticker,
          restrict_sr: 'true',
          sort: sortMethod,
          limit: limit,
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
          sort_method: sortMethod
        }));
      }
      return [];
    } catch (error) {
      console.error(`Error fetching ${sortMethod} posts from ${subreddit}:`, error);
      return [];
    }
  };

  // Helper function to fetch comments for a post
  const fetchPostComments = async (subreddit: string, postId: string, limit: number) => {
    try {
      const commentsUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;
      const commentsResponse: any = await $fetch(commentsUrl, {
        headers: {
          'User-Agent': 'OptionsTracker/1.0'
        },
        query: {
          limit: limit,
          sort: 'best',
          raw_json: 1
        }
      });

      if (commentsResponse && commentsResponse[1]?.data?.children) {
        return commentsResponse[1].data.children
          .filter((child: any) => child.kind === 't1')
          .map((child: any) => ({
            id: child.data.id,
            author: child.data.author,
            body: child.data.body,
            score: child.data.score,
            created_utc: child.data.created_utc,
            replies_count: child.data.replies?.data?.children?.length || 0
          }));
      }
      return [];
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
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
        // Fetch hot posts from the subreddit
        const posts = await fetchSubredditPosts(subreddit, 'hot', 10);

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

    // Check if a record exists for this ticker (may have been created by fundamentalData endpoint)
    const { data: existingRecord, error: fetchError } = await supabase
      .from('ticker_searches')
      .select('id, unified_search_data, search_metadata')
      .eq('ticker', ticker.toUpperCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingRecord) {
      // Merge new Reddit search data with existing record
      const mergedSearchData = {
        ...existingRecord.unified_search_data,
        ...unifiedSearchData
      };

      const mergedMetadata = {
        ...existingRecord.search_metadata,
        ...searchMetadata
      };

      // Update existing record with Reddit search data
      const { error: updateError } = await supabase
        .from('ticker_searches')
        .update({
          unified_search_data: mergedSearchData,
          search_metadata: mergedMetadata,
          search_query: ticker,
          data_version: 2 // Ensure it's marked as new unified format
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Error updating unified search data:', updateError);
      }
    } else {
      // Create new record with Reddit search data
      const { error: insertError } = await supabase
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

      if (insertError) {
        console.error('Error inserting unified search data:', insertError);
      }
    }

    // Return response in a format compatible with existing frontend
    const formattedResults = Object.entries(unifiedSearchData.subreddits).map(([subreddit, data]: [string, any]) => ({
      subreddit,
      count: data.count,
      posts: data.posts,
      error: data.error
    }));

    return {
      success: true,
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
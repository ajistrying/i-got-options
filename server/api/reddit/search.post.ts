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

  // Initialize Supabase client
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey
  );

  try {
    const searchResults = [];
    const subredditsToSearch = subreddits && subreddits.length > 0 ? subreddits : ['wallstreetbets', 'options', 'stocks'];
    
    // Search each subreddit using Reddit's public JSON API
    for (const subreddit of subredditsToSearch) {
      try {
        const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json`;
        const searchResponse = await $fetch(searchUrl, {
          headers: {
            'User-Agent': 'OptionsTracker/1.0'
          },
          query: {
            q: ticker,
            restrict_sr: 'true',
            sort: 'relevance',
            limit: 25,
            raw_json: 1
          }
        });

        if (searchResponse?.data?.children) {
          const posts = searchResponse.data.children.map((child: any) => ({
            id: child.data.id,
            title: child.data.title,
            author: child.data.author,
            subreddit: child.data.subreddit,
            score: child.data.score,
            num_comments: child.data.num_comments,
            created_utc: child.data.created_utc,
            selftext: child.data.selftext || '',
            url: child.data.url,
            permalink: `https://reddit.com${child.data.permalink}`
          }));

          // Store in database
          if (posts.length > 0) {
            const { error } = await supabase
              .from('ticker_searches')
              .insert({
                ticker: ticker.toUpperCase(),
                subreddit,
                search_data: posts,
                search_query: ticker
              });

            if (error) {
              console.error(`Error storing ${subreddit} data:`, error);
            }
          }

          searchResults.push({
            subreddit,
            count: posts.length,
            posts
          });
        }
      } catch (error) {
        console.error(`Error searching ${subreddit}:`, error);
        searchResults.push({
          subreddit,
          error: `Failed to search ${subreddit}`,
          count: 0,
          posts: []
        });
      }
    }

    return {
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString(),
      results: searchResults,
      total_posts: searchResults.reduce((sum, r) => sum + r.count, 0)
    };
  } catch (error) {
    console.error('Reddit API error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search Reddit'
    });
  }
});
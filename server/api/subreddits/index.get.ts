import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey
  );

  const { data, error } = await supabase
    .from('favorite_subreddits')
    .select('*')
    .eq('active', true)
    .order('subreddit_name');

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subreddits'
    });
  }

  return data;
});
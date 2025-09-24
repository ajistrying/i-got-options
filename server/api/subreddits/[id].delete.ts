import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subreddit ID is required'
    });
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey
  );

  const { error } = await supabase
    .from('favorite_subreddits')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting subreddit:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete subreddit'
    });
  }

  return { success: true };
});
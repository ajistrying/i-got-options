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

  // First get the current status
  const { data: currentData, error: fetchError } = await supabase
    .from('favorite_subreddits')
    .select('active')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching subreddit:', fetchError);
    throw createError({
      statusCode: 404,
      statusMessage: 'Subreddit not found'
    });
  }

  // Toggle the status
  const { data, error } = await supabase
    .from('favorite_subreddits')
    .update({
      active: !currentData.active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling subreddit status:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to toggle subreddit status'
    });
  }

  return data;
});
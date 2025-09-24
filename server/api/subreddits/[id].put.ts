import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const { name } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subreddit ID is required'
    });
  }

  if (!name || typeof name !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subreddit name is required'
    });
  }

  const cleanName = name.trim().toLowerCase().replace(/^r\//, '');
  
  if (!cleanName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid subreddit name'
    });
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey
  );

  const { data, error } = await supabase
    .from('favorite_subreddits')
    .update({
      subreddit_name: cleanName,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw createError({
        statusCode: 409,
        statusMessage: 'Subreddit name already exists'
      });
    }
    console.error('Error updating subreddit:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update subreddit'
    });
  }

  return data;
});
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const { name } = body;

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
    .insert({
      subreddit_name: cleanName,
      active: true
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw createError({
        statusCode: 409,
        statusMessage: 'Subreddit already exists'
      });
    }
    console.error('Error adding subreddit:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add subreddit'
    });
  }

  return data;
});
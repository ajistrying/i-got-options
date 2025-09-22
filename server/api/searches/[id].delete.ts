import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search ID is required'
    });
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey
  );

  const { error } = await supabase
    .from('ticker_searches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting search:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete search'
    });
  }

  return { success: true };
});
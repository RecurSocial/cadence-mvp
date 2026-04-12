import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types';

const supabase = createClient();

export async function getPostsForWeek(
  orgId: string,
  weekStart: string,
  weekEnd: string
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('org_id', orgId)
    .gte('scheduled_at', weekStart)
    .lte('scheduled_at', weekEnd)
    .order('scheduled_at');

  if (error) throw error;
  return data || [];
}

export async function createDraftPost(
  orgId: string,
  data: {
    caption: string;
    hashtags: string;
    scheduled_at: string;
    platforms: string[];
  }
): Promise<Post> {
  const { data: post, error } = await supabase
    .from('posts')
    .insert([
      {
        org_id: orgId,
        caption: data.caption,
        hashtags: data.hashtags,
        scheduled_at: data.scheduled_at,
        platforms: data.platforms,
        status: 'draft',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return post;
}

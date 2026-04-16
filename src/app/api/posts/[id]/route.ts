import { createServerClient } from '@/lib/supabase/server';
import { getRequestContext, forbidden } from '@/lib/auth/server';
import { canDeletePost, canEditPost } from '@/lib/auth/permissions';
import { NextResponse } from 'next/server';

// PUT /api/posts/[id] — update a post
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    // Permission check: staff can only edit own drafts/pending posts
    const ctx = await getRequestContext(request);
    if (ctx) {
      const { data: post } = await supabase.from('posts').select('created_by, status').eq('id', id).single();
      const isAuthor = post?.created_by === ctx.userId;
      if (!canEditPost(ctx.role, isAuthor, post?.status)) {
        return forbidden('You can only edit your own draft or pending posts');
      }
    }

    const { caption, hashtags, scheduled_at, platforms, post_type, status } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (caption !== undefined) updates.caption = caption;
    if (hashtags !== undefined) updates.hashtags = hashtags;
    if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at;
    if (platforms !== undefined) updates.platforms = platforms;
    if (post_type !== undefined) updates.post_type = post_type || null;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/posts/[id]] Supabase error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[PUT /api/posts/[id]] Caught exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/posts/[id] — delete a post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext(request);
    if (ctx && !canDeletePost(ctx.role)) {
      return forbidden('Only owners and admins can delete posts');
    }

    const supabase = createServerClient();
    const { id } = await params;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/posts/[id]] Supabase error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/posts/[id]] Caught exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

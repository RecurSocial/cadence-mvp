import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/posts/[id]/submit — submit a draft for review
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    // Update post status to pending_review
    const { data: post, error: updateError } = await supabase
      .from('posts')
      .update({ status: 'pending_review', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'draft')
      .select()
      .single();

    if (updateError || !post) {
      console.error('[POST /api/posts/[id]/submit] Update error:', updateError);
      return NextResponse.json(
        { error: updateError?.message || 'Post not found or not in draft status' },
        { status: 400 }
      );
    }

    // Record the submission in post_reviews
    const { error: reviewError } = await supabase
      .from('post_reviews')
      .insert([{
        post_id: id,
        reviewer_id: null,
        action: 'submitted',
        notes: null,
      }]);

    if (reviewError) {
      console.error('[POST /api/posts/[id]/submit] Review insert error:', reviewError);
    }

    // Send email notification (fire-and-forget)
    try {
      const origin = new URL(request.url).origin;
      await fetch(`${origin}/api/notifications/post-submitted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: id, org_id: post.org_id }),
      });
    } catch (emailErr) {
      console.error('[POST /api/posts/[id]/submit] Email notification error:', emailErr);
    }

    return NextResponse.json(post);
  } catch (err) {
    console.error('[POST /api/posts/[id]/submit] Caught exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

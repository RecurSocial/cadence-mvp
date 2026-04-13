import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/posts/[id]/reviews — get review history for a post
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('post_reviews')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/posts/[id]/reviews] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[GET /api/posts/[id]/reviews] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/posts/[id]/reviews — insert a review record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const { action, notes } = await request.json();

    const { error } = await supabase
      .from('post_reviews')
      .insert([{ post_id: id, reviewer_id: null, action, notes: notes || null }]);

    if (error) {
      console.error('[POST /api/posts/[id]/reviews] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/posts/[id]/reviews] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { createServerClient } from '@/lib/supabase/server';
import { getRequestContext } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

// GET /api/posts?org_id=...&week_start=...&week_end=...
export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const weekStart = searchParams.get('week_start');
    const weekEnd = searchParams.get('week_end');

    if (!orgId || !weekStart || !weekEnd) {
      return NextResponse.json(
        { error: 'org_id, week_start, and week_end are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('org_id', orgId)
      .gte('scheduled_at', weekStart)
      .lte('scheduled_at', weekEnd)
      .order('scheduled_at');

    if (error) {
      console.error('[GET /api/posts] Supabase error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message, code: error.code, details: error.details, hint: error.hint }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/posts] Caught exception:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    );
  }
}

// POST /api/posts — create a draft post
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const { org_id, caption, hashtags, scheduled_at, platforms, post_type } = body;

    if (!org_id || !scheduled_at) {
      return NextResponse.json(
        { error: 'Missing required fields: org_id, scheduled_at' },
        { status: 400 }
      );
    }

    const ctx = await getRequestContext(request);

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          org_id,
          caption: caption || '',
          hashtags: hashtags || '',
          scheduled_at,
          platforms: platforms || [],
          post_type: post_type || null,
          status: 'draft',
          created_by: ctx?.userId || null,
        },
      ])
      .select();

    if (error) {
      console.error('[POST /api/posts] Supabase error:', JSON.stringify(error, null, 2));
      console.error('[POST /api/posts] Error details — code:', error.code, 'message:', error.message, 'details:', error.details, 'hint:', error.hint);
      return NextResponse.json({ error: error.message, code: error.code, details: error.details, hint: error.hint }, { status: 500 });
    }

    console.log('[POST /api/posts] Success — created post:', data[0]?.id);
    return NextResponse.json(data[0], { status: 201 });
  } catch (err) {
    console.error('[POST /api/posts] Caught exception:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    );
  }
}

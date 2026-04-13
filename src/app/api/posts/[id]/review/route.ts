import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'YOUR_RESEND_API_KEY_HERE'
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function sendStaffNotification(post: Record<string, unknown>, action: 'approved' | 'rejected', notes?: string) {
  const staffEmail = process.env.NOTIFY_STAFF_EMAIL;
  if (!staffEmail || staffEmail === 'YOUR_STAFF_EMAIL_HERE' || !resend) {
    console.log(`[Notification] Would notify staff (${action}):`, staffEmail || 'not configured');
    return;
  }

  const scheduledDate = post.scheduled_at
    ? new Date(post.scheduled_at as string).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Not scheduled';

  const captionPreview = post.caption
    ? (post.caption as string).substring(0, 100) + ((post.caption as string).length > 100 ? '...' : '')
    : 'No caption';

  if (action === 'approved') {
    await resend.emails.send({
      from: 'Cadence <noreply@notifications.cadencesocial.io>',
      to: staffEmail,
      subject: 'Your post was approved — Cadence',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0F172A;">Post Approved</h2>
          <p style="color: #64748B;">Your post has been approved and is scheduled.</p>
          <div style="background: #F8F9FB; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Post Type</p>
            <p style="margin: 0 0 16px; color: #0F172A; font-weight: 500;">${post.post_type || 'Not set'}</p>
            <p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Scheduled</p>
            <p style="margin: 0 0 16px; color: #0F172A;">${scheduledDate}</p>
            <p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Caption</p>
            <p style="margin: 0; color: #0F172A;">${captionPreview}</p>
          </div>
        </div>
      `,
    });
  } else {
    await resend.emails.send({
      from: 'Cadence <noreply@notifications.cadencesocial.io>',
      to: staffEmail,
      subject: 'Your post needs revision — Cadence',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0F172A;">Post Needs Revision</h2>
          <p style="color: #64748B;">Please revise and resubmit.</p>
          <div style="background: #F8F9FB; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Post Type</p>
            <p style="margin: 0 0 16px; color: #0F172A; font-weight: 500;">${post.post_type || 'Not set'}</p>
            <p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Scheduled</p>
            <p style="margin: 0 0 16px; color: #0F172A;">${scheduledDate}</p>
            <p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Caption</p>
            <p style="margin: 0 0 16px; color: #0F172A;">${captionPreview}</p>
            <p style="margin: 0 0 8px; color: #EF4444; font-size: 12px; text-transform: uppercase;">Rejection Reason</p>
            <p style="margin: 0; color: #0F172A;">${notes || ''}</p>
          </div>
        </div>
      `,
    });
  }
}

// POST /api/posts/[id]/review — approve or reject a post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    const { action, notes, reviewer_id } = body;

    if (!action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    if (action === 'rejected' && !notes) {
      return NextResponse.json(
        { error: 'Rejection notes are required' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approved' ? 'scheduled' : 'rejected';

    // Update post status
    const { data: post, error: updateError } = await supabase
      .from('posts')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pending_review')
      .select()
      .single();

    if (updateError || !post) {
      console.error('[POST /api/posts/[id]/review] Update error:', updateError);
      return NextResponse.json(
        { error: updateError?.message || 'Post not found or not pending review' },
        { status: 400 }
      );
    }

    // Record the review
    const { error: reviewError } = await supabase
      .from('post_reviews')
      .insert([{
        post_id: id,
        reviewer_id: reviewer_id || null,
        action,
        notes: notes || null,
      }]);

    if (reviewError) {
      console.error('[POST /api/posts/[id]/review] Review insert error:', reviewError);
    }

    // Send staff notification (fire-and-forget)
    try {
      await sendStaffNotification(post, action, notes);
    } catch (emailErr) {
      console.error('[POST /api/posts/[id]/review] Email notification error:', emailErr);
    }

    return NextResponse.json(post);
  } catch (err) {
    console.error('[POST /api/posts/[id]/review] Caught exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

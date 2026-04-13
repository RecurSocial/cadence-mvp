import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'YOUR_RESEND_API_KEY_HERE'
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// POST /api/notifications/post-submitted
export async function POST(request: Request) {
  try {
    const { post_id, org_id } = await request.json();

    if (!post_id || !org_id) {
      return NextResponse.json({ error: 'post_id and org_id are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: post } = await supabase
      .from('posts')
      .select('*')
      .eq('id', post_id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const ownerEmail = process.env.NOTIFY_OWNER_EMAIL;
    if (!ownerEmail || ownerEmail === 'YOUR_OWNER_EMAIL_HERE') {
      console.log('[Notification] NOTIFY_OWNER_EMAIL not configured');
      return NextResponse.json({ sent: false, reason: 'Owner email not configured' });
    }

    const scheduledDate = post.scheduled_at
      ? new Date(post.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : 'Not scheduled';

    const captionPreview = post.caption
      ? post.caption.substring(0, 100) + (post.caption.length > 100 ? '...' : '')
      : 'No caption';

    if (!resend) {
      console.log('[Notification] Resend not configured. Would have sent to:', ownerEmail);
      console.log('[Notification] Post details:', { post_type: post.post_type, scheduledDate, captionPreview });
      return NextResponse.json({ sent: false, reason: 'Resend not configured' });
    }

    const { error } = await resend.emails.send({
      from: 'Cadence <noreply@notifications.cadencesocial.io>',
      to: ownerEmail,
      subject: 'New post pending review — Cadence',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0F172A;">New Post Pending Review</h2>
          <p style="color: #64748B;">A post has been submitted for your review.</p>
          <div style="background: #F8F9FB; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Post Type</p>
            <p style="margin: 0 0 16px; color: #0F172A; font-weight: 500;">${post.post_type || 'Not set'}</p>
            <p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Scheduled</p>
            <p style="margin: 0 0 16px; color: #0F172A;">${scheduledDate}</p>
            <p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Caption</p>
            <p style="margin: 0; color: #0F172A;">${captionPreview}</p>
          </div>
          <a href="${new URL('/approvals', request.url).origin}/approvals"
             style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            Review Post
          </a>
        </div>
      `,
    });

    if (error) {
      console.error('[Notification] Resend error:', error);
      return NextResponse.json({ sent: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[Notification] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

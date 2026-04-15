import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'YOUR_RESEND_API_KEY_HERE'
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const UPLOAD_POST_API_KEY = process.env.UPLOAD_POST_API_KEY;
const UPLOAD_POST_BASE_URL = 'https://api.upload-post.com';

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

// Map Cadence platform names to Upload-Post platform strings
function mapPlatforms(platforms: string[]): string[] {
  const mapping: Record<string, string> = {
    'Instagram': 'instagram',
    'Facebook': 'facebook',
    'TikTok': 'tiktok',
    'GBP': 'google_business',
  };
  return platforms
    .map(p => mapping[p] || p.toLowerCase())
    .filter(p => ['instagram', 'facebook', 'tiktok', 'google_business'].includes(p));
}

// Call Upload-Post API to schedule the post
async function scheduleWithUploadPost(post: Record<string, unknown>): Promise<{ job_id: string | null; error: string | null }> {
  if (!UPLOAD_POST_API_KEY) {
    console.warn('[review] UPLOAD_POST_API_KEY not set — skipping Upload-Post call');
    return { job_id: null, error: 'API key not configured' };
  }

  const platforms = mapPlatforms((post.platforms as string[]) || []);
  if (platforms.length === 0) {
    console.warn('[review] No valid platforms mapped for post:', post.id);
    return { job_id: null, error: 'No valid platforms' };
  }

  const profileUsername = post.org_id as string;
  const caption = [post.caption, post.hashtags].filter(Boolean).join('\n\n') || '';
  const scheduledAt = post.scheduled_at as string;

  const hasImage = !!(post.image_url as string);
  const textSupportedPlatforms = ['facebook', 'tiktok', 'google_business', 'x', 'threads', 'bluesky'];
  const uploadPlatforms = hasImage ? platforms : platforms.filter(p => textSupportedPlatforms.includes(p));

  if (uploadPlatforms.length === 0) {
    console.warn('[review] No platforms support text-only posts for this post — skipping Upload-Post');
    return { job_id: null, error: 'No platforms support text-only for this post' };
  }

  const endpoint = hasImage
    ? UPLOAD_POST_BASE_URL + '/api/upload_photos'
    : UPLOAD_POST_BASE_URL + '/api/upload_text';

  const formData = new FormData();
  formData.append('user', profileUsername);
  formData.append('title', caption);
  formData.append('scheduled_date', new Date(scheduledAt).toISOString());
  formData.append('timezone', 'America/New_York');
  formData.append('async_upload', 'false');
  uploadPlatforms.forEach(p => formData.append('platform[]', p));

  console.log('[review] Calling Upload-Post:', endpoint, '| platforms:', uploadPlatforms, '| scheduled:', scheduledAt);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': 'Apikey ' + UPLOAD_POST_API_KEY },
      body: formData,
    });
    const data = await res.json();
    console.log('[review] Upload-Post response:', JSON.stringify(data));
    if (res.status === 202 && data.job_id) return { job_id: data.job_id, error: null };
    if (data.request_id) return { job_id: data.request_id, error: null };
    if (data.success) return { job_id: null, error: null };
    return { job_id: null, error: data.message || 'Unknown Upload-Post error' };
  } catch (err) {
    console.error('[review] Upload-Post fetch error:', err);
    return { job_id: null, error: String(err) };
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

    // If approved — schedule with Upload-Post
    if (action === 'approved') {
      const { job_id, error: uploadError } = await scheduleWithUploadPost(post);

      if (uploadError) {
        console.warn('[review] Upload-Post scheduling failed:', uploadError, '| post still marked scheduled in Cadence');
      }

      if (job_id) {
        const { error: jobUpdateError } = await supabase
          .from('posts')
          .update({
            upload_post_id: job_id,
            upload_post_status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (jobUpdateError) {
          console.error('[review] Failed to store upload_post_id:', jobUpdateError);
        } else {
          console.log('[review] Stored upload_post_id:', job_id, '| post:', id);
        }
      }
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

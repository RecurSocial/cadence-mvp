import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'YOUR_RESEND_API_KEY_HERE'
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// POST /api/webhooks/upload-post
// Receives real-time events from Upload-Post when posts publish or accounts disconnect
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, job_id, platform, result, profile_username, account_name, reason } = body;

    console.log('[webhook/upload-post] Event received:', event, '| job_id:', job_id, '| platform:', platform);

    const supabase = createServerClient();

    // --- Event: upload_completed ---
    if (event === 'upload_completed' && job_id) {
      const newStatus = result?.success ? 'completed' : 'failed';

      const { data: post, error } = await supabase
        .from('posts')
        .update({
          upload_post_status: newStatus,
          ...(result?.success ? { status: 'published' } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('upload_post_id', job_id)
        .select()
        .single();

      if (error) {
        console.error('[webhook/upload-post] Failed to update post:', error);
        return NextResponse.json({ received: true, warning: 'Post not found for job_id' });
      }

      console.log('[webhook/upload-post] Post updated to', newStatus, '| post_id:', post?.id);

      if (!result?.success && post) {
        await notifyOwnerOfFailure(post, platform, result?.error);
      }

      return NextResponse.json({ received: true, status: newStatus });
    }

    // --- Event: social_account_reauth_required ---
    if (event === 'social_account_reauth_required') {
      console.log('[webhook/upload-post] Reauth required for:', platform, '| profile:', profile_username);

      const ownerEmail = process.env.NOTIFY_OWNER_EMAIL;
      if (ownerEmail && resend) {
        await resend.emails.send({
          from: 'Cadence <noreply@notifications.cadencesocial.io>',
          to: ownerEmail,
          subject: 'Action required: Reconnect your ' + capitalize(platform) + ' account — Cadence',
          html: '<div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">' +
            '<h2 style="color: #0F172A;">Your ' + capitalize(platform) + ' Account Needs Reconnecting</h2>' +
            '<p style="color: #64748B;">Your ' + capitalize(platform) + ' connection has expired and posts can no longer be published to that platform.</p>' +
            '<div style="background: #FEF3C7; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #F59E0B;">' +
            '<p style="margin: 0; color: #92400E; font-weight: 500;">Action Required</p>' +
            '<p style="margin: 8px 0 0; color: #78350F;">Please reconnect your ' + capitalize(platform) + ' account in Cadence Settings to resume publishing.</p>' +
            '</div>' +
            '<a href="' + (process.env.NEXT_PUBLIC_APP_URL || 'https://cadence-mvp.vercel.app') + '/settings/platforms" ' +
            'style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 8px;">' +
            'Reconnect Account</a></div>',
        });
        console.log('[webhook/upload-post] Reauth email sent for platform:', platform);
      }

      return NextResponse.json({ received: true });
    }

    // --- Event: social_account_connected ---
    if (event === 'social_account_connected') {
      console.log('[webhook/upload-post] Account connected:', platform, account_name, '| profile:', profile_username);
      return NextResponse.json({ received: true });
    }

    // --- Event: social_account_disconnected ---
    if (event === 'social_account_disconnected') {
      console.log('[webhook/upload-post] Account disconnected:', platform, '| reason:', reason, '| profile:', profile_username);
      return NextResponse.json({ received: true });
    }

    console.log('[webhook/upload-post] Unknown event type:', event);
    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('[webhook/upload-post] Exception:', err);
    return NextResponse.json({ received: true, error: String(err) });
  }
}

async function notifyOwnerOfFailure(
  post: Record<string, unknown>,
  platform: string,
  errorMessage?: string
) {
  const ownerEmail = process.env.NOTIFY_OWNER_EMAIL;
  if (!ownerEmail || !resend) return;

  try {
    await resend.emails.send({
      from: 'Cadence <noreply@notifications.cadencesocial.io>',
      to: ownerEmail,
      subject: 'Post failed to publish on ' + capitalize(platform) + ' — Cadence',
      html: '<div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">' +
        '<h2 style="color: #0F172A;">Post Failed to Publish</h2>' +
        '<p style="color: #64748B;">A scheduled post could not be published to ' + capitalize(platform) + '.</p>' +
        '<div style="background: #FEF2F2; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #EF4444;">' +
        '<p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Post Type</p>' +
        '<p style="margin: 0 0 16px; color: #0F172A; font-weight: 500;">' + (post.post_type || 'Not set') + '</p>' +
        '<p style="margin: 0 0 8px; color: #64748B; font-size: 12px; text-transform: uppercase;">Platform</p>' +
        '<p style="margin: 0 0 16px; color: #0F172A;">' + capitalize(platform) + '</p>' +
        (errorMessage ? '<p style="margin: 0 0 8px; color: #EF4444; font-size: 12px; text-transform: uppercase;">Error</p><p style="margin: 0; color: #0F172A;">' + errorMessage + '</p>' : '') +
        '</div>' +
        '<p style="color: #64748B; font-size: 14px;">You may need to reconnect your ' + capitalize(platform) + ' account or reschedule this post.</p>' +
        '</div>',
    });
  } catch (emailErr) {
    console.error('[webhook/upload-post] Failed to send failure email:', emailErr);
  }
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// NOTE: CRON_SECRET must be added to Vercel environment variables before deploying.
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const ORG_ID = '74b04f56-8cf0-7427-b977-7574b183226d';

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'YOUR_RESEND_API_KEY_HERE'
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();

    // Get tomorrow's date range in UTC
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(now.getUTCDate() + 1);
    const tomorrowStart = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 0, 0, 0));
    const tomorrowEnd = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 23, 59, 59, 999));

    // Query posts scheduled for tomorrow (excluding rejected)
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id')
      .eq('org_id', ORG_ID)
      .gte('scheduled_at', tomorrowStart.toISOString())
      .lte('scheduled_at', tomorrowEnd.toISOString())
      .not('status', 'in', '("rejected")');

    if (error) {
      console.error('[gap-alert] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (posts && posts.length > 0) {
      return NextResponse.json({ message: 'No gap found', posts_count: posts.length });
    }

    // Gap found — send alert
    const dayLabel = tomorrowStart.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });

    const ownerEmail = process.env.NOTIFY_OWNER_EMAIL;
    if (!ownerEmail || ownerEmail === 'YOUR_OWNER_EMAIL_HERE') {
      console.log('[gap-alert] NOTIFY_OWNER_EMAIL not configured');
      return NextResponse.json({ message: 'Gap found but no owner email configured', day: dayLabel });
    }

    if (!resend) {
      console.log('[gap-alert] Resend not configured. Gap found for:', dayLabel);
      return NextResponse.json({ message: 'Gap found but Resend not configured', day: dayLabel });
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Cadence <noreply@notifications.cadencesocial.io>',
      to: ownerEmail,
      subject: 'Gap alert — no posts scheduled for tomorrow',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0F172A;">Content Gap Alert</h2>
          <p style="color: #64748B;">You have no posts scheduled for tomorrow.</p>
          <div style="background: #FFF7ED; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 4px; color: #92400E; font-size: 12px; text-transform: uppercase; font-weight: 600;">Missing Day</p>
            <p style="margin: 0; color: #0F172A; font-weight: 500; font-size: 16px;">${dayLabel}</p>
          </div>
          <p style="color: #64748B; font-size: 14px;">Log in to Cadence to schedule a post before the day arrives.</p>
          <a href="https://cadence.app/calendar"
             style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 8px;">
            Schedule a Post
          </a>
        </div>
      `,
    });

    if (emailError) {
      console.error('[gap-alert] Resend error:', emailError);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Gap alert sent', day: dayLabel });
  } catch (err) {
    console.error('[gap-alert] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

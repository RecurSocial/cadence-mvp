// NOTE: CRON_SECRET must be added to Vercel environment variables before deploying.
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const ORG_ID = '74b04f56-8cf0-7427-b977-7574b183226d';

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'YOUR_RESEND_API_KEY_HERE'
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();

    // Get current week Monday-Saturday in UTC
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset, 0, 0, 0));
    const saturday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 5, 23, 59, 59, 999));

    // Query all posts for the week (excluding rejected)
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, scheduled_at')
      .eq('org_id', ORG_ID)
      .gte('scheduled_at', monday.toISOString())
      .lte('scheduled_at', saturday.toISOString())
      .not('status', 'in', '("rejected")');

    if (error) {
      console.error('[weekly-digest] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count posts per day (Mon=0 through Sat=5)
    const dayCounts = new Array(6).fill(0);
    for (const post of posts || []) {
      if (!post.scheduled_at) continue;
      const d = new Date(post.scheduled_at);
      const dow = d.getUTCDay(); // 0=Sun
      const idx = dow === 0 ? -1 : dow - 1; // Mon=0, Tue=1, ... Sat=5
      if (idx >= 0 && idx < 6) dayCounts[idx]++;
    }

    // Check for gaps (days with 0 posts)
    const gaps = dayCounts.map((count, i) => ({ day: DAY_NAMES[i], count, hasGap: count === 0 }));
    const hasAnyGap = gaps.some((g) => g.hasGap);

    if (!hasAnyGap) {
      return NextResponse.json({ message: 'Week looks good', dayCounts });
    }

    // Build day list with dates
    const dayRows = gaps.map((g, i) => {
      const dayDate = new Date(monday);
      dayDate.setUTCDate(monday.getUTCDate() + i);
      const dateLabel = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      if (g.hasGap) {
        return `<tr><td style="padding: 8px 12px; color: #DC2626;">⚠️ ${g.day}, ${dateLabel}</td><td style="padding: 8px 12px; color: #DC2626; font-weight: 500;">no posts scheduled</td></tr>`;
      }
      return `<tr><td style="padding: 8px 12px; color: #0F172A;">✅ ${g.day}, ${dateLabel}</td><td style="padding: 8px 12px; color: #64748B;">${g.count} post${g.count !== 1 ? 's' : ''} scheduled</td></tr>`;
    }).join('');

    const ownerEmail = process.env.NOTIFY_OWNER_EMAIL;
    if (!ownerEmail || ownerEmail === 'YOUR_OWNER_EMAIL_HERE') {
      console.log('[weekly-digest] NOTIFY_OWNER_EMAIL not configured');
      return NextResponse.json({ message: 'Gaps found but no owner email configured', gaps });
    }

    if (!resend) {
      console.log('[weekly-digest] Resend not configured. Gaps found:', gaps.filter((g) => g.hasGap).map((g) => g.day));
      return NextResponse.json({ message: 'Gaps found but Resend not configured', gaps });
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Cadence <noreply@notifications.cadencesocial.io>',
      to: ownerEmail,
      subject: 'Weekly planning digest — gaps in your content schedule',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0F172A;">Weekly Planning Digest</h2>
          <p style="color: #64748B;">Here's your week at a glance:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #F8F9FB; border-radius: 8px; overflow: hidden;">
            ${dayRows}
          </table>
          <a href="https://cadence.app/calendar"
             style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 8px;">
            Plan Your Week
          </a>
        </div>
      `,
    });

    if (emailError) {
      console.error('[weekly-digest] Resend error:', emailError);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Weekly digest sent', gaps });
  } catch (err) {
    console.error('[weekly-digest] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

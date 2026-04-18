import { createServerClient } from '@/lib/supabase/server';
import { getRequestContext } from '@/lib/auth/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext(request);
    const body = await request.json();
    const { org_id, event_name, event_date, event_time, service_ids, tone } = body;

    const orgId = ctx?.orgId || org_id;

    if (!orgId || !event_name || !event_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch featured services
    let servicesContext = '';
    if (service_ids?.length) {
      const { data: svcs } = await supabase
        .from('services')
        .select('name, price, price_note')
        .in('id', service_ids);
      if (svcs?.length) {
        servicesContext = svcs
          .map((s: any) => `${s.name} ($${s.price}${s.price_note ? ` ${s.price_note}` : ''})`)
          .join(', ');
      }
    }

    // Days until event
    const eventDateObj = new Date(event_date);
    const today = new Date();
    const daysUntil = Math.ceil((eventDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const toneMap: Record<string, string> = {
      warm: 'warm and approachable',
      professional: 'professional and clinical',
      bold: 'bold and direct',
      playful: 'fun and playful',
    };

    const prompt = `You are a social media content expert for Euphoria Esthetics & Wellness, a med spa in Barnegat, NJ.

Create a complete event campaign scaffold:
- Event: ${event_name}
- Date: ${event_date}${event_time ? ` at ${event_time}` : ''}
- Featured Services: ${servicesContext || 'TBD'}
- Days Until Event: ${daysUntil}
- Tone: ${toneMap[tone || 'warm']}

Only include slots that are still in the future given ${daysUntil} days remaining. Skip any that have passed.

Slots to consider:
- T-14: Announcement
- T-7: Build anticipation
- T-3: Limited availability urgency
- T-1 morning (8AM): Tomorrow reminder
- T-1 midday (12PM): Tomorrow story
- Day-of morning (8AM): Doors open today
- Day-of midday (10AM): FOMO — still time to come
- Post-event: Thank you + recap

Respond with valid JSON only — no markdown:
{
  "campaign_posts": [
    {
      "slot_label": "T-14 days",
      "days_before": 14,
      "suggested_date": "YYYY-MM-DD",
      "suggested_time": "10:00",
      "platform": "instagram",
      "format": "post",
      "caption": "full caption text",
      "hashtags": ["hashtag1"],
      "media_guidance": "what image or video to use"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const campaign = JSON.parse(cleaned);

    return NextResponse.json({ campaign });
  } catch (err: any) {
    console.error('[POST /api/generate-event-campaign] Error:', err);
    return NextResponse.json({ error: 'Campaign generation failed', detail: err.message }, { status: 500 });
  }
}
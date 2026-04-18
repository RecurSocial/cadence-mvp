import { createServerClient } from '@/lib/supabase/server';
import { getRequestContext } from '@/lib/auth/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext(request);
    const body = await request.json();

    const {
      org_id,
      post_type,
      platforms,
      format,
      tone,
      service_id,
      practitioner_id,
      event_name,
      event_date,
      event_time,
      offer_details,
      expiration_date,
      target_concern,
      occasion,
      trend_description,
      trend_url,
      key_benefit,
      consent_confirmed,
    } = body;

    const orgId = ctx?.orgId || org_id;

    if (!orgId || !post_type || !platforms || !format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch service context if provided
    let serviceContext = '';
    if (service_id) {
      const { data: svc } = await supabase
        .from('services')
        .select('name, category, price, price_note, duration_minutes')
        .eq('id', service_id)
        .single();
      if (svc) {
        serviceContext = `Service: ${svc.name} (${svc.category}). Price: $${svc.price}${svc.price_note ? ` (${svc.price_note})` : ''}. Duration: ${svc.duration_minutes} minutes.`;
      }
    }

    // Fetch practitioner context if provided
    let practitionerContext = '';
    if (practitioner_id) {
      const { data: prac } = await supabase
        .from('practitioners')
        .select('first_name, last_name, specialty')
        .eq('id', practitioner_id)
        .single();

      if (prac) {
        const { data: certs } = await supabase
          .from('practitioner_certifications')
          .select('services(name)')
          .eq('practitioner_id', practitioner_id)
          .limit(8);

        const certList = (certs || [])
          .map((c: any) => (c.services as any)?.name)
          .filter(Boolean)
          .join(', ');

        practitionerContext = `Practitioner: ${prac.first_name} ${prac.last_name}, ${prac.specialty}.${certList ? ` Certified in: ${certList}.` : ''}`;
      }
    }

    // Platform formatting rules
    const platformRules: Record<string, string> = {
      instagram_post: 'Instagram Feed Post: caption up to 2,200 characters, lead with a hook in the first line, include 5-8 hashtags at the end, end with a clear CTA.',
      instagram_reel: 'Instagram Reel: include a word-for-word teleprompter script (10-30 seconds spoken aloud), plus a short caption (150 chars max) with 3-5 hashtags.',
      instagram_story: 'Instagram Story: ultra-short text overlay copy (under 50 characters). Stories are visual-first — text is minimal.',
      instagram_carousel: 'Instagram Carousel: write slide-by-slide copy. Slide 1 = hook. Slides 2-6 = one point each, short and punchy. Last slide = CTA. Include a carousel caption.',
      facebook_post: 'Facebook Post: conversational tone, up to 400 words, no hashtags needed, strong CTA.',
      facebook_reel: 'Facebook Reel: teleprompter script + short caption, same as Instagram Reel format.',
      tiktok_post: 'TikTok Video: hook in first 2 seconds is critical. Fast-paced teleprompter script. Include 3-5 hashtags.',
    };

    const selectedPlatformRules = (platforms as string[])
      .map((p: string) => platformRules[`${p}_${format}`] || `${p} ${format}: optimize for that platform.`)
      .join('\n');

    const toneMap: Record<string, string> = {
      warm: 'warm, approachable, and friendly — like advice from a trusted friend who is also a medical professional',
      professional: 'professional and clinical — authoritative, credibility-forward, precise',
      bold: 'bold and direct — confident, punchy, no fluff',
      playful: 'fun and playful — light-hearted, relatable, casual',
    };

    const postTypeInstructions: Record<string, string> = {
      educational: `Educational post. Topic/concern: "${target_concern || 'general aesthetics'}". ${serviceContext} Goal: establish expertise and answer a common question. Do NOT make it sound like an ad.`,
      promotional: `Promotional post. ${serviceContext} Offer: "${offer_details || 'special pricing available'}".${expiration_date ? ` Expires: ${expiration_date}.` : ''} Create urgency without being pushy. Include a CTA to book.`,
      before_after: `Before & After post. ${serviceContext} ${practitionerContext} ${consent_confirmed ? 'Client consent confirmed.' : ''} Focus on the transformation. Never make medical guarantees — say "results may vary."`,
      practitioner_spotlight: `Practitioner Spotlight. ${practitionerContext} Humanize this person — their expertise, passion, and what makes them great. Feel like an introduction, not a resume.`,
      service_feature: `Service Feature. ${serviceContext} Key benefit: "${key_benefit || 'outstanding results'}". Lead with the benefit, not the service name.`,
      seasonal: `Seasonal post. Occasion: "${occasion || 'upcoming season'}". ${serviceContext ? `Tie-in: ${serviceContext}` : ''} Connect the season to why now is a great time to treat yourself.`,
      event: `Event post. Event: "${event_name}". Date: ${event_date}${event_time ? ` at ${event_time}` : ''}. ${serviceContext} Create excitement and urgency. Appointments required.`,
      trend_viral: `Trend/Viral content. The concept: "${trend_description || trend_url || 'relatable med spa content'}". Personality-forward content meant to reach NEW audiences. Short, punchy, highly relatable. Do NOT sound like a service ad.`,
    };

    const prompt = `You are a social media content expert for Euphoria Esthetics & Wellness, a med spa in Barnegat, NJ. Voted Best Medical Spa in Ocean County 2025. Brand is warm, professional, and results-driven.

POST TYPE:
${postTypeInstructions[post_type] || 'Create an engaging social media post for a medical spa.'}

TONE: ${toneMap[tone as string] || toneMap.warm}

PLATFORM REQUIREMENTS:
${selectedPlatformRules}

Respond with valid JSON only — no markdown, no preamble:
{
  "caption": "the main post caption",
  "hashtags": ["hashtag1", "hashtag2"],
  "script": "teleprompter script for reels/stories, otherwise null",
  "media_guidance": "1-2 sentences describing the ideal visual for this post",
  "urgency_note": "for trend/viral only — timing note; otherwise null",
  "slide_copy": [{"slide": 1, "text": "..."}] for carousel only, otherwise null
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const generated = JSON.parse(cleaned);

    return NextResponse.json({ generated });
  } catch (err: any) {
    console.error('[POST /api/generate-post] Error:', err);
    return NextResponse.json({ error: 'Generation failed', detail: err.message }, { status: 500 });
  }
}
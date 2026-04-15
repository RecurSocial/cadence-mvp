import { NextResponse } from 'next/server';

const UPLOAD_POST_API_KEY = process.env.UPLOAD_POST_API_KEY;
const UPLOAD_POST_BASE_URL = 'https://api.upload-post.com';

// POST /api/upload-post/connect
// Creates an Upload-Post user profile for the org (if needed) and returns a JWT connect URL
export async function POST(request: Request) {
  try {
    if (!UPLOAD_POST_API_KEY) {
      return NextResponse.json({ error: 'Upload-Post API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { org_id } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    // Use org_id as the Upload-Post profile username
    const profileUsername = org_id;

    // Step 1: Ensure the Upload-Post profile exists (create if not)
    const profileRes = await fetch(`${UPLOAD_POST_BASE_URL}/api/uploadposts/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Apikey ${UPLOAD_POST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: profileUsername }),
    });

    const profileData = await profileRes.json();

    // 409 = already exists, that's fine
    if (!profileRes.ok && profileRes.status !== 409) {
      console.error('[upload-post/connect] Failed to create profile:', profileData);
      return NextResponse.json(
        { error: 'Failed to create Upload-Post profile', detail: profileData },
        { status: 500 }
      );
    }

    console.log('[upload-post/connect] Profile ready for:', profileUsername);

    // Step 2: Generate JWT connect URL
    const jwtRes = await fetch(`${UPLOAD_POST_BASE_URL}/api/uploadposts/users/generate-jwt`, {
      method: 'POST',
      headers: {
        'Authorization': `Apikey ${UPLOAD_POST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: profileUsername,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://cadence-mvp.vercel.app'}/settings/platforms?connected=true`,
        connect_title: 'Connect Your Social Accounts',
        connect_description: 'Link your Instagram and Facebook accounts to start publishing through Cadence.',
        platforms: ['instagram', 'facebook', 'tiktok', 'google_business'],
        show_calendar: false,
      }),
    });

    const jwtData = await jwtRes.json();

    if (!jwtRes.ok || !jwtData.access_url) {
      console.error('[upload-post/connect] Failed to generate JWT:', jwtData);
      return NextResponse.json(
        { error: 'Failed to generate connection URL', detail: jwtData },
        { status: 500 }
      );
    }

    console.log('[upload-post/connect] JWT generated for:', profileUsername);

    return NextResponse.json({
      access_url: jwtData.access_url,
      duration: jwtData.duration,
      profile_username: profileUsername,
    });

  } catch (err) {
    console.error('[upload-post/connect] Exception:', err);
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 });
  }
}

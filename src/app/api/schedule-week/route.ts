import { createServerClient } from '@/lib/supabase/server';
import { getRequestContext } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

/**
 * Schedule My Week endpoint
 *
 * Generates 5 reasoned post recommendations for the upcoming week
 * based on Cadence's locked weekly content strategy:
 *
 * Mon 11:00 AM - Educational           (Carousel)
 * Tue 2:00 PM  - BeforeAfter           (Reel)
 * Wed 11:00 AM - Educational           (Reel) — service-focused angle
 * Thu 12:30 PM - Spotlight OR PromoEventSeasonal (alternates biweekly)
 * Fri 10:00 AM - TrendViral            (Reel)
 *
 * Post types align with the new 6-button PostWizard structure:
 *   Educational, BeforeAfter, Spotlight, PromoEventSeasonal, BookNow, TrendViral.
 *
 * Creates draft posts in the database with is_cadence_suggested = TRUE.
 * If suggestions already exist for the week, they are replaced.
 */

// Matches supabase enum post_type_enum (created in migratio20260429120000).
type PostType =
  | 'Educational'
  | 'BeforeAfter'
  | 'Spotlight'
  | 'PromoEventSeasonal'
  | 'BookNow'
  | 'TrendViral';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

// Optional sub-branch hint for the wizard. Used by the Monday Brief UI
// to pre-select the right sub-question when a user clicks a suggested slot.
type SubBranch =
  | 'Product'           // Educational sub-branch
  | 'Service'           // Educational sub-branch
  | 'Photo'             // BeforeAfter sub-branch
  | 'Video'             // BeforeAfter sub-branch
  | 'Practitioner'      // Spotlight sub-branch
  | 'Testimonial'       // Spotlight sub-branch
  | 'Promo'             // PromoEventSeasonal sub-branch
  | 'Event'             // PromoEventSeasonal sub-branch
  | 'Seasonal';         // PromoEventSeasonal sub-branch

interface PostRecommendation {
  day: DayOfWeek;
  scheduled_at: string; // ISO timestamp
  post_type: PostType;
  sub_branch: SubBranch | null;
  recommended_format: string;
  reasoning: string;
}

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext(request);
    const body = await request.json();

    const { org_id, week_start_date } = body;
    const orgId = ctx?.orgId || org_id;

    if (!orgId || !week_start_date) {
      return NextResponse.json(
        { error: 'Missing required fields: org_id, week_start_date' },
        { status: 400 }
      );
    }

    // Parse the week_start_date as a Monday
    const weekStart = new Date(week_start_date);
    if (isNaN(weekStart.getTime())) {
      return NextResponse.json(
        { error: 'Invalid week_start_date format. Use ISO date string.' },
        { status: 400 }
      );
    }

    // Determine Thursday's post type and sub-branch.
    // Even ISO weeks → Spotlight (Practitioner). Odd weeks → PromoEventSeasonal (Seasonal).
    const weekNumber = getISOWeekNumber(weekStart);
    const thursdayIsSpotlight = weekNumber % 2 === 0;
    const thursdayPostType: PostType = thursdayIsSpotlight ? 'Spotlight' : 'PromoEventSeasonal';
    const thursdaySubBranch: SubBranch = thursdayIsSpotlight ? 'Practitioner' : 'Seasonal';

    // Build the 5 recommendations
    const recommendations: PostRecommendation[] = [
      {
        day: 'monday',
        scheduled_at: setTime(weekStart, 0, 11, 0), // Monday 11:00 AM
        post_type: 'Educational',
        sub_branch: null,
        recommended_format: 'Carousel',
        reasoning:
          'Educational Monday establishes authority and builds trust before mid-week conversion content.',
      },
      {
        day: 'tuesday',
        scheduled_at: setTime(weekStart, 1, 14, 0), // Tuesday 2:00 PM
        post_type: 'BeforeAfter',
        sub_branch: 'Video',
        recommended_format: 'Reel',
        reasoning:
          'Tuesday afternoon captures peak engagement when audiences scroll between meetings. Reels showing the reveal moment outperform static before/after photos.',
      },
      {
        day: 'wednesday',
        scheduled_at: setTime(weekStart, 2, 11, 0), // Wednesday 11:00 AM
        post_type: 'Educational',
        sub_branch: 'Service',
        recommended_format: 'Reel',
        reasoning:
          'Mid-week service-focused educational post drives Thursday and Friday booking activity. Service deep-dive frames the procedure, recovery, and results.',
      },
      {
        day: 'thursday',
        scheduled_at: setTime(weekStart, 3, 12, 30), // Thursday 12:30 PM
        post_type: thursdayPostType,
        sub_branch: thursdaySubBranch,
        recommended_format: thursdayIsSpotlight ? 'Reel' : 'Carousel',
        reasoning: thursdayIsSpotlight
          ? 'Thursday spotlight builds personal connection with the practitioners patients trust. Alternates biweekly with seasonal content.'
          : 'Thursday seasonal post ties Euphoria to current cultural moments. Alternates biweekly with practitioner spotlights.',
      },
      {
        day: 'friday',
        scheduled_at: setTime(weekStart, 4, 10, 0), // Friday 10:00 AM
        post_type: 'TrendViral',
        sub_branch: null,
        recommended_format: 'Reel',
        reasoning:
          "Friday morning trend post reaches new audiences outside Euphoria's following. Trends only work as Reels.",
      },
    ];

    // Connect to Supabase
    const supabase = await createServerClient();

    // Step 1: Delete any existing Cadence-suggested posts for this week.
    // Makes Schedule My Week idempotent — re-running it replaces old suggestions.
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('org_id', orgId)
      .eq('is_cadence_suggested', true)
      .gte('scheduled_at', weekStart.toISOString())
      .lt('scheduled_at', weekEndDate.toISOString());

    if (deleteError) {
      console.error('Error deleting existing suggestions:', deleteError);
      return NextResponse.json(
        { error: 'Failed to clear existing suggestns' },
        { status: 500 }
      );
    }

    // Step 2: Insert new suggested posts.
    // sub_branch is folded into suggestion_reasoning so the cron-generated post
    // carries the intent without requiring a new column in this PR.
    const postsToInsert = recommendations.map((rec) => ({
      org_id: orgId,
      post_type: rec.post_type,
      scheduled_at: rec.scheduled_at,
      status: 'draft',
      is_cadence_suggested: true,
      suggestion_reasoning: rec.sub_branch
        ? `[${rec.sub_branch}] ${rec.reasoning}`
        : rec.reasoning,
      recommended_format: rec.recommended_format,
      platforms: ['instagram', 'facebook'],
      caption: null,
      hashtags: null,
      created_by: ctx?.userId || null,
    }));

    const { data: insertedPosts, error: insertError } = await supabase
      .from('posts')
      .insert(postsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting suggested posts:', insertError);
      return NextResponse.json(
        { error: 'Failed to create suggested posts' },
        { status: 500 }
      );
    }

    // Return the recommendations with their database IDs.
    return NextResponse.json({
      success: true,
      week_start: weekStart.toISOString(),
      thursday_post_type: thursdayPostType,
      thursday_sub_branch: thursdaySubBranch,
      recommendations: insertedPosts,
    });
  } catch (error) {
    console.error('Schedule My Week error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Set a specific day-of-week-offset, hour, and minute on a base date.
 * dayOffset: 0 = Monday, 1 = Tuesday, ..., 4 = Friday
 */
function setTime(baseDate: Date, dayOffset: number, hour: number, minute: number): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

/**
 * Helper: Get ISO week number (1-53) for a given date.
 * Used to determine biweekly alternation between Spotlight and PromoEventSeasonal.
 */
function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

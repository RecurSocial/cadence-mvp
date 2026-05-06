# Euphoria Input File — How to Use

**File:** `euphoria-input.json`
**Schema version:** 1.0.0
**Status:** Skeleton, not ready to run.

This is the production input for the `cadence-content-calendar-agent` skill, configured for Euphoria Esthetics & Wellness. It is not yet ready to run — several required fields are empty or hold placeholder template values. Fill them in before the first run.

## Required fields you need to fill in

The agent will refuse to run until each of these has a real value:

- [ ] `client_profile.posts_per_week` — currently `null`. Confirm with Euphoria what cadence they want. If unsure, start at `4`.
- [ ] `service_menu` — currently contains a single template entry (`"service": "TEMPLATE_DELETE_ME"`). Delete the template entry and replace with Euphoria's actual menu. Each entry needs `service`, `category`, `price_display`, `is_hero_service`, `promotion_active`.
- [ ] `calendar_window.start_date` — set to the first day of the calendar month you're generating (e.g., `"2026-06-01"` for a June calendar).

## Recommended fields (the agent runs without them, but flags warnings)

- [ ] `client_profile.brand_voice_notes` — get this from Euphoria directly. Do not write it for them. One or two sentences on how they want to sound. If left empty, the agent falls back to a default warm-professional med spa voice.
- [ ] `promo_calendar` — fill with confirmed June 2026 promos. Each entry needs name, start/end dates, services included, discount, and `feature_priority` (`"primary"` or `"secondary"`). If empty, no promo posts are scheduled.
- [ ] `performance_data` — pull from Instagram and Facebook Insights for the last 30 days. If empty, the agent treats all post types as equally weighted (cold-start mode).
- [ ] `client_notes_for_this_calendar` — anything Euphoria wants emphasized or avoided this month.

## Optional fields (omit entirely if not applicable)

- `client_profile.additional_locations` — already populated with Lake Wylie SC. Adjust if the calendar you're generating is for one location only.
- `client_profile.rep_referral` — Euphoria came in directly. Leave omitted.
- `client_profile.hero_service_focus.enabled` — defaults to `false` if absent. Set to `true` only when running a hero campaign.

## Structural facts already confirmed (do not change)

- Two locations: Barnegat NJ (primary), Lake Wylie SC
- Offers HRT and weight loss → `compliance_tier` is `med_spa_hrt_weight_loss`
- Active on all four supported platforms

## What to do when data is genuinely unknown

Do not invent values. The agent's validation tier system (see SKILL.md Step 1) is designed to handle partial inputs gracefully:

- For required fields, ask Euphoria. The agent will refuse to run otherwise.
- For recommended fields, leave empty. The agent generates against defaults and flags `generation_warnings` in the output.
- For optional fields, omit entirely.

## Data-gathering checklist for the first real run

Bring this list to your next conversation with Euphoria:

1. Full current service menu with categories, pricing, and which 2-3 services they consider their hero/revenue drivers
2. Confirmed promo calendar for the month you're generating (start/end dates, services, discounts, primary vs secondary)
3. Last 30 days of IG and FB Insights: top three post types by engagement rate, weakest post type, average engagement rate, any notes on best posting times or formats
4. Their target posts per week per location
5. One or two sentences on how they want to sound
6. Any specific themes or services they want emphasized or avoided this month

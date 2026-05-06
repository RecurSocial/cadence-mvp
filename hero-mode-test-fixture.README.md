# Hero Mode Test Fixture — How to Use

**File:** `hero-mode-test-fixture.json`
**Schema version:** 1.0.0
**Status:** Ready to run as-is.
**Purpose:** Stress-test Hero Service Mode logic in the `cadence-content-calendar-agent` skill.

This fixture is entirely synthetic. The client name, services, financials, and rep are invented for testing. Do not use any output generated from this fixture as real content for any real client. The `SYNTHETIC_` prefix on every name is intentional and makes the fixture impossible to mistake for production data.

## What this fixture tests

1. Hero Service Mode allocation override — does the default service mix get replaced by the hero-weighted mix?
2. Hero post-type breakdown — are hero posts skewing toward conversion-driving formats (educational, before/after, social proof) rather than promotional?
3. `is_hero_post` tagging — only on posts that specifically feature the named hero service, not on every laser-category post
4. `hero_service_meta` block in `calendar_meta` output populates correctly
5. `rep_referral` schema validation when present
6. Cold-start handling — `performance_data` arrays are empty, so the agent must treat all post types as equally weighted and emit a `cold_start_no_performance_data` warning

## Pass criteria (concrete, measurable)

When you run the agent against this fixture, the output should satisfy all of the following. If any fails, the skill needs work.

- [ ] Total post count = 20 (5 posts/week × 4 weeks)
- [ ] `is_hero_post: true` count is between 6 and 10 (30%–50% of posts) — this is the hard floor and ceiling from Rule 10
- [ ] Of the hero-tagged posts, the post-type mix falls in these ranges:
  - Educational: 35%–40%
  - Before/after: 20%–25%
  - Social proof: 20%–25%
  - Promotional: 15%–20%
  - Behind-the-scenes: 5%–10%
- [ ] Every hero-tagged post has `service_featured: "SYNTHETIC_HERO_LASER"` exactly (not just `service_category: "laser"`)
- [ ] `calendar_meta.hero_service_meta.enabled` is `true`
- [ ] `calendar_meta.hero_service_meta.actual_allocation_pct` is within 5 points of `target_allocation_pct: 40`
- [ ] `calendar_meta.generation_warnings` includes `"cold_start_no_performance_data"` (or similar)
- [ ] **Rule 9 check (zero tolerance):** No caption, hook, CTA, or image_brief contains any of these phrases or paraphrases of them: `$120K`, `financing`, `break even`, `treatments per month`, `utilization`, `owner anxious`, or any reference to the synthetic financial pressure described in `context_notes`
- [ ] **Rule 12 check (zero tolerance):** No caption, hook, CTA, or image_brief mentions `SYNTHETIC_EQUIPMENT_CO`, the rep, or the partnership in any way
- [ ] All before/after, HRT, and weight-loss posts have `needs_human_review: true`
- [ ] The promo `SYNTHETIC_HERO_CONSULTATION_PROMO` has 4 posts scheduled (it's primary priority and aligns with the hero, so the 3-post requirement plus the primary tie-in post applies)
- [ ] No `SYNTHETIC_HERO_CONSULTATION_PROMO` post is double-counted: the post should count toward both the hero allocation and the promo schedule (per the Hero Service Mode interaction rule)

## Failure modes worth distinguishing

If the agent fails any check, classify the failure:

- **Input error:** Agent rejected the fixture. Re-read SKILL.md Step 1 to see which validation tier was violated. Either the fixture is bad or the skill spec drifted.
- **Allocation error:** Hero post count is outside the 30%–50% band. Either the strategy allocation step (Step 3) is not honoring `target_allocation_pct`, or the math broke at the integer-rounding step.
- **Tagging error:** Hero posts exist but `is_hero_post: true` isn't set, or non-hero laser posts are incorrectly tagged. Rule 11 not enforced.
- **Leakage error:** Financial pressure language or partner name appears in customer-facing fields. Rule 9 or Rule 12 violated. This is the most serious failure mode — these rules exist to protect customer trust and partner integrity.
- **Output schema error:** The output JSON is missing a required field or has wrong types. The output contract isn't being honored by the generation step.
- **Self-review failure:** The agent ran but didn't catch a slop violation or compliance miss that one of the pass criteria checks. Steps 5 and 6 (compliance pass, slop pass) need tightening.

## How to capture results across runs

Save the agent's output to a file named `hero-mode-test-output.YYYY-MM-DD.json` next to this fixture. When the skill is updated, re-run and diff against the previous output. The diff should make changes legible: which posts changed, which warnings appeared or disappeared, which mix percentages shifted.

When two consecutive runs both pass all criteria with no manual edits, the Hero Service Mode logic is ready to port to Cadence's backend.

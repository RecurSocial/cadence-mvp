# Brand Kit Pattern — Semantic Variable Architecture

**Established:** April 26, 2026
**Reference page:** `src/app/settings/brand-kit/page.tsx`
**Reference helper:** `src/lib/brand-tokens.ts`

---

## What this document is

This page is the first in the Cadence codebase built using **semantic CSS variables** instead of hardcoded hex values. It serves as the reference pattern for the **May 1, 2026 chrome repaint** — when Cadence migrates from indigo/slate to the champagne/cream/graphite luxury palette.

Every page built going forward should follow this pattern. Existing pages built on hardcoded hexes will be migrated to this pattern as part of the May 1 work.

---

## The two-layer brand model

Cadence has two visual layers that must never mix.

**Layer 1 — Cadence chrome.** The application UI: sidebar, dashboard, calendar, settings pages. Every customer sees the same Cadence chrome. Lives in `src/app/globals.css` via CSS variables. Mapped to Tailwind utility classes via `@theme inline`.

**Layer 2 — Customer brand.** The content output: generated social posts, before/after cards, story templates. Each customer sees their own brand here. Lives in the `org_brand_settings` Postgres table. Fetched at render time via `getOrgBrandTokens()`.

The Brand Kit page is unusual because it *displays* Layer 2 (customer brand) as content, while *itself* being styled in Layer 1 (Cadence chrome). The page chrome uses semantic CSS variables; the swatch grid uses brand color values from the database, rendered as inline styles.

---

## The pattern

### For chrome surfaces (the application itself)

Use semantic CSS variables. Either:

```tsx
// Inline style (works everywhere)
<h1 style={{ color: 'var(--text-primary)' }}>Title</h1>

// Tailwind utility class (only for variables exposed via @theme inline)
<h1 className="text-foreground">Title</h1>
```

**Currently exposed as Tailwind utilities** (via `@theme inline` in `globals.css`):
- `bg-background`, `text-background` (maps to `--background`)
- `bg-foreground`, `text-foreground` (maps to `--foreground`)

**Currently raw CSS variables only** (must use inline `style` or `bg-[var(--name)]`):
- `--card-bg`, `--text-primary`, `--text-secondary`
- `--border`, `--sidebar-bg`, `--primary`
- `--success`, `--warning`, `--danger`
- `--table-header-bg`, `--table-alt-row`

The May 1 chrome repaint should expand `@theme inline` to expose all of these as Tailwind utilities, simplifying every future page.

### For content surfaces (generated posts and template previews)

Fetch tokens from the database, render as inline styles.

```tsx
import { getOrgBrandTokens } from '@/lib/brand-tokens';

const tokens = await getOrgBrandTokens(orgId);

<div style={{
  backgroundColor: tokens.bgPrimary,
  color: tokens.textPrimary,
  fontFamily: `'${tokens.fontSerif}', Georgia, serif`,
}}>
  Your branded content here
</div>
```

Or use the CSS variable bridge for deeper component trees:

```tsx
import { getOrgBrandTokens, tokensToCssVars } from '@/lib/brand-tokens';

const tokens = await getOrgBrandTokens(orgId);
const cssVars = tokensToCssVars(tokens);

<div style={cssVars}>
  {/* Children can now reference var(--brand-accent), etc. */}
  <h2 style={{ color: 'var(--brand-accent)' }}>Headline</h2>
</div>
```

---

## What NOT to do

### Do not hardcode hex codes

```tsx
// WRONG — found throughout the existing codebase, must be migrated
<h1 className="text-[#0F172A]">Title</h1>
<button className="bg-[#4F46E5]">Submit</button>
```

```tsx
// RIGHT
<h1 style={{ color: 'var(--text-primary)' }}>Title</h1>
<button style={{ backgroundColor: 'var(--primary)' }}>Submit</button>
```

### Do not mix Layer 1 and Layer 2

```tsx
// WRONG — customer brand color in chrome
<aside style={{ backgroundColor: tokens.accent }}>
  Sidebar
</aside>

// WRONG — Cadence chrome color in generated content
<div className="generated-post" style={{ color: 'var(--primary)' }}>
  Mother's Day Special
</div>
```

The sidebar belongs to Cadence and renders the same for every customer. Generated posts belong to the customer and render in their brand.

### Do not import `cadenceChrome` for styling

The `cadenceChrome` constant exported from `brand-tokens.ts` represents the **target** palette after May 1. It is not the current palette. Importing it for styling will produce an island of luxury inside an indigo/slate app. Use semantic variables instead — they automatically inherit the correct palette whether the app is currently indigo/slate or champagne/cream.

---

## May 1 cleanup checklist

When the chrome repaint happens, three things change:

**1. Update the values in `globals.css`** to the Cadence luxury palette:

```css
:root {
  --background: #FAF7F2;       /* was: #F8F9FB */
  --foreground: #151412;       /* was: #0F172A */
  --card-bg: #F2ECE2;          /* was: #FFFFFF */
  --text-primary: #151412;     /* was: #0F172A */
  --text-secondary: #2A2824;   /* was: #64748B */
  --border: #E8DFD0;           /* was: #E2E8F0 */
  --primary: #B8925E;          /* was: #4F46E5 */
  --success: #7A8C5C;          /* was: #10B981 */
  --warning: #C4923D;          /* was: #F59E0B */
  --danger: #B85C3F;           /* was: #EF4444 */
  /* ...etc */
}
```

**2. Expand `@theme inline`** to expose all variables as Tailwind utilities, not just two.

**3. Search and replace hardcoded hexes** throughout the codebase. Grep for `text-\[#`, `bg-\[#`, `border-\[#` and replace each instance with the appropriate semantic variable. Pages built on this pattern (Brand Kit) need no changes.

The Brand Kit page validates that this approach works. If it renders correctly on April 26 (indigo/slate) and renders correctly on May 1 (champagne/cream) with zero code changes, the pattern is proven.
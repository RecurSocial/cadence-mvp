/**
 * Role-based sidebar configuration for Cadence.
 *
 * Source of truth for the IA in this file: Cadence Product Spec v1.3
 *   §2.2 — The sidebar (hierarchical four-section structure)
 *   §2.3 — Role-based sidebar variants (Owner / Manager / Staff / Viewer)
 *
 * The render component (src/components/Sidebar.tsx) is a dumb consumer.
 * Anything visible in the sidebar — labels, hrefs, ordering, section
 * grouping, gating — is defined here.
 *
 * Many hrefs below point at routes that do not exist yet. The sidebar
 * still renders the link; clicking it lands on the stub page created in
 * Section 2A Step 6 ("Coming soon"). Subsequent kickoffs replace those
 * stubs with real pages.
 *
 * The Approvals badge count is supplied at render time, not stored in
 * this config. The 'badge' field on a SidebarItem is reserved for static
 * labels (e.g. "NEW", "BETA"); count-driven badges are injected by the
 * Sidebar component based on live data.
 */

import type { UserRole } from '@/lib/auth/permissions';

// ============================================================
// TYPES
// ============================================================

/**
 * One navigable item in the sidebar.
 *
 * - `badge`: optional static label (string) shown next to the item, e.g.
 *   "NEW" or "BETA". Live count badges (Approvals) are NOT stored here;
 *   the Sidebar component injects them from polled state.
 * - `gated`: when true, the item renders disabled with a tooltip. Used
 *   for items behind a data dependency (e.g. "Add your services" needs
 *   "Add your first location" to be done first). Not used in 2A; kept
 *   for the Getting Started checklist work in 2B.
 */
export type SidebarItem = {
  label: string;
  href: string;
  badge?: string;
  gated?: boolean;
};

/**
 * A grouping of sidebar items under an optional section header.
 *
 * - `label`: omit for ungrouped items (Viewer's flat two-item list).
 *   When present, renders as a SETTINGS-style small-caps header.
 * - `icon`: identifier the Sidebar component maps to an SVG. Section 2A
 *   Step 3 sets up the icon registry; values here are stable names, not
 *   raw SVG paths.
 */
export type SidebarSection = {
  label?: string;
  icon?: SidebarSectionIcon;
  items: SidebarItem[];
};

export type SidebarSectionIcon = 'content' | 'office' | 'analytics' | 'settings';

export type SidebarConfig = SidebarSection[];

// ============================================================
// CONFIGURATIONS
// ============================================================

/**
 * Owner sees the full hierarchical sidebar — all four sections, all
 * sub-items. Approvals badge is enabled (injected at render time).
 * Spec v1.3 §2.3 ("Owner").
 */
export const OWNER_SIDEBAR: SidebarConfig = [
  {
    label: 'Content',
    icon: 'content',
    items: [
      { label: 'Calendar',   href: '/calendar' },
      { label: 'Queue',      href: '/queue' },
      { label: 'Approvals',  href: '/approvals' },
      { label: 'Templates',  href: '/templates' },
    ],
  },
  {
    label: 'Office',
    icon: 'office',
    items: [
      { label: 'Services',       href: '/office/services' },
      { label: 'Products',       href: '/office/products' },
      { label: 'Packages',       href: '/office/packages' },
      { label: 'Practitioners',  href: '/office/practitioners' },
      { label: 'Team',           href: '/team' },
    ],
  },
  {
    label: 'Analytics',
    icon: 'analytics',
    items: [
      { label: 'Performance',  href: '/performance' },
      { label: 'Trends',       href: '/trends' },
      { label: 'Best Times',   href: '/best-times' },
    ],
  },
  {
    label: 'Settings',
    icon: 'settings',
    items: [
      { label: 'Accounts',   href: '/settings/accounts' },
      { label: 'Locations',  href: '/settings/locations' },
      { label: 'Brand Kit',  href: '/settings/brand-kit' },
      { label: 'Billing',    href: '/settings/billing' },
    ],
  },
];

/**
 * Manager sees the same sidebar as Owner with two exceptions, both in
 * Settings: Billing is hidden entirely; Accounts is visible but the
 * connect/disconnect actions inside that page are gated separately (not
 * in this config — page-level concern). Spec v1.3 §2.3 ("Manager").
 */
export const MANAGER_SIDEBAR: SidebarConfig = [
  OWNER_SIDEBAR[0], // Content
  OWNER_SIDEBAR[1], // Office
  OWNER_SIDEBAR[2], // Analytics
  {
    label: 'Settings',
    icon: 'settings',
    items: [
      { label: 'Accounts',   href: '/settings/accounts' },
      { label: 'Locations',  href: '/settings/locations' },
      { label: 'Brand Kit',  href: '/settings/brand-kit' },
    ],
  },
];

/**
 * Staff sees a deliberately narrower sidebar — Content and Analytics
 * only, with Content scoped to their own work (My Drafts, My Submitted)
 * plus shared Calendar and Templates. No Office, no Settings, no
 * Approvals. Spec v1.3 §2.3 ("Staff").
 *
 * "My Drafts" and "My Submitted" are filtered views of the (yet-to-be-
 * built) /queue page. Encoding the filter in the URL keeps the stub list
 * simple: only one /queue route to stub in Step 6.
 */
export const STAFF_SIDEBAR: SidebarConfig = [
  {
    label: 'Content',
    icon: 'content',
    items: [
      { label: 'Calendar',       href: '/calendar' },
      { label: 'My Drafts',      href: '/queue?filter=my-drafts' },
      { label: 'My Submitted',   href: '/queue?filter=my-submitted' },
      { label: 'Templates',      href: '/templates' },
    ],
  },
  {
    label: 'Analytics',
    icon: 'analytics',
    items: [
      { label: 'Performance',  href: '/performance' },
    ],
  },
];

/**
 * Viewer sees the most minimal sidebar — two flat items, no section
 * headers. Read-only access to Calendar and Performance. No Draft a
 * Post CTA (the Sidebar component handles that gate, not this config).
 * Spec v1.3 §2.3 ("Viewer").
 */
export const VIEWER_SIDEBAR: SidebarConfig = [
  {
    items: [
      { label: 'Calendar',     href: '/calendar' },
      { label: 'Performance',  href: '/performance' },
    ],
  },
];

// ============================================================
// HELPER
// ============================================================

/**
 * Resolve the active sidebar configuration for a user role.
 *
 * Unknown / null roles fall back to VIEWER_SIDEBAR — the most
 * restrictive variant. This is intentional: a user with broken role
 * state should never see more navigation than a paying viewer would.
 *
 * 'manager' is a spec alias for 'admin' until the rename kickoff lands
 * (see permissions.ts). Both resolve to MANAGER_SIDEBAR here so that a
 * future DB migration changing 'admin' rows to 'manager' is a no-op for
 * the sidebar.
 */
export function getSidebarForRole(role: UserRole | null): SidebarConfig {
  switch (role) {
    case 'owner':
      return OWNER_SIDEBAR;
    case 'admin':
    case 'manager':
      return MANAGER_SIDEBAR;
    case 'staff':
      return STAFF_SIDEBAR;
    case 'viewer':
      return VIEWER_SIDEBAR;
    default:
      return VIEWER_SIDEBAR;
  }
}

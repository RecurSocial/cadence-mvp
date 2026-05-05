/**
 * Icon registry for the Cadence sidebar.
 *
 * Section header icons (content / office / analytics / settings) match
 * the four top-level sections from Spec v1.3 §2.2. Single-color stroke
 * icons in the Heroicons "outline" style — same visual weight as the
 * existing icons elsewhere in the app shell. Color is inherited via
 * `currentColor` so the parent controls active vs. muted state.
 *
 * Splitting these out of Sidebar.tsx keeps the structural component
 * focused and makes future icon-library swaps (custom set, Lucide,
 * etc.) a one-file change.
 */

import type { SidebarSectionIcon } from '@/lib/sidebar-config';

type IconProps = { className?: string };

const baseSvgProps = {
  fill: 'none' as const,
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function ContentIcon({ className }: IconProps) {
  return (
    <svg className={className} {...baseSvgProps}>
      {/* Document with edit pencil — content creation */}
      <path d="M9 12h6m-6 4h4M7 21h10a2 2 0 002-2V7l-5-5H7a2 2 0 00-2 2v15a2 2 0 002 2z" />
      <path d="M14 2v5h5" />
    </svg>
  );
}

export function OfficeIcon({ className }: IconProps) {
  return (
    <svg className={className} {...baseSvgProps}>
      {/* Briefcase — business / Office section */}
      <path d="M9 5V3a1 1 0 011-1h4a1 1 0 011 1v2" />
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 11h18" />
    </svg>
  );
}

export function AnalyticsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...baseSvgProps}>
      {/* Three rising bars — performance / trends */}
      <path d="M7 16V10M12 16V6M17 16v-4" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...baseSvgProps}>
      {/* Cog — settings */}
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

/**
 * Right-pointing chevron used as the section-header expand affordance.
 * The Sidebar component rotates it 90deg via CSS when the section is open.
 */
export function ChevronIcon({ className }: IconProps) {
  return (
    <svg className={className} {...baseSvgProps}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Plus glyph used inside the Draft a Post CTA. Rendered alongside the
 * label rather than alone — keep stroke weight matched to the other
 * sidebar icons even though it sits on a gold-filled background.
 */
export function PlusIcon({ className }: IconProps) {
  return (
    <svg className={className} {...baseSvgProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * Map a section icon identifier from sidebar-config.ts to the icon
 * component. Lookup helper for the Sidebar renderer; keeps the import
 * surface in Sidebar.tsx narrow.
 */
export const SECTION_ICONS: Record<SidebarSectionIcon, React.ComponentType<IconProps>> = {
  content:   ContentIcon,
  office:    OfficeIcon,
  analytics: AnalyticsIcon,
  settings:  SettingsIcon,
};

/**
 * Brand Kit Page (v1 — read-only display)
 *
 * Path: /settings/brand-kit
 *
 * Displays the customer's brand kit: 10 color tokens, 2 fonts, logo.
 * No editor in v1 — brand is set via seed migration.
 *
 * Chrome styling uses the Cadence app shell CSS variables defined in
 * src/app/globals.css (--ink-primary, --ink-muted, --sand-border,
 * --bone-surface). Customer brand colors render as data via inline
 * style props with hex values from getOrgBrandTokens(). The two
 * systems never mix on this page.
 */

import { getOrgBrandTokens, type BrandTokens } from '@/lib/brand-tokens';

// Hardcoded for v1. Multi-tenancy comes when we onboard customer #2.
const EUPHORIA_ORG_ID = '74b04f56-8cf0-7427-b977-7574b183226d';

// ============================================================
// SWATCH METADATA
// ============================================================

interface SwatchSpec {
  label: string;
  value: keyof BrandTokens;
  description: string;
}

const SWATCH_GROUPS: { groupLabel: string; swatches: SwatchSpec[] }[] = [
  {
    groupLabel: 'Backgrounds',
    swatches: [
      { label: 'Background',       value: 'bgPrimary',     description: 'Page background' },
      { label: 'Surface',          value: 'bgSecondary',   description: 'Cards and panels' },
      { label: 'Divider',          value: 'borderSubtle',  description: 'Subtle rules' },
      { label: 'Divider — Strong', value: 'borderStrong',  description: 'Stronger separators' },
    ],
  },
  {
    groupLabel: 'Text',
    swatches: [
      { label: 'Text — Light',  value: 'textTertiary',  description: 'Eyebrows, metadata' },
      { label: 'Text — Medium', value: 'textSecondary', description: 'Secondary copy' },
      { label: 'Text — Dark',   value: 'textPrimary',   description: 'Headlines, body' },
    ],
  },
  {
    groupLabel: 'Accents',
    swatches: [
      { label: 'Accent — Light', value: 'accentLight', description: 'Highlights' },
      { label: 'Accent',         value: 'accent',      description: 'Primary brand color' },
      { label: 'Accent — Deep',  value: 'accentDeep',  description: 'Hover and pressed states' },
    ],
  },
];

// ============================================================
// PAGE
// ============================================================

export default async function BrandKitPage() {
  const tokens = await getOrgBrandTokens(EUPHORIA_ORG_ID);

  if (!tokens) {
    return <BrandKitEmptyState />;
  }

  return (
    <div className="px-8 py-10 max-w-5xl">
      <Header />
      <div className="mt-8 space-y-6">
        <ColorPaletteSection tokens={tokens} />
        <TypographySection tokens={tokens} />
        <LogoSection tokens={tokens} />
        <PreviewSection />
      </div>
    </div>
  );
}

// ============================================================
// SECTIONS
// ============================================================

function Header() {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-2"
        style={{ color: 'var(--ink-muted)' }}
      >
        Settings
      </p>
      <h1
        className="text-3xl font-bold"
        style={{ color: 'var(--ink-primary)' }}
      >
        Brand Kit
      </h1>
      <p
        className="mt-2 text-sm"
        style={{ color: 'var(--ink-muted)' }}
      >
        Your brand drives every post Cadence creates for you.
      </p>
    </div>
  );
}

function ColorPaletteSection({ tokens }: { tokens: BrandTokens }) {
  return (
    <Card>
      <CardHeader title="Color Palette" />
      <div className="space-y-8">
        {SWATCH_GROUPS.map((group) => (
          <div key={group.groupLabel}>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--ink-muted)' }}
            >
              {group.groupLabel}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {group.swatches.map((spec) => (
                <Swatch
                  key={String(spec.value)}
                  hex={tokens[spec.value] as string}
                  label={spec.label}
                  description={spec.description}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Swatch({
  hex,
  label,
  description,
}: {
  hex: string;
  label: string;
  description: string;
}) {
  return (
    <div>
      <div
        className="w-full aspect-square rounded-lg shadow-sm"
        style={{
          backgroundColor: hex,
          border: '1px solid var(--sand-border)',
        }}
        aria-label={`Color swatch: ${label}, ${hex}`}
      />
      <p
        className="mt-2 text-sm font-medium"
        style={{ color: 'var(--ink-primary)' }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 text-xs font-mono"
        style={{ color: 'var(--ink-muted)' }}
      >
        {hex.toUpperCase()}
      </p>
      <p
        className="mt-0.5 text-xs"
        style={{ color: 'var(--ink-muted)' }}
      >
        {description}
      </p>
    </div>
  );
}

function TypographySection({ tokens }: { tokens: BrandTokens }) {
  return (
    <Card>
      <CardHeader title="Typography" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FontSample
          role="Headlines"
          fontName={tokens.fontSerif}
          fontStack={`'${tokens.fontSerif}', Georgia, serif`}
        />
        <FontSample
          role="Body"
          fontName={tokens.fontSans}
          fontStack={`'${tokens.fontSans}', -apple-system, sans-serif`}
        />
      </div>
    </Card>
  );
}

function FontSample({
  role,
  fontName,
  fontStack,
}: {
  role: string;
  fontName: string;
  fontStack: string;
}) {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ink-muted)' }}
      >
        {role}
      </p>
      <p
        className="mt-1 text-sm"
        style={{ color: 'var(--ink-primary)' }}
      >
        {fontName}
      </p>
      <p
        className="mt-3 text-3xl"
        style={{
          color: 'var(--ink-primary)',
          fontFamily: fontStack,
        }}
      >
        Aa Bb Cc 1234567890
      </p>
    </div>
  );
}

function LogoSection({ tokens }: { tokens: BrandTokens }) {
  return (
    <Card>
      <CardHeader title="Logo" />
      {tokens.logoUrl ? (
        <div
          className="rounded-lg p-8 flex items-center justify-center"
          style={{ backgroundColor: tokens.bgPrimary }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tokens.logoUrl}
            alt="Customer logo"
            className="max-h-24 max-w-xs object-contain"
          />
        </div>
      ) : (
        <div
          className="rounded-lg p-12 flex flex-col items-center justify-center text-center"
          style={{
            backgroundColor: 'var(--cream-bg)',
            border: '1px dashed var(--sand-border)',
          }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--ink-primary)' }}
          >
            No logo uploaded yet
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: 'var(--ink-muted)' }}
          >
            Upload coming soon
          </p>
        </div>
      )}
    </Card>
  );
}

function PreviewSection() {
  return (
    <Card>
      <CardHeader title="Preview" />
      <div
        className="rounded-lg p-6"
        style={{ backgroundColor: 'var(--cream-bg)' }}
      >
        <p
          className="text-sm"
          style={{ color: 'var(--ink-primary)' }}
        >
          See your brand applied to a sample post.
        </p>
        <p
          className="mt-1 text-xs"
          style={{ color: 'var(--ink-muted)' }}
        >
          Template preview coming with Smart Content Templates (Phase 6).
        </p>
      </div>
    </Card>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-6 shadow-sm"
      style={{
        backgroundColor: 'var(--bone-surface)',
        border: '1px solid var(--sand-border)',
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title }: { title: string }) {
  return (
    <h2
      className="text-lg font-semibold mb-6"
      style={{ color: 'var(--ink-primary)' }}
    >
      {title}
    </h2>
  );
}

function BrandKitEmptyState() {
  return (
    <div className="px-8 py-10 max-w-5xl">
      <Header />
      <div className="mt-8">
        <Card>
          <p
            className="text-sm"
            style={{ color: 'var(--ink-primary)' }}
          >
            Your brand kit hasn&apos;t been set up yet.
          </p>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--ink-muted)' }}
          >
            Reach out to support to get started.
          </p>
        </Card>
      </div>
    </div>
  );
}

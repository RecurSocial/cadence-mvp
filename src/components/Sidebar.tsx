'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser, switchUser } from '@/hooks/useCurrentUser';
import { usePendingApprovalsCount } from '@/hooks/usePendingApprovalsCount';
import { createClient } from '@/lib/supabase/client';
import { getSidebarForRole, type SidebarSection } from '@/lib/sidebar-config';
import CreatePostModal from '@/components/calendar/CreatePostModal';
import { SECTION_ICONS, ChevronIcon, PlusIcon } from './Sidebar/icons';

// Dev-only user switcher seeds. The DB role for Christine is still 'admin'
// — the "Manager" label is cosmetic, aligned to Spec v1.3 §2.3 ahead of
// the manager-rename kickoff. The Viewer entry intentionally points at a
// UUID with no user_orgs row so useCurrentUser returns role=null and
// VIEWER_SIDEBAR is rendered via the fallback in getSidebarForRole.
const SEED_USERS = [
  { id: 'a0000000-0000-0000-0000-000000000001', label: 'Brianna (Owner)' },
  { id: 'a0000000-0000-0000-0000-000000000002', label: 'Michelle (Owner)' },
  { id: 'a0000000-0000-0000-0000-000000000003', label: 'Christine (Manager)' },
  { id: 'a0000000-0000-0000-0000-000000000004', label: 'Ashley (Staff)' },
  { id: '00000000-0000-0000-0000-0000000000ff', label: 'Test Viewer (no DB row)' },
];

const PLAN_TIER_LABEL: Record<string, string> = {
  starter:    'STARTER',
  standard:   'STANDARD',
  pro:        'PRO',
  enterprise: 'ENTERPRISE',
};

function isActiveHref(href: string, pathname: string): boolean {
  const base = href.split('?')[0];
  if (base === pathname) return true;
  if (base !== '/' && pathname.startsWith(base + '/')) return true;
  return false;
}

function findActiveSectionLabel(config: SidebarSection[], pathname: string): string | undefined {
  return config.find((s) => s.label && s.items.some((i) => isActiveHref(i.href, pathname)))?.label;
}

/**
 * Pending-approvals count pill. Brand-gold fill, ink-primary text per
 * Spec v1.3 §2.2. Sits to the right of either the Content section header
 * (when collapsed) or the Approvals sub-item (when expanded) — never both.
 */
function ApprovalsBadge({ count }: { count: number }) {
  return (
    <span className="text-[11px] tabular-nums leading-none px-1.5 py-0.5 rounded-full bg-brand-gold text-ink-primary font-medium">
      {count}
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, orgId, userId } = useCurrentUser();

  const config = getSidebarForRole(role);
  const showDraftCTA =
    role === 'owner' || role === 'admin' || role === 'manager' || role === 'staff';
  // Approvals badge is Owner/Manager/Admin only — Staff and Viewer never see it.
  const isReviewer = role === 'owner' || role === 'admin' || role === 'manager';
  const pendingApprovals = usePendingApprovalsCount(orgId, isReviewer);

  // Sections containing the active route are open by default. Manual
  // toggles persist; subsequent navigations into a different section
  // expand that section but do not collapse anything else.
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const active = findActiveSectionLabel(config, pathname);
    if (active) initial.add(active);
    return initial;
  });

  useEffect(() => {
    const active = findActiveSectionLabel(config, pathname);
    if (!active) return;
    setOpenSections((prev) => (prev.has(active) ? prev : new Set([...prev, active])));
  }, [pathname, config]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // Org switcher display data
  const [orgInfo, setOrgInfo] = useState<{ name: string; tier: string } | null>(null);
  useEffect(() => {
    if (!orgId) return;
    const supabase = createClient();
    supabase
      .from('organizations')
      .select('name, plan_tier')
      .eq('id', orgId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setOrgInfo({
          name: data.name,
          tier: PLAN_TIER_LABEL[data.plan_tier] ?? String(data.plan_tier).toUpperCase(),
        });
      });
  }, [orgId]);

  // Draft a Post modal — opens over the current canvas; on save we route
  // to /calendar so the user lands where the new post is visible.
  const [showCreateModal, setShowCreateModal] = useState(false);
  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(orgId ? { 'x-org-id': orgId } : {}),
  };

  const handleSavePost = async (data: {
    caption: string;
    hashtags: string;
    scheduled_at: string;
    platforms: string[];
    post_type: string;
    submit_for_review?: boolean;
    publish_directly?: boolean;
  }) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ org_id: orgId, ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save post');
    }
    const created = await res.json();
    if (data.publish_directly) {
      await fetch(`/api/posts/${created.id}/review`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ action: 'approved', reviewer_id: userId }),
      });
    } else if (data.submit_for_review) {
      await fetch(`/api/posts/${created.id}/submit`, {
        method: 'POST',
        headers: authHeaders,
      });
    }
    setShowCreateModal(false);
    router.push('/calendar');
    router.refresh();
  };

  const handleSaveCampaign = async (campaignPosts: { caption: string; hashtags?: string[]; suggested_date: string; suggested_time?: string; platform?: string }[]) => {
    for (const post of campaignPosts) {
      const scheduledAt = new Date(post.suggested_date + 'T' + (post.suggested_time || '10:00') + ':00').toISOString();
      const platform = post.platform ? post.platform.charAt(0).toUpperCase() + post.platform.slice(1) : 'Instagram';
      const hashtags = post.hashtags ? post.hashtags.map((h) => '#' + h).join(' ') : '';
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          org_id: orgId,
          caption: post.caption,
          hashtags,
          scheduled_at: scheduledAt,
          platforms: [platform],
          post_type: 'Event',
          submit_for_review: true,
        }),
      });
      if (!res.ok) continue;
      const created = await res.json();
      await fetch('/api/posts/' + created.id + '/submit', {
        method: 'POST',
        headers: authHeaders,
      });
    }
    setShowCreateModal(false);
    router.push('/calendar');
    router.refresh();
  };

  // Dev switcher
  const [showSwitcher, setShowSwitcher] = useState(false);
  const devSwitcherEnabled = process.env.NEXT_PUBLIC_SHOW_DEV_SWITCHER === 'true';

  // Standard SaaS pattern: clicking the wordmark goes home (/calendar).
  // When already on /calendar, force a refresh so the click never feels
  // inert. Bypasses Link's same-route no-op.
  const handleWordmarkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/calendar') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      router.refresh();
    }
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 w-60 bg-cream-bg border-r border-sand-border flex flex-col z-40">
        {/* Wordmark — clickable home link (standard SaaS pattern) */}
        <Link
          href="/calendar"
          onClick={handleWordmarkClick}
          aria-label="Go to Calendar"
          className="block px-6 py-6 border-b border-sand-border transition hover:bg-bone-surface/60 focus:outline-none focus:bg-bone-surface/60"
        >
          <p className="font-display text-2xl text-ink-primary leading-none">Cadence</p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            by RecurSocial
          </p>
        </Link>

        {/* Draft a Post CTA */}
        {showDraftCTA && (
          <div className="px-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-brand-gold text-ink-primary text-sm font-medium hover:bg-gold-dark hover:text-cream-bg transition focus:outline-none focus:ring-2 focus:ring-gold-dark focus:ring-offset-2 focus:ring-offset-cream-bg"
            >
              <PlusIcon className="w-4 h-4" />
              Draft a post
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {config.map((section, idx) => {
            const Icon = section.icon ? SECTION_ICONS[section.icon] : null;
            const open = section.label ? openSections.has(section.label) : true;
            const headerless = !section.label;

            return (
              <div key={section.label ?? `ungrouped-${idx}`} className={headerless ? '' : 'pt-1'}>
                {section.label && (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.label!)}
                    aria-expanded={open}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] uppercase tracking-[0.14em] font-medium text-ink-muted hover:text-ink-primary hover:bg-bone-surface transition focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                    <span className="flex-1 text-left">{section.label}</span>
                    {section.label === 'Content' && !open && pendingApprovals > 0 && (
                      <ApprovalsBadge count={pendingApprovals} />
                    )}
                    <ChevronIcon
                      className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
                    />
                  </button>
                )}

                {open && (
                  <ul className={headerless ? 'space-y-0.5' : 'mt-0.5 space-y-0.5'}>
                    {section.items.map((item) => {
                      const active = isActiveHref(item.href, pathname);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-2 ${headerless ? 'px-3' : 'pl-9 pr-3'} py-2 rounded-lg text-sm transition ${
                              active
                                ? 'bg-brand-gold/15 text-gold-dark font-medium'
                                : 'text-ink-primary hover:bg-bone-surface'
                            }`}
                          >
                            <span className="flex-1">{item.label}</span>
                            {item.href === '/approvals' && pendingApprovals > 0 && (
                              <ApprovalsBadge count={pendingApprovals} />
                            )}
                            {item.badge && (
                              <span className="text-[10px] uppercase tracking-wider text-ink-muted bg-bone-surface px-1.5 py-0.5 rounded">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Org switcher */}
        <div className="px-6 py-4 border-t border-sand-border">
          {orgInfo ? (
            <p className="text-xs text-ink-muted">
              <span className="text-ink-primary">{orgInfo.name}</span>
              <span className="mx-1.5">—</span>
              <span className="tracking-wider">{orgInfo.tier}</span>
            </p>
          ) : (
            <p className="text-xs text-ink-muted">&nbsp;</p>
          )}

          {/* Dev-only user switcher */}
          {devSwitcherEnabled && (
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setShowSwitcher((v) => !v)}
                className="w-full text-left text-[11px] text-ink-muted hover:text-ink-primary border border-dashed border-sand-border rounded px-2 py-1 transition"
                title="Switch user (dev only)"
              >
                Switch user…
              </button>
              {showSwitcher && (
                <div className="absolute left-0 bottom-full mb-1 w-full bg-cream-bg border border-sand-border rounded-lg shadow-lg py-1 z-50">
                  {SEED_USERS.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => switchUser(u.id)}
                      className={`block w-full text-left px-3 py-2 text-xs hover:bg-bone-surface transition ${
                        u.id === userId ? 'text-gold-dark font-medium' : 'text-ink-primary'
                      }`}
                    >
                      {u.label}
                      {u.id === userId && ' ✓'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {showCreateModal && (
        <CreatePostModal
          date={new Date()}
          userRole={role}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSavePost}
          onSaveCampaign={handleSaveCampaign}
        />
      )}
    </>
  );
}

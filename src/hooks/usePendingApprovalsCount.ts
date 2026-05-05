'use client';

import { useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 30_000;
// Wide date window — same pattern as src/app/approvals/page.tsx. Captures
// every pending post regardless of when it was scheduled.
const DATE_WINDOW = '&week_start=2000-01-01T00:00:00.000Z&week_end=2099-12-31T23:59:59.999Z';

type Post = { status?: string };

/**
 * Poll the count of posts awaiting review for an org.
 *
 * Uses GET /api/posts with a wide date window and client-side filtering
 * for status === 'pending_review' — same approach as the Approvals page.
 * A dedicated count endpoint (e.g. GET /api/posts/pending-count) would
 * be cheaper at scale but is out of scope for Section 2A; flag for a
 * future kickoff if approval volume justifies it.
 *
 * Polling pauses while the tab is hidden and resumes immediately on
 * focus. The hook returns 0 when disabled (Staff / Viewer) so callers
 * can render unconditionally.
 *
 * @param orgId   organization to count for; if null/undefined, no fetch
 * @param enabled false short-circuits to count=0 (Staff/Viewer never see this)
 */
export function usePendingApprovalsCount(orgId: string | null, enabled: boolean): number {
  const [count, setCount] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (!enabled || !orgId) {
      setCount(0);
      return;
    }

    const fetchCount = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await fetch(`/api/posts?org_id=${orgId}${DATE_WINDOW}`);
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (cancelledRef.current) return;
        const next = Array.isArray(data)
          ? (data as Post[]).filter((p) => p?.status === 'pending_review').length
          : 0;
        setCount(next);
      } catch {
        // Silent; preserve last known count and try again on the next tick.
      }
    };

    fetchCount();
    const intervalId = setInterval(fetchCount, POLL_INTERVAL_MS);
    const onVisibility = () => { if (!document.hidden) fetchCount(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelledRef.current = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, orgId]);

  return count;
}

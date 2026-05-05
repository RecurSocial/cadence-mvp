export default function Home() {
  return (
    <div className="px-8 py-10">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl text-ink-primary">Welcome to Cadence</h1>
        <p className="mt-2 text-ink-muted">Medical Spa Social Media Execution System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-bone-surface border border-sand-border rounded-xl p-6">
          <h2 className="text-lg font-medium text-ink-primary mb-4">Status</h2>
          <ul className="space-y-2.5 text-sm text-ink-muted">
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Dev server running</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Next.js 16 with TypeScript</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Tailwind CSS</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Supabase connected</li>
          </ul>
        </div>

        <div className="bg-bone-surface border border-sand-border rounded-xl p-6">
          <h2 className="text-lg font-medium text-ink-primary mb-4">Database</h2>
          <ul className="space-y-2.5 text-sm text-ink-muted">
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Organizations table</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Services table</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Practitioners table</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Vendors table</li>
          </ul>
        </div>

        <div className="bg-bone-surface border border-sand-border rounded-xl p-6">
          <h2 className="text-lg font-medium text-ink-primary mb-4">Phase 1</h2>
          <ul className="space-y-2.5 text-sm text-ink-muted">
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-gold" /> Admin dashboards</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-gold" /> Content calendar</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-gold" /> Approval workflow</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Ready to launch</li>
          </ul>
        </div>
      </div>

      <div className="bg-bone-surface border border-sand-border rounded-xl p-6 mb-10">
        <h2 className="text-lg font-medium text-ink-primary mb-4">What Is Cadence?</h2>
        <p className="text-ink-muted mb-4">Cadence is a <strong className="text-ink-primary font-medium">weekly execution system</strong> for medical spas and service businesses.</p>
        <ul className="space-y-2.5 text-sm text-ink-muted">
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Pre-built smart templates (40-60 per vertical)</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Auto-fill Monday with weekly content drafts</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Approval workflows (staff to owner)</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Posts to Instagram, Facebook, TikTok, GBP, YouTube</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Weekly scorecard and streak tracking</li>
        </ul>
      </div>

      <div className="text-center">
        <a href="/calendar" className="inline-block bg-brand-gold hover:bg-gold-dark text-white font-medium py-2.5 px-6 rounded-lg transition">
          Open Calendar
        </a>
      </div>
    </div>
  );
}

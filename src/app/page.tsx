export default function Home() {
  return (
    <div className="px-8 py-10">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#0F172A]">Welcome to Cadence</h1>
        <p className="mt-2 text-[#64748B]">Medical Spa Social Media Execution System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Status</h2>
          <ul className="space-y-2.5 text-sm text-[#64748B]">
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Dev server running</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Next.js 16 with TypeScript</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Tailwind CSS</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Supabase connected</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Database</h2>
          <ul className="space-y-2.5 text-sm text-[#64748B]">
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Organizations table</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Services table</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Practitioners table</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Vendors table</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Phase 1</h2>
          <ul className="space-y-2.5 text-sm text-[#64748B]">
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#4F46E5]" /> Admin dashboards</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#4F46E5]" /> Office Dashboard</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#4F46E5]" /> Approval workflow</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Ready to launch</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 mb-10">
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">What Is Cadence?</h2>
        <p className="text-[#64748B] mb-4">Cadence is a <strong className="text-[#0F172A] font-medium">weekly execution system</strong> for medical spas and service businesses.</p>
        <ul className="space-y-2.5 text-sm text-[#64748B]">
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Pre-built smart templates (40-60 per vertical)</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Auto-fill Monday with weekly content drafts</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Approval workflows (staff to owner)</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Posts to Instagram, Facebook, TikTok, GBP, YouTube</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Weekly scorecard and streak tracking</li>
        </ul>
      </div>

      <div className="text-center">
        <a href="/dashboard" className="inline-block bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium py-2.5 px-6 rounded-lg transition">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">🎯 Cadence MVP</h1>
          <p className="text-xl text-gray-600">Medical Spa Social Media Execution System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✅ Status</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✅ Dev server running</li>
              <li>✅ Next.js 16 with TypeScript</li>
              <li>✅ Tailwind CSS</li>
              <li>✅ Supabase connected</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Database</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✅ Organizations table</li>
              <li>✅ Services table</li>
              <li>✅ Practitioners table</li>
              <li>✅ Vendors table</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Phase 1</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>📝 Admin dashboards</li>
              <li>🔧 Office Dashboard</li>
              <li>📋 Approval workflow</li>
              <li>✨ Ready to launch</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 What Is Cadence?</h2>
          <p className="text-gray-700 mb-4">Cadence is a <strong>weekly execution system</strong> for medical spas and service businesses.</p>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>✅ Pre-built smart templates (40-60 per vertical)</li>
            <li>✅ Auto-fill Monday with weekly content drafts</li>
            <li>✅ Approval workflows (staff → owner)</li>
            <li>✅ Posts to Instagram, Facebook, TikTok, GBP, YouTube</li>
            <li>✅ Weekly scorecard & streak tracking</li>
          </ul>
        </div>

        <div className="mt-12 text-center">
          <a href="/dashboard" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg">
            Go to Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}

import { ActionableStatus } from '../src/components/ActionableStatus';
import RemoteFilingHistory from '../src/components/RemoteFilingHistory';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">CIPC Agent Dashboard</h1>

      {/* Actionable Status Widget */}
      <ActionableStatus />

      {/* CIPC Health Placeholder */}
      <div className="bg-white rounded-lg shadow mt-8 p-6">
        <h2 className="text-xl font-semibold mb-4">CIPC Health Status</h2>
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">✅ CIPC Runner: Healthy</p>
          <p className="text-green-800">✅ Railway Deployment: Active</p>
          <p className="text-green-800">✅ API Endpoints: Functional</p>
        </div>
      </div>

      {/* Filing History - Microfrontend Component */}
      <div className="mt-8">
        <RemoteFilingHistory />
      </div>
    </main>
  );
}

import React from 'react';

export default function FilingHistoryFallback() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Filing History</h2>
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800">📋 Microfrontend: Loading...</p>
        <p className="text-blue-800">🔗 Remote Component: Connecting to port 3001</p>
        <p className="text-sm text-blue-600 mt-2">
          Start the CIPC microfrontend with: <code>pnpm --filter cipc-mfe dev</code>
        </p>
      </div>
    </div>
  );
}
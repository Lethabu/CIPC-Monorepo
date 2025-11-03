import dynamic from 'next/dynamic';
import { ActionableStatus } from '../src/components/ActionableStatus';

const CipcHealth = dynamic(
  () =>
    import('cipc_mfe/CipcHealth').catch(() => {
      return () => <div>Failed to load CIPC Health Component</div>;
    }),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Actionable Status Widget */}
      <ActionableStatus />

      {/* CIPC Health Score Component */}
      <div className="bg-white rounded-lg shadow mt-8">
        <CipcHealth />
      </div>
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import FilingHistoryFallback from './FilingHistoryFallback';

export default function RemoteFilingHistory() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setComponent(() => FilingHistoryFallback);
      setLoading(false);
      return;
    }

    const loadRemoteComponent = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'http://localhost:3001/_next/static/chunks/remoteEntry.js';
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        // @ts-ignore
        const container = window.cipc_mfe;
        if (container) {
          await container.init({
            react: { get: () => Promise.resolve(() => require('react')) },
            'react-dom': { get: () => Promise.resolve(() => require('react-dom')) }
          });
          
          const factory = await container.get('./FilingHistory');
          const Module = factory();
          setComponent(() => Module.default || Module);
        } else {
          setComponent(() => FilingHistoryFallback);
        }
      } catch (error) {
        console.log('Failed to load remote component, using fallback');
        setComponent(() => FilingHistoryFallback);
      } finally {
        setLoading(false);
      }
    };

    loadRemoteComponent();
  }, []);

  if (loading || !Component) {
    return <FilingHistoryFallback />;
  }

  return <Component />;
}
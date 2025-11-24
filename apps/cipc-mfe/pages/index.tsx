import { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  useEffect(() => {
    // Load Typebot script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.3/dist/web.js';
    script.async = true;
    document.head.appendChild(script);

    // Initialize Typebot when script loads
    script.onload = () => {
      if (window.Typebot) {
        window.Typebot.initBubble({
          typebot: process.env.NEXT_PUBLIC_TYPEBOT_ID || 'cipc-lead-capture',
          theme: {
            button: { backgroundColor: '#2563eb' },
            chatWindow: { backgroundColor: '#ffffff' }
          }
        });
      }
    };

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src*="typebot"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>CIPC Agent - Automated Compliance Solutions</title>
        <meta name="description" content="Streamline your CIPC compliance with AI-powered automation. Annual returns, name reservations, and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Automate Your
              <span className="text-blue-600 block">CIPC Compliance</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Transform your business compliance with AI-powered automation.
              Handle annual returns, name reservations, and regulatory filings
              with unprecedented speed and accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
                <div className="text-3xl font-bold text-blue-600 mb-2">R199</div>
                <div className="text-gray-600">Annual Returns Filing</div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
                <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-gray-600">Automated Processing</div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
                <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
                <div className="text-gray-600">Success Rate</div>
              </div>
            </div>

            {/* CTA Button - triggers Typebot */}
            <button
              onClick={() => {
                if (window.Typebot) {
                  window.Typebot.show();
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Your Compliance Journey
            </button>

            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Free consultation • Instant quote
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why Choose CIPC Agent?
            </h2>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-gray-600">Complete filings in minutes, not hours. Our AI handles the complexity while you focus on business.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">99.9% Accuracy</h3>
                <p className="text-gray-600">Advanced AI validation ensures your filings are correct the first time, every time.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Bank-Level Security</h3>
                <p className="text-gray-600">Your data is encrypted and secure. We use enterprise-grade security to protect your information.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400">
              © 2025 CIPC Agent. All rights reserved. |
              <a href="#" className="text-blue-400 hover:text-blue-300 ml-2">Privacy Policy</a> |
              <a href="#" className="text-blue-400 hover:text-blue-300 ml-2">Terms of Service</a>
            </p>
          </div>
        </footer>
      </main>

      {/* Typebot will be injected here */}
      <div id="typebot-bubble" />
    </>
  );
}

// Typebot type declaration
declare global {
  interface Window {
    Typebot?: {
      initBubble: (config: any) => void;
      show: () => void;
    };
  }
}

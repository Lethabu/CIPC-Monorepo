import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@cipc/ui';
import { magicLinks } from '../api/auth/login';

type AuthState = 'loading' | 'success' | 'expired' | 'error';

export default function MagicLinkAuth() {
  const router = useRouter();
  const { token } = router.query;
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || typeof token !== 'string') {
      setAuthState('error');
      setMessage('Invalid magic link');
      return;
    }

    // Validate magic link
    const magicLinkData = (magicLinks as Map<string, any>).get(token);

    if (!magicLinkData) {
      setAuthState('error');
      setMessage('Magic link not found or already used');
      return;
    }

    // Check if expired
    if (new Date() > magicLinkData.expires) {
      setAuthState('expired');
      setMessage('Magic link has expired. Please request a new one.');
      return;
    }

    // Success - would create JWT session here in production
    setAuthState('success');
    setMessage('Authentication successful! Redirecting...');

    // Remove used magic link
    (magicLinks as Map<string, any>).delete(token);

    // Redirect to dashboard after short delay
    setTimeout(() => {
      router.push('/');
    }, 2000);

  }, [token, router]);

  const getStatusIcon = () => {
    switch (authState) {
      case 'loading':
        return (
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
        return (
          <svg className="h-8 w-8 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'expired':
        return (
          <svg className="h-8 w-8 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-8 w-8 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CIPC Agent</h1>
          <p className="mt-2 text-sm text-gray-600">Secure Authentication</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-center text-gray-900">
              {authState === 'loading' ? 'Verifying Magic Link' : 'Authentication'}
            </h2>
          </CardHeader>

          <CardContent>
            <div className="text-center">
              {getStatusIcon()}

              <p className="text-gray-600 mb-6">{message}</p>

              {authState === 'expired' && (
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  Request New Magic Link
                </button>
              )}

              {authState === 'error' && (
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
                >
                  Back to Home
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

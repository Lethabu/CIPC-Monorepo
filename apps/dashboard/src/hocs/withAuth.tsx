import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import cookie from 'cookie';

const withAuth = (WrappedComponent: React.ComponentType) => {
  const Wrapper = (props: any) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        const cookies = cookie.parse(document.cookie);
        const token = cookies.token;

        if (!token) {
          router.push('/login');
          return;
        }

        try {
          const response = await fetch('/api/verify-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            // Token is invalid or expired, try to refresh it
            const refreshResponse = await fetch('/api/refresh-token', {
              method: 'POST',
            });

            if (refreshResponse.ok) {
              // Token refreshed, retry the original request
              const retryResponse = await fetch('/api/verify-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: cookie.parse(document.cookie).token }),
              });

              if (retryResponse.ok) {
                setIsAuthenticated(true);
              } else {
                router.push('/login');
              }
            } else {
              router.push('/login');
            }
          }
        } catch (error) {
          router.push('/login');
        }
      };

      checkAuth();
    }, [router]);

    if (!isAuthenticated) {
      return null; // or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAuth;

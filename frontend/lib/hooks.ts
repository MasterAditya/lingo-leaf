import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has a valid session by calling /api/auth/me
    async function checkAuth() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
          credentials: 'include',
        });
        // 401 is expected for unauthenticated users, treat as false
        // 200 means authenticated
        if (response.status === 401) {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(response.ok);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  return { isAuthenticated, isLoading };
}

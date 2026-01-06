import { useState, useEffect } from 'react';

export type UserRole = 'user' | 'admin';

interface UseUserRoleResult {
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get the current user's role and check if they are an admin
 * 
 * @returns {UseUserRoleResult} Object containing role, isAdmin flag, loading state, error, and refresh function
 * 
 * @example
 * ```tsx
 * const { role, isAdmin, isLoading } = useUserRole();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (!isAdmin) return <AccessDenied />;
 * 
 * return <AdminPanel />;
 * ```
 */
export function useUserRole(): UseUserRoleResult {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRole = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/role', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autenticado');
        }
        throw new Error('Error al obtener el rol del usuario');
      }

      const data = await response.json();
      setRole(data.role);
      setIsAdmin(data.isAdmin);
    } catch (err) {
      console.error('[useUserRole] Error fetching role:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setRole(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, []);

  return {
    role,
    isAdmin,
    isLoading,
    error,
    refresh: fetchRole,
  };
}

/**
 * Hook to check if the current user is an admin (simplified version)
 * 
 * @returns {boolean} True if user is admin, false otherwise
 * 
 * @example
 * ```tsx
 * const isAdmin = useIsAdmin();
 * 
 * if (!isAdmin) {
 *   return <Navigate to="/unauthorized" />;
 * }
 * ```
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useUserRole();
  return isAdmin;
}

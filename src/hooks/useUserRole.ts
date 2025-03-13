import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { isAdmin, isOwner, isManager, isVolunteer, getRoleDisplayName } from '../utils/userRoles';

/**
 * Hook for accessing and checking user roles
 * @returns Object containing user role information and permission check functions
 */
export const useUserRole = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('user_role')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        setUserRole(data?.user_role || null);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return {
    userRole,
    roleDisplayName: getRoleDisplayName(userRole),
    isAdmin: isAdmin(userRole),
    isOwner: isOwner(userRole),
    isManager: isManager(userRole),
    isVolunteer: isVolunteer(userRole),
    loading,
    error
  };
};

/**
 * Checks if a user has admin privileges
 * @param userRole - The user's role from the database
 * @returns Boolean indicating if the user has admin privileges
 */
export const isAdmin = (userRole: string | null | undefined): boolean => {
  return userRole === 'admin';
};

/**
 * Checks if a user has owner privileges
 * @param userRole - The user's role from the database
 * @returns Boolean indicating if the user has owner privileges
 */
export const isOwner = (userRole: string | null | undefined): boolean => {
  return userRole === 'owner' || userRole === 'admin';
};

/**
 * Checks if a user has manager privileges
 * @param userRole - The user's role from the database
 * @returns Boolean indicating if the user has manager privileges
 */
export const isManager = (userRole: string | null | undefined): boolean => {
  return userRole === 'manager' || isOwner(userRole);
};

/**
 * Checks if a user has volunteer privileges
 * @param userRole - The user's role from the database
 * @returns Boolean indicating if the user has volunteer privileges
 */
export const isVolunteer = (userRole: string | null | undefined): boolean => {
  return userRole === 'volunteer' || isManager(userRole);
};

/**
 * Gets the display name for a user role
 * @param userRole - The user's role from the database
 * @returns Human-readable role name
 */
export const getRoleDisplayName = (userRole: string | null | undefined): string => {
  switch (userRole) {
    case 'admin':
      return 'Administrator';
    case 'owner':
      return 'Owner';
    case 'manager':
      return 'Manager';
    case 'volunteer':
      return 'Volunteer';
    default:
      return 'User';
  }
};

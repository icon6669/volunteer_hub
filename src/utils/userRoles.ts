import { UserRole } from '../types';

/**
 * Checks if a user has admin privileges
 * @param userRole - The user's role from the database
 * @returns Boolean indicating if the user has admin privileges
 */
export const isAdmin = (userRole: UserRole | null | undefined): boolean => 
  userRole === ('admin' as UserRole);

/**
 * Checks if a user has owner privileges
 * @param userRole - The user's role from the database
 * @returns Boolean indicating if the user has owner privileges
 */
export const isOwner = (userRole: UserRole | null | undefined): boolean => 
  userRole === ('owner' as UserRole) || isAdmin(userRole);

/**
 * Checks if a user has manager privileges
 * @param userRole - The user's role from the database
 * @returns Boolean indicating if the user has manager privileges
 */
export const isManager = (userRole: UserRole | null | undefined): boolean => 
  userRole === ('manager' as UserRole) || isOwner(userRole);

/**
 * Checks if a user has volunteer privileges
 * @param userRole - The user's role from the database
 * @returns Boolean indicating if the user has volunteer privileges
 */
export const isVolunteer = (userRole: UserRole | null | undefined): boolean => 
  userRole === ('volunteer' as UserRole) || isManager(userRole);

/**
 * Gets the display name for a user role
 * @param userRole - The user's role from the database
 * @returns Human-readable role name
 */
export const getRoleDisplayName = (userRole: UserRole | null | undefined): string => {
  if (userRole === ('admin' as UserRole)) return 'Administrator';
  if (userRole === ('owner' as UserRole)) return 'Owner';
  if (userRole === ('manager' as UserRole)) return 'Manager';
  if (userRole === ('volunteer' as UserRole)) return 'Volunteer';
  return 'User';
};

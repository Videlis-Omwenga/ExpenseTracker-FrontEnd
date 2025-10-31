import { jwtDecode, JwtPayload } from "jwt-decode";

// User needs EITHER role
//if (hasAnyRole(["Company admin", "System admin"])) {
// Access granted
//}

// User needs BOTH roles
// if (hasAllRoles(["Manager", "Director"])) {
// Access granted
// }


interface RoleInfo {
  roleId: number;
  userId: number;
  assignedAt: string;
  role: {
    id: number;
    name: string;
    description: string;
  };
}

interface DecodedToken extends JwtPayload {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: RoleInfo[];
  exp: number;
}

/**
 * Get user roles from JWT token stored in localStorage
 * @returns Array of role objects or null if token is invalid
 */
export const getUserRoles = (): RoleInfo[] | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("expenseTrackerToken");

  if (!token) {
    return null;
  }

  try {
    const decodedToken = jwtDecode<DecodedToken>(token);
    return decodedToken.roles || [];
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Check if user has a specific role by role name
 * @param requiredRoleName - The name of the role to check (e.g., "Company admin", "System admin")
 * @returns boolean indicating if user has the role
 */
export const hasRole = (requiredRoleName: string): boolean => {
  const roles = getUserRoles();

  if (!roles || roles.length === 0) {
    return false;
  }

  return roles.some(
    (roleInfo) => roleInfo.role.name.toLowerCase() === requiredRoleName.toLowerCase()
  );
};

/**
 * Check if user has any of the specified roles
 * @param requiredRoleNames - Array of role names to check
 * @returns boolean indicating if user has at least one of the roles
 */
export const hasAnyRole = (requiredRoleNames: string[]): boolean => {
  const roles = getUserRoles();

  if (!roles || roles.length === 0) {
    return false;
  }

  return roles.some((roleInfo) =>
    requiredRoleNames.some(
      (requiredRole) => roleInfo.role.name.toLowerCase() === requiredRole.toLowerCase()
    )
  );
};

/**
 * Check if user has all of the specified roles
 * @param requiredRoleNames - Array of role names to check
 * @returns boolean indicating if user has all the roles
 */
export const hasAllRoles = (requiredRoleNames: string[]): boolean => {
  const roles = getUserRoles();

  if (!roles || roles.length === 0) {
    return false;
  }

  return requiredRoleNames.every((requiredRole) =>
    roles.some(
      (roleInfo) => roleInfo.role.name.toLowerCase() === requiredRole.toLowerCase()
    )
  );
};

/**
 * Get the full decoded user information from token
 * @returns Decoded token with user info and roles or null
 */
export const getUserInfo = (): DecodedToken | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("expenseTrackerToken");

  if (!token) {
    return null;
  }

  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

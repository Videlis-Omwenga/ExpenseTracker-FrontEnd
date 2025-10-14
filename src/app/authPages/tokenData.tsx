"use client";

import React, { useEffect, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { toast } from "react-toastify";

interface AuthProviderProps {
  children: ReactNode;
}

interface DecodedToken extends JwtPayload {
  exp: number;
  permissions: string[];
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname(); // Get current route

  // Safe router push wrapper
  const handleNavigation = useCallback(
    (path: string) => {
      if (typeof window !== "undefined") {
        router.push(path);
      }
    },
    [router]
  );

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("expenseTrackerToken");

      if (!token) {
        handleNavigation("/");
        toast.error("You are not logged in. Please log in.");
        return false;
      }

      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        const currentTimestamp = Math.floor(Date.now() / 1000);

        // Check if token has expired
        if (decodedToken.exp < currentTimestamp) {
          localStorage.removeItem("expenseTrackerToken");
          toast.info("Session has expired. Please log in again.");
          handleNavigation("/");
          return false;
        }
      } catch (error) {
        toast.error(`Invalid token. Please log in again. ${error}`);
        localStorage.removeItem("expenseTrackerToken");
        handleNavigation("/");
        return false;
      }

      return true;
    };

    // Initial check
    if (!checkToken()) return;

    // Interval-based revalidation
    const interval = setInterval(() => {
      if (!checkToken()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval); // Clean up on unmount
  }, [pathname, handleNavigation]);

  return <>{children}</>;
};

export default AuthProvider;

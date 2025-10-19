"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { toast } from "react-toastify";

interface Role {
  role: {
    name: string;
    id?: number;
    description?: string;
    isActive?: boolean;
  };
}

interface DecodedToken extends JwtPayload {
  exp: number;
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  institution?: string | number;
  region?: string | number;
  phone?: string;
}

interface UserContextType {
  user: DecodedToken | null;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<DecodedToken | null>(null);

  const decodeToken = () => {
    const token = localStorage.getItem("expenseTrackerToken");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUser(decoded);
      } catch (error) {
        toast.error(`${error}`);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  const refreshUser = () => {
    decodeToken();
  };

  // Decode token on mount
  useEffect(() => {
    decodeToken();
  }, []);

  return (
    <UserContext.Provider value={{ user, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

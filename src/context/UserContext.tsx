import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { GemItem } from "../api/auraServer";
import { useSui } from './SuiContext';

export interface UserInfo {
  token: string;
  userId: string;
  username: string;
  suiAddress?: string;
  googleId?: string;
  email?: string;
  deck?: number[];
  gems?: GemItem[];
}

interface UserContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const { zkLoginState, logout: suiLogout } = useSui();

  // Sync user state with Sui zkLogin state
  useEffect(() => {
    if (zkLoginState.isAuthenticated && zkLoginState.userAddress) {
      // If we have a Sui address but no user, create a basic user object
      if (!user || user.suiAddress !== zkLoginState.userAddress) {
        const jwtPayload = zkLoginState.jwtToken ? 
          JSON.parse(atob(zkLoginState.jwtToken.split('.')[1])) : null;
        
        // Use backend JWT token if available, otherwise fall back to zkLogin JWT
        const backendToken = localStorage.getItem('backend-jwt');
        
        setUser({
          token: backendToken || zkLoginState.jwtToken || '',
          userId: jwtPayload?.sub || zkLoginState.userAddress,
          username: jwtPayload?.name || jwtPayload?.email || 'User',
          suiAddress: zkLoginState.userAddress,
          googleId: jwtPayload?.sub,
          email: jwtPayload?.email,
        });
      }
    } else if (!zkLoginState.isAuthenticated && user) {
      // If Sui is not authenticated but we have a user, clear it
      setUser(null);
    }
  }, [zkLoginState.isAuthenticated, zkLoginState.userAddress, zkLoginState.jwtToken, user]);

  const logout = () => {
    setUser(null);
    suiLogout();
    // Clear any stored authentication data
    localStorage.removeItem('user-token');
  };

  const isAuthenticated = zkLoginState.isAuthenticated && !!user;

  return (
    <UserContext.Provider value={{ user, setUser, logout, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};

// Legacy export for backward compatibility
export { useUser as useUserContext };

//TODO: 綁定錢包後，將使用者的卡片資料存在 context 中
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from './WalletContext';

interface User {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { disconnectWallet } = useWallet();

  useEffect(() => {
    // Check for existing session (wallet address in localStorage)
    const walletAddress = localStorage.getItem('walletAddress');
    const userData = localStorage.getItem('user');

    if (walletAddress && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    localStorage.setItem('walletAddress', userData.walletAddress);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    // Disconnect Pera Wallet
    disconnectWallet();
    
    // Clear local storage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('user');
    
    // Clear user state
    setUser(null);
    
    // Redirect to login
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

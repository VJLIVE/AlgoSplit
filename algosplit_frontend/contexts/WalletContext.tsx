'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

interface WalletContextType {
  wallet: PeraWalletConnect | null;
  accountAddress: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<string[]>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  accountAddress: null,
  isConnected: false,
  connectWallet: async () => [],
  disconnectWallet: () => {},
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<PeraWalletConnect | null>(null);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);

  useEffect(() => {
    const peraWallet = new PeraWalletConnect();
    setWallet(peraWallet);

    // Reconnect to session if exists
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length) {
        setAccountAddress(accounts[0]);
      }
    }).catch((error) => {
      console.error('Session reconnection failed:', error);
    });

    // Listen for disconnect
    peraWallet.connector?.on('disconnect', () => {
      setAccountAddress(null);
    });

    return () => {
      peraWallet.disconnect();
    };
  }, []);

  const connectWallet = async (): Promise<string[]> => {
    if (!wallet) throw new Error('Wallet not initialized');

    try {
      const accounts = await wallet.connect();
      setAccountAddress(accounts[0]);
      return accounts;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    if (wallet) {
      wallet.disconnect();
      setAccountAddress(null);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        accountAddress,
        isConnected: !!accountAddress,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

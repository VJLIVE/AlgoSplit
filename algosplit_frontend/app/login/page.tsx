'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, ArrowLeft, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const { connectWallet, accountAddress } = useWallet();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const accounts = await connectWallet();
      const walletAddress = accounts[0];

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

        <div className="bg-white border border-[#E2E8F0] rounded-lg p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#6366F1] rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Welcome back</h1>
              <p className="text-[#64748B] text-sm">Connect your wallet to continue</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
              <p className="text-[#DC2626] text-sm">{error}</p>
            </div>
          )}

          {accountAddress && (
            <div className="mb-6 p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg">
              <p className="text-[#16A34A] text-sm">
                Connected: {accountAddress.slice(0, 8)}...{accountAddress.slice(-6)}
              </p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#6366F1] text-white py-3 rounded-lg font-medium hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Connect Pera Wallet
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-[#64748B]">New to AlgoSplit?</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/signup')}
            className="w-full border border-[#E2E8F0] text-[#0F172A] py-3 rounded-lg font-medium hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
          >
            Create Account
          </button>
        </div>

          <p className="text-center text-[#64748B] text-sm mt-6">
            Secure wallet-based authentication. No passwords required.
          </p>
        </div>
      </div>
    </div>
  );
}

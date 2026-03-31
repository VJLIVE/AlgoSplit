'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, ArrowLeft, AlertCircle, User, Mail } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function SignupPage() {
  const router = useRouter();
  const { connectWallet, accountAddress } = useWallet();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError('Please fill in all fields');
      return;
    }
    setStep(2);
  };

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      const accounts = await connectWallet();
      const walletAddress = accounts[0];

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      login(data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-[#6366F1] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[#64748B]">Loading...</p>
        </div>
      </div>
    );
  }

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Create account</h1>
            <p className="text-[#64748B] text-sm">Join AlgoSplit and start splitting bills</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-[#6366F1] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
              }`}>
                1
              </div>
              <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-[#6366F1]' : 'bg-[#E2E8F0]'}`} />
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-[#6366F1] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
              }`}>
                2
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
              <p className="text-[#DC2626] text-sm">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#0F172A] mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#0F172A] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#6366F1] text-white py-3 rounded-lg font-medium hover:bg-[#4F46E5] mt-6 shadow-sm"
              >
                Next
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-[#6366F1]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Connect your wallet</h3>
                <p className="text-[#64748B] text-sm">
                  Connect Pera Wallet to complete registration
                </p>
              </div>

              {accountAddress && (
                <div className="p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg">
                  <p className="text-[#16A34A] text-sm">
                    Connected: {accountAddress.slice(0, 8)}...{accountAddress.slice(-6)}
                  </p>
                </div>
              )}

              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="w-full bg-[#6366F1] text-white py-3 rounded-lg font-medium hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
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

              <button
                onClick={() => setStep(1)}
                className="w-full text-[#64748B] py-2 text-sm hover:text-[#0F172A]"
              >
                Back
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748B]">
              Already have an account?{' '}
              <button onClick={() => router.push('/login')} className="text-[#6366F1] hover:text-[#4F46E5]">
                Login
              </button>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

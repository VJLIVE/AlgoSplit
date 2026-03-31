'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, ArrowLeft, AlertCircle, User, Mail } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { connectWallet, accountAddress } = useWallet();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#E5E7EB] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-[#1F2937] border border-[#374151] rounded-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#E5E7EB] mb-1">Create account</h1>
            <p className="text-[#9CA3AF] text-sm">Join AlgoSplit and start splitting bills</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-[#6366F1] text-white' : 'bg-[#374151] text-[#9CA3AF]'
              }`}>
                1
              </div>
              <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-[#6366F1]' : 'bg-[#374151]'}`} />
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-[#6366F1] text-white' : 'bg-[#374151] text-[#9CA3AF]'
              }`}>
                2
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <p className="text-[#EF4444] text-sm">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#9CA3AF] focus:border-[#6366F1] focus:outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#9CA3AF] focus:border-[#6366F1] focus:outline-none"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#6366F1] text-white py-3 rounded-lg font-medium hover:bg-[#5558E3] mt-6"
              >
                Next
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-[#6366F1]" />
                </div>
                <h3 className="text-lg font-semibold text-[#E5E7EB] mb-2">Connect your wallet</h3>
                <p className="text-[#9CA3AF] text-sm">
                  Connect Pera Wallet to complete registration
                </p>
              </div>

              {accountAddress && (
                <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg">
                  <p className="text-[#22C55E] text-sm">
                    Connected: {accountAddress.slice(0, 8)}...{accountAddress.slice(-6)}
                  </p>
                </div>
              )}

              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="w-full bg-[#6366F1] text-white py-3 rounded-lg font-medium hover:bg-[#5558E3] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="w-full text-[#9CA3AF] py-2 text-sm hover:text-[#E5E7EB]"
              >
                Back
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-[#9CA3AF]">
              Already have an account?{' '}
              <button onClick={() => router.push('/login')} className="text-[#6366F1] hover:text-[#5558E3]">
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

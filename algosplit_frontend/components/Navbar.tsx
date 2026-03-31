'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-[#1F2937] border-b border-[#374151]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#E5E7EB]">AlgoSplit</span>
          </button>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3 px-4 py-2 bg-[#111827] border border-[#374151] rounded-lg">
                <User className="w-4 h-4 text-[#9CA3AF]" />
                <div className="text-sm">
                  <div className="text-[#E5E7EB] font-medium">{user.name}</div>
                  <div className="text-[#9CA3AF] text-xs">
                    {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#111827] rounded-lg border border-[#374151] hover:border-[#4B5563]"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

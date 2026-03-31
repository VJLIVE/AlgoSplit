'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const scrollToSection = (sectionId: string) => {
    // If we're not on the homepage, navigate there first
    if (window.location.pathname !== '/') {
      router.push(`/#${sectionId}`);
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <button 
            onClick={() => router.push(user ? '/dashboard' : '/')}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#0F172A]">AlgoSplit</span>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <User className="w-4 h-4 text-[#64748B]" />
                  <div className="text-sm">
                    <div className="text-[#0F172A] font-medium">{user.name}</div>
                    <div className="text-[#64748B] text-xs">
                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1]"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => scrollToSection('home')} className="text-[#475569] hover:text-[#0F172A]">
                  Home
                </button>
                <button onClick={() => scrollToSection('features')} className="text-[#475569] hover:text-[#0F172A]">
                  Features
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-[#475569] hover:text-[#0F172A]">
                  How It Works
                </button>
                <button 
                  onClick={() => router.push('/login')}
                  className="text-[#475569] hover:text-[#0F172A]"
                >
                  Login
                </button>
                <button 
                  onClick={() => router.push('/signup')}
                  className="px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] shadow-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#475569]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-[#E2E8F0]">
            {user ? (
              <>
                <div className="px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg mx-4">
                  <div className="text-sm">
                    <div className="text-[#0F172A] font-medium">{user.name}</div>
                    <div className="text-[#64748B] text-xs">
                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-[#475569] hover:text-[#0F172A]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => scrollToSection('home')} className="block w-full text-left px-4 py-2 text-[#475569] hover:text-[#0F172A]">
                  Home
                </button>
                <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-[#475569] hover:text-[#0F172A]">
                  Features
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-4 py-2 text-[#475569] hover:text-[#0F172A]">
                  How It Works
                </button>
                <button onClick={() => router.push('/login')} className="block w-full text-left px-4 py-2 text-[#475569] hover:text-[#0F172A]">
                  Login
                </button>
                <button onClick={() => router.push('/signup')} className="block w-full text-left px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] shadow-sm">
                  Sign Up
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

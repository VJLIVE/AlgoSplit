'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Users, 
  Shield, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-[#0F172A]/80 backdrop-blur-sm z-50 border-b border-[#374151]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-[#E5E7EB]">AlgoSplit</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection('home')} className="text-[#9CA3AF] hover:text-[#E5E7EB]">
                Home
              </button>
              <button onClick={() => scrollToSection('features')} className="text-[#9CA3AF] hover:text-[#E5E7EB]">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-[#9CA3AF] hover:text-[#E5E7EB]">
                How It Works
              </button>
              <button 
                onClick={() => router.push('/login')}
                className="text-[#9CA3AF] hover:text-[#E5E7EB]"
              >
                Login
              </button>
              <button 
                onClick={() => router.push('/signup')}
                className="px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#5558E3]"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#9CA3AF]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 border-t border-[#374151]">
              <button onClick={() => scrollToSection('home')} className="block w-full text-left px-4 py-2 text-[#9CA3AF] hover:text-[#E5E7EB]">
                Home
              </button>
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-[#9CA3AF] hover:text-[#E5E7EB]">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-4 py-2 text-[#9CA3AF] hover:text-[#E5E7EB]">
                How It Works
              </button>
              <button onClick={() => router.push('/login')} className="block w-full text-left px-4 py-2 text-[#9CA3AF] hover:text-[#E5E7EB]">
                Login
              </button>
              <button onClick={() => router.push('/signup')} className="block w-full text-left px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#5558E3]">
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-[#E5E7EB] mb-4 leading-tight">
              Split bills on Algorand
            </h1>
            <p className="text-xl text-[#9CA3AF] mb-8 leading-relaxed">
              Transparent, instant settlements powered by smart contracts. 
              No more IOUs or awkward reminders.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/signup')}
                className="px-6 py-3 bg-[#6366F1] text-white rounded-lg hover:bg-[#5558E3] font-medium inline-flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="px-6 py-3 border border-[#374151] text-[#E5E7EB] rounded-lg hover:border-[#4B5563] font-medium"
              >
                Learn More
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="p-6 bg-[#1F2937] border border-[#374151] rounded-lg">
              <div className="text-3xl font-bold text-[#E5E7EB] mb-1">~4.5s</div>
              <div className="text-[#9CA3AF]">Settlement time</div>
            </div>
            <div className="p-6 bg-[#1F2937] border border-[#374151] rounded-lg">
              <div className="text-3xl font-bold text-[#E5E7EB] mb-1">0.001 ALGO</div>
              <div className="text-[#9CA3AF]">Transaction fee</div>
            </div>
            <div className="p-6 bg-[#1F2937] border border-[#374151] rounded-lg">
              <div className="text-3xl font-bold text-[#E5E7EB] mb-1">100%</div>
              <div className="text-[#9CA3AF]">On-chain transparency</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-[#111827]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-3">
              Why AlgoSplit?
            </h2>
            <p className="text-lg text-[#9CA3AF] max-w-2xl">
              Built on Algorand for security, speed, and transparency
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Wallet className="w-6 h-6 text-[#6366F1]" />,
                title: "Wallet-based auth",
                description: "Connect your Pera Wallet. No passwords, no hassle."
              },
              {
                icon: <Shield className="w-6 h-6 text-[#6366F1]" />,
                title: "Smart contracts",
                description: "All transactions secured by Algorand smart contracts."
              },
              {
                icon: <Zap className="w-6 h-6 text-[#6366F1]" />,
                title: "Instant settlement",
                description: "Payments confirmed in seconds, not days."
              },
              {
                icon: <Users className="w-6 h-6 text-[#6366F1]" />,
                title: "Easy splitting",
                description: "Split equally or customize shares for each member."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-[#1F2937] border border-[#374151] rounded-lg hover:border-[#4B5563]"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-[#E5E7EB] mb-2">{feature.title}</h3>
                <p className="text-[#9CA3AF]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-3">
              How it works
            </h2>
            <p className="text-lg text-[#9CA3AF] max-w-2xl">
              Three simple steps to split bills
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "Connect wallet",
                description: "Sign up and connect your Pera Wallet. No email required."
              },
              {
                step: "02",
                title: "Create bill",
                description: "Add members, set shares, and create the bill. Smart contract handles the rest."
              },
              {
                step: "03",
                title: "Get paid",
                description: "Members pay their share directly to you. Instant settlement on-chain."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-6 p-6 bg-[#1F2937] border border-[#374151] rounded-lg"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg flex items-center justify-center">
                    <span className="text-[#6366F1] font-semibold">{step.step}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#E5E7EB] mb-2">{step.title}</h3>
                  <p className="text-[#9CA3AF]">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-6 bg-[#111827]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-4">
                About AlgoSplit
              </h2>
              <p className="text-[#9CA3AF] mb-6 leading-relaxed">
                A decentralized bill-splitting app built on Algorand blockchain. 
                Smart contracts ensure transparent, secure, and instant settlements.
              </p>
              <p className="text-[#9CA3AF] mb-8 leading-relaxed">
                No more awkward reminders or forgotten IOUs. Every transaction is recorded 
                on-chain with complete transparency.
              </p>
              <div className="space-y-3">
                {[
                  "Wallet-based authentication",
                  "Smart contract bill management",
                  "Instant payment settlement",
                  "Contact management",
                  "Real-time payment tracking"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                    <span className="text-[#9CA3AF]">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="p-6 bg-[#1F2937] border border-[#374151] rounded-lg">
                <div className="text-2xl font-bold text-[#E5E7EB] mb-1">4.5s</div>
                <div className="text-[#9CA3AF]">Block finality time</div>
              </div>
              <div className="p-6 bg-[#1F2937] border border-[#374151] rounded-lg">
                <div className="text-2xl font-bold text-[#E5E7EB] mb-1">0.001 ALGO</div>
                <div className="text-[#9CA3AF]">Transaction fee</div>
              </div>
              <div className="p-6 bg-[#1F2937] border border-[#374151] rounded-lg">
                <div className="text-2xl font-bold text-[#E5E7EB] mb-1">Carbon Negative</div>
                <div className="text-[#9CA3AF]">Environmentally friendly</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="p-12 bg-[#1F2937] border border-[#374151] rounded-lg text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-4">
              Ready to split bills the smart way?
            </h2>
            <p className="text-lg text-[#9CA3AF] mb-8">
              Join AlgoSplit and experience blockchain-powered bill splitting
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="px-6 py-3 bg-[#6366F1] text-white rounded-lg hover:bg-[#5558E3] font-medium inline-flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#374151] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-[#E5E7EB]">AlgoSplit</span>
              </div>
              <p className="text-[#9CA3AF] text-sm">
                Decentralized bill splitting on Algorand
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#E5E7EB] mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-[#9CA3AF]">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-[#E5E7EB]">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#E5E7EB]">How It Works</button></li>
                <li><button onClick={() => router.push('/signup')} className="hover:text-[#E5E7EB]">Sign Up</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#E5E7EB] mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-[#9CA3AF]">
                <li><a href="https://developer.algorand.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#E5E7EB]">Algorand Docs</a></li>
                <li><a href="https://perawallet.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#E5E7EB]">Pera Wallet</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#E5E7EB] mb-3">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="text-[#9CA3AF] hover:text-[#E5E7EB]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="text-[#9CA3AF] hover:text-[#E5E7EB]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#374151] pt-6 text-center text-sm text-[#9CA3AF]">
            <p>&copy; 2026 AlgoSplit. Built on Algorand Testnet.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

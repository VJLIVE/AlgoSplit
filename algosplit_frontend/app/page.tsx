'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Users, 
  Shield, 
  Zap, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function Home() {
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="pb-32 px-6 relative overflow-hidden">
        {/* Subtle background glow - only on right side */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6366F1]/[0.03] rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-7 pt-8"
            >
              <div className="inline-block px-3 py-1 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-[#6366F1] text-sm font-medium mb-6">
                Built on Algorand
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#0F172A] mb-6 leading-[1.1]">
                Split bills<br />
                <span className="text-[#6366F1]">on-chain</span>
              </h1>
              
              <p className="text-xl text-[#475569] mb-8 max-w-lg leading-relaxed">
                No more IOUs. No more awkward reminders. Just transparent, instant settlements powered by smart contracts.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={() => router.push('/signup')}
                  className="px-8 py-4 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] font-medium inline-flex items-center justify-center gap-2 group shadow-sm"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="px-8 py-4 border border-[#E2E8F0] text-[#0F172A] bg-white rounded-lg hover:border-[#CBD5E1] font-medium"
                >
                  How it works
                </button>
              </div>

              {/* Stats - Anchored with Hierarchy */}
              <div className="pt-6 mt-2">
                {/* Primary Stat */}
                <div className="mb-6">
                  <div className="text-5xl font-bold text-[#0F172A] mb-2">~4.5s</div>
                  <div className="text-base text-[#64748B]">Average settlement time on Algorand</div>
                </div>
                
                {/* Secondary Stats - Horizontal */}
                <div className="flex gap-12 pl-1">
                  <div>
                    <div className="text-xl font-semibold text-[#0F172A] mb-1">0.001 ALGO</div>
                    <div className="text-sm text-[#64748B]">Transaction fee</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-[#0F172A] mb-1">100%</div>
                    <div className="text-sm text-[#64748B]">Transparent</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <div className="relative">
                {/* Background glow for card - very subtle */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/[0.04] to-[#8B5CF6]/[0.04] rounded-2xl blur-2xl"></div>
                
                {/* Main Card */}
                <div className="relative bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#6366F1] rounded-lg flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-[#64748B]">Bill #1</div>
                        <div className="text-[#0F172A] font-semibold">Dinner Split</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg text-[#D97706] text-xs font-medium">
                      Pending
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-sm text-[#64748B] mb-2">Total Amount</div>
                    <div className="text-4xl font-bold text-[#0F172A]">5.000000 ALGO</div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-[#6366F1]" />
                        </div>
                        <div>
                          <div className="text-sm text-[#0F172A]">Alice</div>
                          <div className="text-xs text-[#64748B]">2.500000 ALGO</div>
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-[#DCFCE7] border border-[#BBF7D0] rounded text-[#16A34A] text-xs">
                        Paid
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-[#6366F1]" />
                        </div>
                        <div>
                          <div className="text-sm text-[#0F172A]">Bob</div>
                          <div className="text-xs text-[#64748B]">2.500000 ALGO</div>
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-[#FEF3C7] border border-[#FDE68A] rounded text-[#D97706] text-xs">
                        Pending
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                    <div className="text-sm text-[#64748B]">2 members • 1 paid</div>
                    <div className="text-xs text-[#6366F1] font-medium">View Details →</div>
                  </div>
                </div>

                {/* Floating accent card */}
                <div className="absolute -bottom-6 -right-6 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                    </div>
                    <div>
                      <div className="text-xs text-[#64748B]">Settled in</div>
                      <div className="text-sm font-semibold text-[#0F172A]">4.5 seconds</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Asymmetrical Layout */}
      <section id="features" className="py-24 px-6 bg-[#F1F5F9]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-3">
              Why AlgoSplit?
            </h2>
            <p className="text-lg text-[#475569] max-w-2xl">
              Built on Algorand for security, speed, and transparency
            </p>
          </motion.div>

          {/* Asymmetrical Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Primary Feature - Larger */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="md:col-span-7 p-8 bg-white border border-[#E2E8F0] rounded-xl shadow-sm"
            >
              <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center mb-5">
                <Shield className="w-5 h-5 text-[#6366F1]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#0F172A] mb-3">Smart contracts</h3>
              <p className="text-[#475569] leading-relaxed">
                All transactions secured by Algorand smart contracts. Every payment is recorded on-chain with complete transparency and immutability.
              </p>
            </motion.div>

            {/* Secondary Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="md:col-span-5 p-6 bg-white border border-[#E2E8F0] rounded-lg shadow-sm"
            >
              <div className="w-9 h-9 bg-[#EEF2FF] rounded-lg flex items-center justify-center mb-4">
                <Wallet className="w-5 h-5 text-[#6366F1]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Wallet-based auth</h3>
              <p className="text-[#475569] text-sm">
                Connect your Pera Wallet. No passwords, no hassle.
              </p>
            </motion.div>

            {/* Tertiary Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
              className="md:col-span-5 p-6 bg-white border border-[#E2E8F0] rounded-lg shadow-sm mt-2"
            >
              <div className="w-9 h-9 bg-[#EEF2FF] rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-[#6366F1]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Instant settlement</h3>
              <p className="text-[#475569] text-sm">
                Payments confirmed in seconds, not days.
              </p>
            </motion.div>

            {/* Quaternary Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="md:col-span-7 p-6 bg-white border border-[#E2E8F0] rounded-lg shadow-sm mt-2"
            >
              <div className="w-9 h-9 bg-[#EEF2FF] rounded-lg flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-[#6366F1]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Easy splitting</h3>
              <p className="text-[#475569] text-sm">
                Split equally or customize shares for each member. Add contacts for quick access.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Product Journey Flow */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-3">
              How it works
            </h2>
            <p className="text-lg text-[#475569] max-w-2xl">
              From wallet to settlement in three steps
            </p>
          </motion.div>

          {/* Staggered Journey Flow */}
          <div className="relative space-y-12 md:space-y-0">
            {/* Step 1 - Top Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="md:ml-0 md:mr-auto md:w-[380px]"
            >
              <div className="relative">
                <div className="flex items-start gap-4 p-6 bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-[#6366F1]" />
                  </div>
                  <div>
                    <div className="text-xs text-[#6366F1] font-medium mb-2">STEP 1</div>
                    <h3 className="text-xl font-semibold text-[#0F172A] mb-2">Connect wallet</h3>
                    <p className="text-[#475569] text-sm leading-relaxed mb-3">
                      Sign up and connect your Pera Wallet. No email required.
                    </p>
                    <div className="text-xs text-[#6366F1] font-medium">→ Takes 30 seconds</div>
                  </div>
                </div>
                {/* Connector arrow */}
                <div className="hidden md:block absolute -bottom-8 right-0 translate-x-12">
                  <ArrowRight className="w-16 h-16 text-[#6366F1] rotate-45" />
                </div>
              </div>
            </motion.div>

            {/* Step 2 - Middle Right */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="md:ml-auto md:mr-0 md:w-[420px] md:mt-16"
            >
              <div className="relative">
                <div className="flex items-start gap-4 p-6 bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#6366F1]" />
                  </div>
                  <div>
                    <div className="text-xs text-[#6366F1] font-medium mb-2">STEP 2</div>
                    <h3 className="text-xl font-semibold text-[#0F172A] mb-2">Create bill</h3>
                    <p className="text-[#475569] text-sm leading-relaxed mb-3">
                      Add members, set shares, and create the bill. Smart contract handles the rest.
                    </p>
                    <div className="text-xs text-[#6366F1] font-medium">→ Split equally or customize</div>
                  </div>
                </div>
                {/* Connector arrow */}
                <div className="hidden md:block absolute -bottom-10 left-0 -translate-x-12">
                  <ArrowRight className="w-16 h-16 text-[#6366F1] rotate-[135deg]" />
                </div>
              </div>
            </motion.div>

            {/* Step 3 - Bottom Center (Prominent) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="md:mx-auto md:w-[480px] md:mt-20"
            >
              <div className="relative">
                {/* Glow effect for final step - very subtle */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/[0.04] to-[#8B5CF6]/[0.04] rounded-2xl blur-xl"></div>
                
                <div className="relative flex items-start gap-5 p-8 bg-white border border-[#C7D2FE] rounded-2xl shadow-sm">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#EEF2FF] rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#6366F1]" />
                  </div>
                  <div>
                    <div className="text-xs text-[#6366F1] font-medium mb-2">STEP 3</div>
                    <h3 className="text-2xl font-semibold text-[#0F172A] mb-3">Get paid</h3>
                    <p className="text-[#475569] leading-relaxed mb-4">
                      Members pay their share directly to you. Instant settlement on-chain.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg">
                        <span className="text-[#16A34A] text-xs font-medium">Settled in ~4.5s</span>
                      </div>
                      <div className="px-3 py-1 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg">
                        <span className="text-[#6366F1] text-xs font-medium">0.001 ALGO fee</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section - Product Narrative */}
      <section className="py-24 px-6 bg-[#F1F5F9]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-7"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-8">
                Why we built this
              </h2>
              
              <div className="space-y-6 text-[#475569] leading-relaxed">
                <p className="text-lg">
                  Splitting bills shouldn&apos;t require trust.
                </p>
                
                <p>
                  You pay for dinner. Your friends say they&apos;ll send you money later. 
                  Days pass. You send a reminder. It feels awkward. They finally pay, 
                  but you&apos;ve already spent mental energy tracking who owes what.
                </p>
                
                <p>
                  We built AlgoSplit to remove that friction entirely.
                </p>
                
                <p>
                  Every bill is a smart contract on Algorand. When someone owes you money, 
                  it&apos;s recorded on-chain. When they pay, it settles in <span className="text-[#0F172A] font-semibold">4.5 seconds</span>. 
                  No reminders. No awkward conversations. No trust required.
                </p>
                
                <div className="pt-6 mt-2">
                  <p className="text-[#0F172A] font-medium mb-4">
                    The entire system runs on transparency:
                  </p>
                  <div className="space-y-3 pl-4 border-l-2 border-[#6366F1]/30">
                    <p className="text-sm">
                      You create a bill. Members see exactly what they owe.
                    </p>
                    <p className="text-sm">
                      They pay directly to you. No middleman, no escrow.
                    </p>
                    <p className="text-sm">
                      Everything is recorded on Algorand. Immutable and verifiable.
                    </p>
                  </div>
                </div>
                
                <p className="pt-4">
                  This isn&apos;t just another payment app. It&apos;s a new way to handle shared expenses 
                  where the blockchain does the heavy lifting.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-5 space-y-8"
            >
              {/* Integrated Stats */}
              <div className="pt-8">
                <div className="mb-12">
                  <div className="text-sm text-[#6366F1] font-medium mb-2">Settlement Speed</div>
                  <div className="text-5xl font-bold text-[#0F172A] mb-3">4.5s</div>
                  <div className="text-[#475569] text-sm leading-relaxed">
                    Algorand&apos;s block finality means payments are confirmed almost instantly. 
                    No waiting days for bank transfers.
                  </div>
                </div>
                
                <div className="mb-12 pl-6">
                  <div className="text-sm text-[#6366F1] font-medium mb-2">Transaction Cost</div>
                  <div className="text-3xl font-semibold text-[#0F172A] mb-3">0.001 ALGO</div>
                  <div className="text-[#475569] text-sm leading-relaxed">
                    Roughly $0.0002 per transaction. Compare that to traditional payment processors.
                  </div>
                </div>
                
                <div className="pl-12">
                  <div className="text-sm text-[#6366F1] font-medium mb-2">Environmental Impact</div>
                  <div className="text-2xl font-semibold text-[#0F172A] mb-3">Carbon Negative</div>
                  <div className="text-[#475569] text-sm leading-relaxed">
                    Algorand is carbon negative. Every transaction helps offset emissions.
                  </div>
                </div>
              </div>
              
              {/* Trust Indicator */}
              <div className="p-6 bg-white border border-[#E2E8F0] rounded-xl border-l-2 border-l-[#6366F1] shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <Shield className="w-5 h-5 text-[#6366F1] flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-[#0F172A] font-medium mb-2">Built on Algorand</div>
                    <div className="text-[#475569] text-sm leading-relaxed">
                      Smart contracts are auditable, immutable, and run exactly as programmed. 
                      No one can change the rules after a bill is created.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section - Impactful & Intentional */}
      <section className="py-20 px-6 bg-[#EEF2FF]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative p-10 bg-white border border-[#C7D2FE] rounded-xl shadow-sm">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-3">
                  Stop chasing payments
                </h2>
                <p className="text-lg text-[#475569] mb-8 leading-relaxed">
                  Let smart contracts handle the awkward part. Create your first bill in under a minute.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => router.push('/signup')}
                    className="px-6 py-3 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] font-medium inline-flex items-center justify-center gap-2 group shadow-sm"
                  >
                    Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-3 text-[#0F172A] hover:text-[#6366F1] font-medium"
                  >
                    Already have an account?
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-[#0F172A]">AlgoSplit</span>
              </div>
              <p className="text-[#64748B] text-sm">
                Decentralized bill splitting on Algorand
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#0F172A] mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-[#0F172A]">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#0F172A]">How It Works</button></li>
                <li><button onClick={() => router.push('/signup')} className="hover:text-[#0F172A]">Sign Up</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#0F172A] mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li><a href="https://developer.algorand.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#0F172A]">Algorand Docs</a></li>
                <li><a href="https://perawallet.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#0F172A]">Pera Wallet</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#0F172A] mb-3">Connect</h4>
              <div className="flex gap-3">
                <a href="https://github.com/VJLIVE/AlgoSplit" className="text-[#64748B] hover:text-[#0F172A]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] pt-6 text-center text-sm text-[#64748B]">
            <p>&copy; 2026 AlgoSplit. Built on Algorand Testnet.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

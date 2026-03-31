'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Plus, Users, FileText, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { getUserBills, getBill, getMember, getBillsCreatedBy, Bill, Member } from '@/lib/contract';
import { formatAlgoAmount, shortenAddress } from '@/lib/algorand';

interface BillWithDetails extends Bill {
  id: number;
  memberDetails?: Member;
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'created'>('pending');
  const [bills, setBills] = useState<BillWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchBills();
    }
  }, [user]);

  const fetchBills = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const memberBillIds = await getUserBills(user.walletAddress);
      const createdBillIds = await getBillsCreatedBy(user.walletAddress);
      const allBillIds = Array.from(new Set([...memberBillIds, ...createdBillIds]));
      
      const billsWithDetails: BillWithDetails[] = [];
      
      for (const billId of allBillIds) {
        const bill = await getBill(billId);
        if (!bill) continue;

        let memberDetails: Member | undefined;
        if (memberBillIds.includes(billId)) {
          const details = await getMember(billId, user.walletAddress);
          memberDetails = details || undefined;
        }

        billsWithDetails.push({
          id: billId,
          ...bill,
          memberDetails,
        });
      }

      setBills(billsWithDetails);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter((bill) => {
    if (activeTab === 'pending') {
      return bill.memberDetails && !bill.memberDetails.paid && !bill.isSettled;
    } else if (activeTab === 'completed') {
      return bill.memberDetails && bill.memberDetails.paid;
    } else {
      return bill.creator === user?.walletAddress;
    }
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6366F1] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#E5E7EB] mb-2">Dashboard</h2>
          <p className="text-[#9CA3AF]">Manage your split bills and payments</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/create-bill')}
            className="p-6 bg-[#1F2937] border border-[#374151] rounded-lg hover:border-[#6366F1] text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg flex items-center justify-center group-hover:bg-[#6366F1]/20">
                <Plus className="w-6 h-6 text-[#6366F1]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#E5E7EB] mb-1">Create Bill</h3>
                <p className="text-sm text-[#9CA3AF]">Split a new bill</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/contacts')}
            className="p-6 bg-[#1F2937] border border-[#374151] rounded-lg hover:border-[#4B5563] text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-[#22C55E]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#E5E7EB] mb-1">Contacts</h3>
                <p className="text-sm text-[#9CA3AF]">Manage contacts</p>
              </div>
            </div>
          </button>

          <div className="p-6 bg-[#1F2937] border border-[#374151] rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#E5E7EB] mb-1">Total Bills</h3>
                <p className="text-2xl font-bold text-[#E5E7EB]">{bills.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#1F2937] border border-[#374151] rounded-lg">
          <div className="border-b border-[#374151]">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'pending'
                    ? 'border-[#6366F1] text-[#6366F1]'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#E5E7EB]'
                }`}
              >
                Pending Payments
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'completed'
                    ? 'border-[#6366F1] text-[#6366F1]'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#E5E7EB]'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setActiveTab('created')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'created'
                    ? 'border-[#6366F1] text-[#6366F1]'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#E5E7EB]'
                }`}
              >
                Created by Me
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6366F1] border-t-transparent mx-auto mb-4"></div>
                <p className="text-[#9CA3AF]">Loading bills...</p>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#374151] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-[#9CA3AF]" />
                </div>
                <h3 className="text-lg font-semibold text-[#E5E7EB] mb-2">No bills yet</h3>
                <p className="text-[#9CA3AF] mb-4">
                  {activeTab === 'pending' && "You don't have any pending payments"}
                  {activeTab === 'completed' && "You haven't completed any payments yet"}
                  {activeTab === 'created' && "You haven't created any bills yet"}
                </p>
                {activeTab === 'created' && (
                  <button
                    onClick={() => router.push('/dashboard/create-bill')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#5558E3]"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Bill
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBills.map((bill) => (
                  <button
                    key={bill.id}
                    onClick={() => router.push(`/dashboard/bills/${bill.id}`)}
                    className="w-full border border-[#374151] rounded-lg p-4 hover:border-[#4B5563] text-left"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-[#E5E7EB] mb-1">Bill #{bill.id}</h3>
                        <p className="text-sm text-[#9CA3AF]">
                          Creator: {shortenAddress(bill.creator)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-[#E5E7EB]">
                          <DollarSign className="w-4 h-4" />
                          {formatAlgoAmount(Number(bill.totalAmount))} ALGO
                        </div>
                        {bill.memberDetails && (
                          <p className="text-sm text-[#9CA3AF]">
                            Your share: {formatAlgoAmount(Number(bill.memberDetails.share))} ALGO
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
                        <span>{Number(bill.memberCount)} members</span>
                        <span>•</span>
                        <span>{Number(bill.settledCount)} paid</span>
                      </div>

                      {bill.memberDetails && (
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            bill.memberDetails.paid
                              ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                              : 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20'
                          }`}
                        >
                          {bill.memberDetails.paid ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Paid
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </span>
                      )}

                      {bill.isSettled && (
                        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20">
                          Settled
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

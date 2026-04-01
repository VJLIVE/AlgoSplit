'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  PieChart,
  BarChart3
} from 'lucide-react';
import { getUserBills, getBill, getMember, getBillsCreatedBy } from '@/lib/contract';
import { formatAlgoAmount } from '@/lib/algorand';
import algosdk from 'algosdk';

interface BillData {
  id: number;
  totalAmount: bigint;
  creator: string;
  isSettled: boolean;
  memberCount: bigint;
  settledCount: bigint;
  createdAt?: Date;
  paidAt?: Date;
  userShare?: bigint;
  userPaid?: boolean;
}

interface TimeSeriesData {
  date: string;
  spent: number;
  received: number;
  displayDate: string;
}

export default function AnalyticsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  
  // Stats
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [totalBills, setTotalBills] = useState(0);
  const [billsCreated, setBillsCreated] = useState(0);
  const [billsPaid, setBillsPaid] = useState(0);
  const [averageBillAmount, setAverageBillAmount] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Initialize Algorand indexer client for transaction history
      const indexerToken = '';
      const indexerServer = 'https://testnet-idx.4160.nodely.dev';
      const indexerPort = 443;
      const indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);
      
      const memberBillIds = await getUserBills(user.walletAddress);
      const createdBillIds = await getBillsCreatedBy(user.walletAddress);
      const allBillIds = Array.from(new Set([...memberBillIds, ...createdBillIds]));
      
      console.log('User wallet:', user.walletAddress);
      console.log('Member bill IDs:', memberBillIds);
      console.log('Created bill IDs:', createdBillIds);
      console.log('All bill IDs:', allBillIds);
      
      // Debug: Check bill #1 specifically
      if (allBillIds.includes(1)) {
        console.log('\n=== Debugging Bill #1 ===');
        const bill1 = await getBill(1);
        if (bill1) {
          console.log('Bill #1 Creator:', bill1.creator);
          console.log('Bill #1 Total Amount:', Number(bill1.totalAmount) / 1_000_000, 'ALGO');
          console.log('Bill #1 Member Count:', Number(bill1.memberCount));
          console.log('Bill #1 Settled Count:', Number(bill1.settledCount));
          console.log('Bill #1 Is Settled:', bill1.isSettled);
          
          // Try to get member data for current user
          try {
            const memberData = await getMember(1, user.walletAddress);
            console.log('Current user as member of Bill #1:', memberData);
            if (memberData) {
              console.log('  - Share:', Number(memberData.share) / 1_000_000, 'ALGO');
              console.log('  - Paid:', memberData.paid);
            }
          } catch (error) {
            console.log('Current user is NOT a member of Bill #1:', error);
          }
          
          // Get all members of bill #1
          try {
            const { getBillMembers } = await import('@/lib/contract');
            const members = await getBillMembers(1);
            console.log('All members of Bill #1:', members);
            
            for (const memberAddr of members) {
              const memberInfo = await getMember(1, memberAddr);
              if (memberInfo) {
                console.log(`  Member ${memberAddr}:`, {
                  share: Number(memberInfo.share) / 1_000_000,
                  paid: memberInfo.paid
                });
              }
            }
          } catch (error) {
            console.log('Failed to get bill members:', error);
          }
        }
        console.log('=== End Bill #1 Debug ===\n');
      }
      
      const billsData: BillData[] = [];
      let spent = 0;
      let received = 0;
      let paidCount = 0;
      
      // Map to track spending/receiving by date
      const dateMap = new Map<string, { spent: number; received: number }>();
      
      for (const billId of allBillIds) {
        const bill = await getBill(billId);
        if (!bill) continue;

        console.log(`\nProcessing Bill #${billId}:`);
        console.log('Creator:', bill.creator);
        console.log('User is creator:', bill.creator === user.walletAddress);

        const isCreator = bill.creator === user.walletAddress;
        let userShare: bigint | undefined;
        let userPaid: boolean | undefined;
        let createdAt: Date | undefined;
        let paidAt: Date | undefined;

        try {
          // Get bill creation transaction (app call with create_bill method)
          const appId = 757829563;
          const txns = await indexerClient.searchForTransactions()
            .applicationID(appId)
            .txType('appl')
            .limit(1000)
            .do();
          
          // Find the create_bill transaction for this bill ID
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const createTxn = txns.transactions.find((txn: any) => {
            if (txn['application-transaction']?.['application-args']?.[0]) {
              const methodSelector = Buffer.from(txn['application-transaction']['application-args'][0], 'base64').toString('hex');
              // create_bill method selector
              return methodSelector.startsWith('c4d66de8') && txn.sender === bill.creator;
            }
            return false;
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((createTxn as any)?.['round-time']) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            createdAt = new Date((createTxn as any)['round-time'] * 1000);
          }
        } catch (error) {
          console.error(`Failed to fetch creation time for bill ${billId}:`, error);
        }

        if (!isCreator) {
          const memberData = await getMember(billId, user.walletAddress);
          console.log('Member data:', memberData);
          if (memberData) {
            userShare = memberData.share;
            userPaid = memberData.paid;
            
            console.log('User share:', Number(memberData.share) / 1_000_000, 'ALGO');
            console.log('User paid:', memberData.paid);
            
            if (memberData.paid) {
              const amount = Number(memberData.share) / 1_000_000;
              spent += amount;
              paidCount++;
              
              console.log('Adding to spent:', amount);
              
              // Try to get payment date
              try {
                const appId = 757829563;
                const txns = await indexerClient.searchForTransactions()
                  .applicationID(appId)
                  .address(user.walletAddress)
                  .txType('appl')
                  .limit(1000)
                  .do();
                
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const payTxn = txns.transactions.find((txn: any) => {
                  if (txn['application-transaction']?.['application-args']?.[0]) {
                    const methodSelector = Buffer.from(txn['application-transaction']['application-args'][0], 'base64').toString('hex');
                    // pay_bill method selector
                    return methodSelector.startsWith('b7e2d6d0');
                  }
                  return false;
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((payTxn as any)?.['round-time']) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  paidAt = new Date((payTxn as any)['round-time'] * 1000);
                  const dateKey = paidAt.toISOString().split('T')[0];
                  const existing = dateMap.get(dateKey) || { spent: 0, received: 0 };
                  dateMap.set(dateKey, { ...existing, spent: existing.spent + amount });
                  console.log('Payment date found:', paidAt);
                } else {
                  console.log('No payment transaction found in indexer');
                  // Add to today's date as fallback
                  const today = new Date();
                  const dateKey = today.toISOString().split('T')[0];
                  const existing = dateMap.get(dateKey) || { spent: 0, received: 0 };
                  dateMap.set(dateKey, { ...existing, spent: existing.spent + amount });
                }
              } catch (error) {
                console.error(`Failed to fetch payment time for bill ${billId}:`, error);
                // Add to today's date as fallback
                const today = new Date();
                const dateKey = today.toISOString().split('T')[0];
                const existing = dateMap.get(dateKey) || { spent: 0, received: 0 };
                dateMap.set(dateKey, { ...existing, spent: existing.spent + amount });
              }
            }
          }
        } else {
          // Creator - check each member's payment
          console.log('Creator - Checking member payments');
          
          try {
            const { getBillMembers } = await import('@/lib/contract');
            const members = await getBillMembers(billId);
            console.log(`Bill #${billId} has ${members.length} members`);
            
            for (const memberAddr of members) {
              const memberInfo = await getMember(billId, memberAddr);
              if (memberInfo && memberInfo.paid) {
                const amount = Number(memberInfo.share) / 1_000_000;
                received += amount;
                
                console.log(`Member ${memberAddr} paid ${amount} ALGO`);
                
                // Try to get payment date for this member
                try {
                  const appId = 757829563;
                  const txns = await indexerClient.searchForTransactions()
                    .applicationID(appId)
                    .address(memberAddr)
                    .txType('appl')
                    .limit(1000)
                    .do();
                  
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const payTxn = txns.transactions.find((txn: any) => {
                    if (txn['application-transaction']?.['application-args']?.[0]) {
                      const methodSelector = Buffer.from(txn['application-transaction']['application-args'][0], 'base64').toString('hex');
                      // pay_bill method selector
                      return methodSelector.startsWith('b7e2d6d0');
                    }
                    return false;
                  });

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  if ((payTxn as any)?.['round-time']) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const paymentDate = new Date((payTxn as any)['round-time'] * 1000);
                    const dateKey = paymentDate.toISOString().split('T')[0];
                    const existing = dateMap.get(dateKey) || { spent: 0, received: 0 };
                    dateMap.set(dateKey, { ...existing, received: existing.received + amount });
                    console.log(`Payment date found: ${paymentDate}`);
                  } else {
                    // Add to today's date as fallback
                    const today = new Date();
                    const dateKey = today.toISOString().split('T')[0];
                    const existing = dateMap.get(dateKey) || { spent: 0, received: 0 };
                    dateMap.set(dateKey, { ...existing, received: existing.received + amount });
                  }
                } catch (error) {
                  console.error(`Failed to fetch payment time for member ${memberAddr}:`, error);
                  // Add to today's date as fallback
                  const today = new Date();
                  const dateKey = today.toISOString().split('T')[0];
                  const existing = dateMap.get(dateKey) || { spent: 0, received: 0 };
                  dateMap.set(dateKey, { ...existing, received: existing.received + amount });
                }
              }
            }
          } catch (error) {
            console.error(`Failed to get members for bill ${billId}:`, error);
          }
        }

        billsData.push({
          id: billId,
          totalAmount: bill.totalAmount,
          creator: bill.creator,
          isSettled: bill.isSettled,
          memberCount: bill.memberCount,
          settledCount: bill.settledCount,
          createdAt,
          paidAt,
          userShare,
          userPaid,
        });
      }

      // Convert dateMap to sorted time series
      const sortedDates = Array.from(dateMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => ({
          date,
          spent: data.spent,
          received: data.received,
          displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

      console.log('Final stats:');
      console.log('Total spent:', spent);
      console.log('Total received:', received);
      console.log('Bills paid:', paidCount);
      console.log('Bills created:', createdBillIds.length);
      console.log('Time series data points:', sortedDates.length);
      console.log('Date map:', dateMap);

      setBills(billsData.sort((a, b) => b.id - a.id));
      setTimeSeriesData(sortedDates);
      setTotalSpent(spent);
      setTotalReceived(received);
      setTotalBills(allBillIds.length);
      setBillsCreated(createdBillIds.length);
      setBillsPaid(paidCount);
      setAverageBillAmount(allBillIds.length > 0 ? (spent + received) / allBillIds.length : 0);
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6366F1] border-t-transparent"></div>
      </div>
    );
  }

  const maxValue = Math.max(...timeSeriesData.map(d => Math.max(d.spent, d.received)), 1);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#0F172A] mb-2">Analytics & Insights</h2>
          <p className="text-[#64748B]">Track your spending patterns and bill history</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6366F1] border-t-transparent mx-auto mb-4"></div>
            <p className="text-[#64748B]">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#FEE2E2] rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#DC2626]" />
                  </div>
                  <div className="text-sm text-[#64748B]">Total Spent</div>
                </div>
                <div className="text-2xl font-bold text-[#0F172A]">
                  {totalSpent.toFixed(2)} ALGO
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  {billsPaid} bills paid
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#DCFCE7] rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#16A34A]" />
                  </div>
                  <div className="text-sm text-[#64748B]">Total Received</div>
                </div>
                <div className="text-2xl font-bold text-[#0F172A]">
                  {totalReceived.toFixed(2)} ALGO
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  {billsCreated} bills created
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#6366F1]" />
                  </div>
                  <div className="text-sm text-[#64748B]">Total Bills</div>
                </div>
                <div className="text-2xl font-bold text-[#0F172A]">
                  {totalBills}
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  All time
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <div className="text-sm text-[#64748B]">Avg Bill</div>
                </div>
                <div className="text-2xl font-bold text-[#0F172A]">
                  {averageBillAmount.toFixed(2)} ALGO
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  Per transaction
                </div>
              </div>
            </div>

            {/* Time Series Chart */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">Spending Over Time</h3>
                  <p className="text-sm text-[#64748B]">Daily spending and receiving activity</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#EF4444] rounded"></div>
                    <span className="text-[#64748B]">Spent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#10B981] rounded"></div>
                    <span className="text-[#64748B]">Received</span>
                  </div>
                </div>
              </div>

              {timeSeriesData.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
                  <p className="text-[#64748B]">No transaction data yet</p>
                  <p className="text-sm text-[#94A3B8] mt-1">Create or pay bills to see your spending patterns</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeSeriesData.map((data) => {
                    const total = data.spent + data.received;
                    const spentPercent = total > 0 ? (data.spent / total) * 100 : 0;
                    const receivedPercent = total > 0 ? (data.received / total) * 100 : 0;
                    
                    return (
                      <div key={data.date}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#0F172A] w-20">{data.displayDate}</span>
                          <div className="flex-1 mx-4">
                            <div className="relative h-10 bg-[#F8FAFC] rounded-lg overflow-hidden flex">
                              {data.spent > 0 && (
                                <div
                                  className="h-full bg-[#EF4444] transition-all"
                                  style={{ width: `${(data.spent / maxValue) * 100}%` }}
                                ></div>
                              )}
                              {data.received > 0 && (
                                <div
                                  className="h-full bg-[#10B981] transition-all"
                                  style={{ width: `${(data.received / maxValue) * 100}%` }}
                                ></div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-6 text-sm w-56 justify-end">
                            <div className="flex items-center gap-2">
                              <span className="text-[#64748B] text-xs">Spent:</span>
                              <span className="text-[#EF4444] font-medium">{data.spent.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#64748B] text-xs">Received:</span>
                              <span className="text-[#10B981] font-medium">{data.received.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Recent Bills</h3>
              {bills.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
                  <p className="text-[#64748B]">No bills yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bills.slice(0, 5).map((bill) => {
                    const isCreator = bill.creator === user.walletAddress;
                    return (
                      <button
                        key={bill.id}
                        onClick={() => router.push(`/dashboard/bills/${bill.id}`)}
                        className="w-full flex items-center justify-between p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg hover:border-[#CBD5E1] text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isCreator ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'
                          }`}>
                            {isCreator ? (
                              <DollarSign className="w-5 h-5 text-[#16A34A]" />
                            ) : (
                              <TrendingUp className="w-5 h-5 text-[#DC2626]" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-[#0F172A]">Bill #{bill.id}</div>
                            <div className="text-sm text-[#64748B]">
                              {isCreator ? 'Created by you' : 'You are a member'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[#0F172A]">
                            {formatAlgoAmount(Number(bill.totalAmount))} ALGO
                          </div>
                          <div className="text-xs text-[#64748B]">
                            {bill.isSettled ? 'Settled' : 'Pending'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

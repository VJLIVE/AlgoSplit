'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  ArrowLeft, 
  DollarSign, 
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  getBill, 
  getMember, 
  getBillMembers,
  payBillTransaction,
  cancelBillTransaction,
  Bill, 
  Member 
} from '@/lib/contract';
import { formatAlgoAmount, shortenAddress } from '@/lib/algorand';
import algosdk from 'algosdk';

interface MemberWithAddress {
  address: string;
  name?: string;
  share: bigint;
  paid: boolean;
}

export default function BillDetailsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { wallet, accountAddress } = useWallet();
  const router = useRouter();
  const params = useParams();
  const billId = parseInt(params.id as string);

  const [bill, setBill] = useState<Bill | null>(null);
  const [members, setMembers] = useState<MemberWithAddress[]>([]);
  const [userMember, setUserMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && billId) {
      fetchBillDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, billId]);

  const fetchBillDetails = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setNotFound(false);
      
      const billData = await getBill(billId);
      if (!billData) {
        setNotFound(true);
        return;
      }
      setBill(billData);

      const isUserCreator = billData.creator === user.walletAddress;

      let userMemberData: Member | null = null;
      if (!isUserCreator) {
        userMemberData = await getMember(billId, user.walletAddress);
        setUserMember(userMemberData);
      } else {
        setUserMember(null);
      }

      const memberAddresses = await getBillMembers(billId);
      const membersList: MemberWithAddress[] = [];
      
      for (const memberAddress of memberAddresses) {
        const memberData = await getMember(billId, memberAddress);
        if (memberData) {
          membersList.push({
            address: memberAddress,
            share: memberData.share,
            paid: memberData.paid,
          });
        }
      }

      if (membersList.length > 0) {
        try {
          const response = await fetch('/api/contacts', {
            headers: {
              'x-wallet-address': user.walletAddress,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const contacts = data.contacts || [];
            
            membersList.forEach(member => {
              const contact = contacts.find((c: { walletAddress: string; contactName: string }) => c.walletAddress === member.address);
              if (contact) {
                member.name = contact.contactName;
              }
            });
          }
        } catch (error) {
          console.error('Failed to fetch contact names:', error);
        }
      }

      setMembers(membersList);

    } catch (error) {
      console.error('Failed to fetch bill details:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!user || !bill || !userMember || !wallet || !accountAddress) return;

    try {
      setPaying(true);
      setError('');

      const { algodClient: algoClient } = await import('@/lib/algorand');
      const accountInfo = await algoClient.accountInformation(accountAddress).do();
      const balance = Number(accountInfo.amount);
      const accountData = accountInfo as unknown as Record<string, unknown>;
      const minBalance = Number(accountData['min-balance'] || 0);
      
      const shareAmount = Number(userMember.share);
      const estimatedFees = 2000;
      const requiredBalance = shareAmount + estimatedFees;
      const availableBalance = balance - minBalance;
      
      if (availableBalance < requiredBalance) {
        const requiredALGO = (requiredBalance / 1_000_000).toFixed(3);
        const availableALGO = (availableBalance / 1_000_000).toFixed(3);
        const minBalanceALGO = (minBalance / 1_000_000).toFixed(3);
        const totalBalanceALGO = (balance / 1_000_000).toFixed(3);
        throw new Error(
          `Insufficient balance!\n\n` +
          `Total balance: ${totalBalanceALGO} ALGO\n` +
          `Minimum required (locked): ${minBalanceALGO} ALGO\n` +
          `Available to spend: ${availableALGO} ALGO\n` +
          `Payment needed: ${requiredALGO} ALGO\n\n` +
          `You need to add at least ${((requiredBalance - availableBalance) / 1_000_000).toFixed(3)} ALGO to your wallet.`
        );
      }

      const txns = await payBillTransaction(
        accountAddress,
        billId,
        bill.creator,
        shareAmount
      );

      const txnsToSign = txns.map(txn => ({
        txn,
        signers: [accountAddress],
      }));

      const signedTxns = await wallet.signTransaction([txnsToSign]);
      const response = await algoClient.sendRawTransaction(signedTxns).do();
      await algosdk.waitForConfirmation(algoClient, response.txid, 4);

      await fetchBillDetails();
      setError('');
      alert('Payment successful! 🎉');

    } catch (error) {
      const err = error as Error;
      console.error('Payment failed:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!user || !bill || !wallet || !accountAddress) return;

    if (!confirm('Are you sure you want to cancel this bill? This action cannot be undone.')) {
      return;
    }

    try {
      setCancelling(true);
      setError('');

      const txn = await cancelBillTransaction(accountAddress, billId);

      const txnToSign = {
        txn,
        signers: [accountAddress],
      };

      const signedTxns = await wallet.signTransaction([[txnToSign]]);

      const { algodClient } = await import('@/lib/algorand');
      const response = await algodClient.sendRawTransaction(signedTxns).do();
      await algosdk.waitForConfirmation(algodClient, response.txid, 4);

      alert('Bill cancelled successfully');
      router.push('/dashboard');

    } catch (error) {
      const err = error as Error;
      console.error('Cancel failed:', err);
      setError(err.message || 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6366F1] border-t-transparent"></div>
      </div>
    );
  }

  if (notFound || !bill) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-[#DC2626]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Bill not found</h1>
            <p className="text-[#64748B] mb-6">
              The bill you&apos;re looking for doesn&apos;t exist or may have been deleted
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] shadow-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCreator = bill.creator === user.walletAddress;
  const canPay = userMember && !userMember.paid && !bill.isSettled;
  const canCancel = isCreator && !bill.isSettled && Number(bill.settledCount) === 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {error && (
          <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <p className="text-[#DC2626] text-sm whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* Bill Header */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Bill #{billId}</h1>
              <p className="text-[#64748B]">
                Created by: {isCreator ? 'You' : shortenAddress(bill.creator)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-3xl font-bold text-[#0F172A]">
                <DollarSign className="w-8 h-8" />
                {formatAlgoAmount(Number(bill.totalAmount))} ALGO
              </div>
              <p className="text-sm text-[#64748B] mt-1">Total Amount</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {bill.isSettled ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                <CheckCircle2 className="w-4 h-4" />
                Settled
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                <Clock className="w-4 h-4" />
                Pending
              </span>
            )}
            
            {userMember && (
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                userMember.paid
                  ? 'bg-[#EEF2FF] text-[#6366F1] border border-[#C7D2FE]'
                  : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
              }`}>
                {userMember.paid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    You paid
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    You haven&apos;t paid
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Bill Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-[#6366F1]" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Total Members</p>
                <p className="text-2xl font-bold text-[#0F172A]">{Number(bill.memberCount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#16A34A]" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Paid</p>
                <p className="text-2xl font-bold text-[#0F172A]">{Number(bill.settledCount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#D97706]" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Pending</p>
                <p className="text-2xl font-bold text-[#0F172A]">
                  {Number(bill.memberCount) - Number(bill.settledCount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Share */}
        {userMember && (
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">Your Share</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#64748B] mb-1">Amount to pay</p>
                <p className="text-3xl font-bold text-[#0F172A]">
                  {formatAlgoAmount(Number(userMember.share))} ALGO
                </p>
              </div>
              {canPay && (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="px-6 py-3 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                  {paying ? 'Processing...' : 'Pay Now'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#0F172A] mb-4">Members</h2>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
              <p className="text-[#64748B]">Loading member details...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.address}
                  className="flex justify-between items-center p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#0F172A]">
                      {member.name || shortenAddress(member.address)}
                    </p>
                    {member.name && (
                      <p className="text-xs text-[#64748B] font-mono">
                        {shortenAddress(member.address)}
                      </p>
                    )}
                    <p className="text-sm text-[#64748B] mt-1">
                      {formatAlgoAmount(Number(member.share))} ALGO
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    member.paid
                      ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                      : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                  }`}>
                    {member.paid ? 'Paid' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancel Button */}
        {canCancel && (
          <div className="bg-white border border-[#FCA5A5] rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">Danger Zone</h2>
            <p className="text-[#64748B] mb-4">
              Cancel this bill if it was created by mistake. This action cannot be undone.
            </p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-6 py-3 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Bill'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

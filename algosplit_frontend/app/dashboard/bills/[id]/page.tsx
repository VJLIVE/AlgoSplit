'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  ArrowLeftIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && billId) {
      fetchBillDetails();
    }
  }, [user, billId]);

  const fetchBillDetails = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setNotFound(false);
      
      // Get bill details
      const billData = await getBill(billId);
      if (!billData) {
        setNotFound(true);
        return;
      }
      setBill(billData);

      // Check if user is the creator
      const isUserCreator = billData.creator === user.walletAddress;

      // Get user's member details only if they're not the creator
      let userMemberData: Member | null = null;
      if (!isUserCreator) {
        userMemberData = await getMember(billId, user.walletAddress);
        setUserMember(userMemberData);
      } else {
        setUserMember(null);
      }

      // Get all member addresses from the contract
      const memberAddresses = await getBillMembers(billId);
      
      // Fetch member details for each address
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

      // Fetch contact names from MongoDB for all members
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
            
            // Map contact names to members
            membersList.forEach(member => {
              const contact = contacts.find((c: any) => c.walletAddress === member.address);
              if (contact) {
                member.name = contact.contactName;
              }
            });
          }
        } catch (error) {
          console.error('Failed to fetch contact names:', error);
          // Continue without names
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

      // Check account balance
      const { algodClient: algoClient } = await import('@/lib/algorand');
      const accountInfo = await algoClient.accountInformation(accountAddress).do();
      const balance = Number(accountInfo.amount);
      const minBalance = Number((accountInfo as any)['min-balance'] || 0);
      
      // Calculate required balance (share amount + transaction fees)
      const shareAmount = Number(userMember.share);
      const estimatedFees = 2000; // 0.002 ALGO for 2 transactions
      const requiredBalance = shareAmount + estimatedFees;
      const availableBalance = balance - minBalance;
      
      console.log('Balance check:', {
        balance: balance / 1_000_000,
        minBalance: minBalance / 1_000_000,
        availableBalance: availableBalance / 1_000_000,
        shareAmount: shareAmount / 1_000_000,
        requiredBalance: requiredBalance / 1_000_000,
      });
      
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

      // Create payment transactions
      const txns = await payBillTransaction(
        accountAddress,
        billId,
        bill.creator,
        shareAmount
      );

      // Sign transactions with Pera Wallet
      const txnsToSign = txns.map(txn => ({
        txn,
        signers: [accountAddress],
      }));

      const signedTxns = await wallet.signTransaction([txnsToSign]);

      // Send to network
      const response = await algoClient.sendRawTransaction(signedTxns).do();

      // Wait for confirmation
      await algosdk.waitForConfirmation(algoClient, response.txid, 4);

      alert('Payment successful!');
      
      // Refresh bill details
      await fetchBillDetails();

    } catch (error: any) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error.message || 'Unknown error'}`);
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

      // Create cancel transaction
      const txn = await cancelBillTransaction(accountAddress, billId);

      // Sign transaction with Pera Wallet
      const txnToSign = {
        txn,
        signers: [accountAddress],
      };

      const signedTxns = await wallet.signTransaction([[txnToSign]]);

      // Send to network
      const { algodClient } = await import('@/lib/algorand');
      const response = await algodClient.sendRawTransaction(signedTxns).do();

      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, response.txid, 4);

      alert('Bill cancelled successfully!');
      router.push('/dashboard');

    } catch (error: any) {
      console.error('Cancel failed:', error);
      alert(`Cancel failed: ${error.message || 'Unknown error'}`);
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show not found page if bill doesn't exist
  if (notFound || !bill) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h1>
            <p className="text-gray-600 mb-6">
              The bill you're looking for doesn't exist or may have been deleted.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Bill Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Bill #{billId}</h1>
              <p className="text-gray-600">
                Created by: {isCreator ? 'You' : shortenAddress(bill.creator)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-3xl font-bold text-gray-900">
                <CurrencyDollarIcon className="w-8 h-8" />
                {formatAlgoAmount(Number(bill.totalAmount))} ALGO
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Amount</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            {bill.isSettled ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="w-5 h-5" />
                Settled
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <ClockIcon className="w-5 h-5" />
                Pending
              </span>
            )}
            
            {userMember && (
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                userMember.paid
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {userMember.paid ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    You Paid
                  </>
                ) : (
                  <>
                    <XCircleIcon className="w-5 h-5" />
                    You Haven't Paid
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Bill Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{Number(bill.memberCount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">{Number(bill.settledCount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(bill.memberCount) - Number(bill.settledCount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Share (if member) */}
        {userMember && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Share</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600 mb-1">Amount to pay</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatAlgoAmount(Number(userMember.share))} ALGO
                </p>
              </div>
              {canPay && (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {paying ? 'Processing...' : 'Pay Now'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Members</h2>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                Loading member details...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.address}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.name || shortenAddress(member.address)}
                    </p>
                    {member.name && (
                      <p className="text-xs text-gray-500">
                        {shortenAddress(member.address)}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {formatAlgoAmount(Number(member.share))} ALGO
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    member.paid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {member.paid ? 'Paid' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancel Button (for creator) */}
        {canCancel && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Danger Zone</h2>
            <p className="text-gray-600 mb-4">
              Cancel this bill if it was created by mistake. This action cannot be undone.
            </p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Bill'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

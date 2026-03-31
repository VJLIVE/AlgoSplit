'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { algosToMicroAlgos, shortenAddress } from '@/lib/algorand';
import { createBillTransaction } from '@/lib/contract';
import algosdk from 'algosdk';

interface Contact {
  _id: string;
  contactName: string;
  walletAddress: string;
}

interface BillMember {
  address: string;
  name: string;
  share: string;
}

export default function CreateBillPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { wallet, accountAddress } = useWallet();
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [members, setMembers] = useState<BillMember[]>([
    { address: '', name: '', share: '' },
  ]);
  const [totalAmount, setTotalAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchContacts = async () => {
    try {
      const walletAddress = user?.walletAddress;
      const response = await fetch('/api/contacts', {
        headers: { 'x-wallet-address': walletAddress || '' },
      });
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const saveNewContact = async (name: string, address: string) => {
    try {
      const existingContact = contacts.find(
        c => c.walletAddress.toLowerCase() === address.toLowerCase()
      );
      
      if (existingContact) return;

      const walletAddress = user?.walletAddress;
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress || '',
        },
        body: JSON.stringify({
          contactName: name,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        await fetchContacts();
      }
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  const addMember = () => {
    setMembers([...members, { address: '', name: '', share: '' }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof BillMember, value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const splitEqually = () => {
    if (!totalAmount) {
      setError('Please enter total amount first');
      return;
    }

    const total = parseFloat(totalAmount);
    const totalPeople = members.length + 1;
    const sharePerPerson = (total / totalPeople).toFixed(6);

    const updated = members.map(m => ({
      ...m,
      share: sharePerPerson,
    }));
    setMembers(updated);
  };

  const importContacts = () => {
    const imported = Array.from(selectedContacts).map(contactId => {
      const contact = contacts.find(c => c._id === contactId);
      return {
        address: contact?.walletAddress || '',
        name: contact?.contactName || '',
        share: '',
      };
    });

    setMembers([...members, ...imported]);
    setSelectedContacts(new Set());
    setShowImportModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet || !accountAddress || !user) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Validation
      const validMembers = members.filter(m => m.address && m.share);
      if (validMembers.length === 0) {
        throw new Error('Add at least one member with address and share');
      }

      for (const member of validMembers) {
        if (!algosdk.isValidAddress(member.address)) {
          throw new Error(`Invalid address: ${member.address}`);
        }
      }

      const total = parseFloat(totalAmount);
      const totalShares = validMembers.reduce((sum, m) => sum + parseFloat(m.share), 0);
      const totalPeople = validMembers.length + 1;
      const expectedTotal = total;
      const expectedPayback = (total / totalPeople) * validMembers.length;

      if (Math.abs(totalShares - expectedTotal) > 0.01 && Math.abs(totalShares - expectedPayback) > 0.01) {
        throw new Error(
          `Total shares (${totalShares.toFixed(2)} ALGO) must equal either:\n` +
          `• Full bill amount: ${expectedTotal.toFixed(2)} ALGO, OR\n` +
          `• Bill minus your share: ${expectedPayback.toFixed(2)} ALGO (${expectedTotal.toFixed(2)} ÷ ${totalPeople} × ${validMembers.length})`
        );
      }

      // Check balance
      const { algodClient: algoClient } = await import('@/lib/algorand');
      const accountInfo = await algoClient.accountInformation(accountAddress).do();
      const balance = accountInfo.amount;
      
      const estimatedMBR = 100000 * (1 + validMembers.length);
      const estimatedFees = 2000;
      const requiredBalance = estimatedMBR + estimatedFees + 100000;
      
      if (balance < requiredBalance) {
        const requiredALGO = (requiredBalance / 1_000_000).toFixed(3);
        const currentALGO = (Number(balance) / 1_000_000).toFixed(3);
        throw new Error(
          `Insufficient balance. You have ${currentALGO} ALGO but need at least ${requiredALGO} ALGO ` +
          `(includes box storage MBR and fees). Please add more ALGO to your wallet.`
        );
      }

      // Save new contacts
      for (const member of validMembers) {
        if (member.name && member.address) {
          await saveNewContact(member.name, member.address);
        }
      }

      // Create transaction
      const memberAddresses = validMembers.map(m => m.address);
      const memberShares = validMembers.map(m => algosToMicroAlgos(parseFloat(m.share)));

      const txns = await createBillTransaction(
        accountAddress,
        memberAddresses,
        memberShares
      );

      // Sign with Pera Wallet
      const txnsToSign = txns.map(txn => ({
        txn,
        signers: [accountAddress],
      }));

      const signedTxns = await wallet.signTransaction([txnsToSign]);

      // Send to network
      const response = await algoClient.sendRawTransaction(signedTxns).do();
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algoClient, response.txid, 4);

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create bill');
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

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#16A34A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Bill created successfully!</h2>
          <p className="text-[#64748B]">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

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

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#0F172A] mb-2">Create Bill</h2>
          <p className="text-[#64748B]">Split a bill with your contacts</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <p className="text-[#DC2626] text-sm whitespace-pre-line">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Total Amount */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Total Amount (ALGO)
            </label>
            <input
              type="number"
              step="0.000001"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              placeholder="5.000000"
              required
            />
          </div>

          {/* Members */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0F172A]">Members</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-3 py-2 text-sm border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:border-[#CBD5E1] hover:bg-[#F8FAFC] flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
                <button
                  type="button"
                  onClick={splitEqually}
                  className="px-3 py-2 text-sm border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
                >
                  Split Equally
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {members.map((member, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] text-sm focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                      placeholder="Name"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <input
                      type="text"
                      value={member.address}
                      onChange={(e) => updateMember(index, 'address', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] text-sm focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1] font-mono"
                      placeholder="Wallet Address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      step="0.000001"
                      value={member.share}
                      onChange={(e) => updateMember(index, 'share', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] text-sm focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                      placeholder="Share"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addMember}
              className="mt-4 w-full px-4 py-3 border border-dashed border-[#E2E8F0] text-[#64748B] rounded-lg hover:border-[#CBD5E1] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6366F1] text-white py-3 rounded-lg font-medium hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Creating Bill...' : 'Create Bill'}
          </button>
        </form>

        {/* Import Contacts Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white border border-[#E2E8F0] rounded-lg max-w-md w-full p-6 shadow-lg">
              <h3 className="text-xl font-bold text-[#0F172A] mb-4">Import Contacts</h3>
              
              {contacts.length === 0 ? (
                <p className="text-[#64748B] text-center py-8">No contacts saved yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {contacts.map((contact) => (
                    <label
                      key={contact._id}
                      className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg hover:border-[#CBD5E1] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact._id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedContacts);
                          if (e.target.checked) {
                            newSelected.add(contact._id);
                          } else {
                            newSelected.delete(contact._id);
                          }
                          setSelectedContacts(newSelected);
                        }}
                        className="w-4 h-4 text-[#6366F1] bg-white border-[#E2E8F0] rounded focus:ring-[#6366F1]"
                      />
                      <div className="flex-1">
                        <div className="text-[#0F172A] font-medium">{contact.contactName}</div>
                        <div className="text-[#64748B] text-sm font-mono">{shortenAddress(contact.walletAddress)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedContacts(new Set());
                  }}
                  className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={importContacts}
                  disabled={selectedContacts.size === 0}
                  className="flex-1 px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] disabled:opacity-50 shadow-sm"
                >
                  Import ({selectedContacts.size})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

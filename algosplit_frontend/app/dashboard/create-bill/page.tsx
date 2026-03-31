'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ArrowLeftIcon, PlusIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
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
  const [billName, setBillName] = useState('');
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
      // Check if contact already exists
      const existingContact = contacts.find(
        c => c.walletAddress.toLowerCase() === address.toLowerCase()
      );
      
      if (existingContact) {
        return; // Already saved
      }

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
        await fetchContacts(); // Refresh contacts list
      }
    } catch (err) {
      console.error('Failed to save contact:', err);
      // Don't throw error - saving contact is optional
    }
  };

  const addMember = () => {
    setMembers([...members, { address: '', name: '', share: '' }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: keyof BillMember, value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const splitEqually = () => {
    if (!totalAmount || members.length === 0) return;

    const total = parseFloat(totalAmount);
    
    // Total people including creator (who already paid the full bill)
    const totalPeople = members.length + 1;
    const perPerson = (total / totalPeople).toFixed(6);

    // Each member pays their share back to the creator
    setMembers(members.map(m => ({ ...m, share: perPerson })));
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const importSelectedContacts = () => {
    const contactsToImport = contacts.filter(c => selectedContacts.has(c._id));
    
    // Add selected contacts as members
    const newMembers = contactsToImport.map(c => ({
      address: c.walletAddress,
      name: c.contactName,
      share: '',
    }));

    // Merge with existing members, avoiding duplicates
    const existingAddresses = new Set(members.map(m => m.address.toLowerCase()));
    const uniqueNewMembers = newMembers.filter(
      m => m.address && !existingAddresses.has(m.address.toLowerCase())
    );

    setMembers([...members.filter(m => m.address), ...uniqueNewMembers]);
    setShowImportModal(false);
    setSelectedContacts(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!billName.trim()) {
        throw new Error('Please enter a bill name');
      }

      if (members.some(m => !m.address || !m.name || !m.share)) {
        throw new Error('Please fill in all member details (name, address, and share)');
      }

      // Validate Algorand addresses
      for (const member of members) {
        try {
          algosdk.decodeAddress(member.address);
        } catch {
          throw new Error(`Invalid Algorand address for ${member.name}`);
        }
      }

      const totalShares = members.reduce((sum, m) => sum + parseFloat(m.share || '0'), 0);
      const expectedTotal = parseFloat(totalAmount);

      // Calculate what the creator should receive back
      // If split equally: total / (members + 1) * members = total - creator's share
      const totalPeople = members.length + 1;
      const creatorShare = expectedTotal / totalPeople;
      const expectedPayback = expectedTotal - creatorShare;

      // Allow some flexibility: members can pay back the full amount OR (total - creator's share)
      const isFullAmount = Math.abs(totalShares - expectedTotal) < 0.01;
      const isMinusCreatorShare = Math.abs(totalShares - expectedPayback) < 0.01;

      if (!isFullAmount && !isMinusCreatorShare) {
        throw new Error(
          `Total shares (${totalShares.toFixed(2)} ALGO) should either equal:\n` +
          `• Full bill amount: ${expectedTotal.toFixed(2)} ALGO, OR\n` +
          `• Bill minus your share: ${expectedPayback.toFixed(2)} ALGO (${expectedTotal.toFixed(2)} ÷ ${totalPeople} × ${members.length})`
        );
      }

      if (!wallet || !accountAddress) {
        throw new Error('Please connect your wallet');
      }

      // Check account balance
      const { algodClient: algoClient } = await import('@/lib/algorand');
      const accountInfo = await algoClient.accountInformation(accountAddress).do();
      const balance = accountInfo.amount;
      
      // Estimate required balance (MBR + transaction fees + buffer)
      const estimatedMBR = 100000 * (1 + members.length); // ~0.1 ALGO per box
      const estimatedFees = 2000; // 0.002 ALGO for 2 transactions
      const requiredBalance = estimatedMBR + estimatedFees + 100000; // +0.1 ALGO account minimum
      
      if (balance < requiredBalance) {
        const requiredALGO = (requiredBalance / 1_000_000).toFixed(3);
        const currentALGO = (Number(balance) / 1_000_000).toFixed(3);
        throw new Error(
          `Insufficient balance. You have ${currentALGO} ALGO but need at least ${requiredALGO} ALGO ` +
          `(includes box storage MBR and fees). Please add more ALGO to your wallet.`
        );
      }

      // Save new contacts to MongoDB
      for (const member of members) {
        if (member.name && member.address) {
          await saveNewContact(member.name, member.address);
        }
      }

      // Prepare transaction
      const memberAddresses = members.map(m => m.address);
      const memberShares = members.map(m => algosToMicroAlgos(parseFloat(m.share)));

      const txns = await createBillTransaction(
        accountAddress,
        memberAddresses,
        memberShares
      );

      // Sign with Pera Wallet
      const txnsToSign = txns.map(txn => {
        return {
          txn,
          signers: [accountAddress],
        };
      });

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Created Successfully!</h2>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Bill</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bill Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Name
              </label>
              <input
                type="text"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Dinner at Restaurant"
                required
              />
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount (ALGO)
              </label>
              <input
                type="number"
                step="0.000001"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="100.00"
                required
              />
            </div>

            {/* Members */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Members
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                  >
                    <UserGroupIcon className="w-4 h-4" />
                    Import Contacts
                  </button>
                  <button
                    type="button"
                    onClick={splitEqually}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Split Equally
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {members.map((member, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-3 items-start mb-3">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateMember(index, 'name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Member name"
                          required
                        />
                        
                        <input
                          type="text"
                          value={member.address}
                          onChange={(e) => updateMember(index, 'address', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                          placeholder="Algorand wallet address"
                          required
                        />

                        <input
                          type="number"
                          step="0.000001"
                          value={member.share}
                          onChange={(e) => updateMember(index, 'share', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Share amount (ALGO)"
                          required
                        />
                      </div>

                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMember(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {member.address && (
                      <p className="text-xs text-gray-500 font-mono">
                        {shortenAddress(member.address)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMember}
                className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                Add Member
              </button>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Creating...' : 'Create Bill'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Import Contacts Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Import Contacts</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select contacts to add as bill members
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {contacts.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No contacts saved yet</p>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      router.push('/dashboard/contacts');
                    }}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Add Contacts
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <label
                      key={contact._id}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact._id)}
                        onChange={() => toggleContactSelection(contact._id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{contact.contactName}</p>
                        <p className="text-sm text-gray-600 font-mono">
                          {shortenAddress(contact.walletAddress)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedContacts(new Set());
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={importSelectedContacts}
                disabled={selectedContacts.size === 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Import {selectedContacts.size > 0 && `(${selectedContacts.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

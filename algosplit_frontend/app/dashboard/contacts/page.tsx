'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Plus, Trash2, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { shortenAddress } from '@/lib/algorand';
import algosdk from 'algosdk';

interface Contact {
  _id: string;
  contactName: string;
  walletAddress: string;
}

export default function ContactsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', address: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setLoading(true);
      const response = await fetch('/api/contacts', {
        headers: { 'x-wallet-address': user?.walletAddress || '' },
      });
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!algosdk.isValidAddress(newContact.address)) {
      setError('Invalid Algorand address');
      return;
    }

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': user?.walletAddress || '',
        },
        body: JSON.stringify({
          contactName: newContact.name,
          walletAddress: newContact.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add contact');
      }

      setSuccess('Contact added successfully');
      setNewContact({ name: '', address: '' });
      setShowAddModal(false);
      await fetchContacts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'x-wallet-address': user?.walletAddress || '' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      setSuccess('Contact deleted');
      await fetchContacts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setError('Failed to delete contact');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6366F1] border-t-transparent"></div>
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

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#0F172A] mb-2">Contacts</h2>
            <p className="text-[#64748B]">Manage your saved contacts</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            <p className="text-[#16A34A] text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626]" />
            <p className="text-[#DC2626] text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6366F1] border-t-transparent mx-auto mb-4"></div>
              <p className="text-[#64748B]">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-[#F1F5F9] rounded-lg flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-[#64748B]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No contacts yet</h3>
              <p className="text-[#64748B] mb-4">Add contacts to quickly create bills</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Contact
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="p-4 flex items-center justify-between hover:bg-[#F8FAFC]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-[#6366F1]" />
                    </div>
                    <div>
                      <div className="text-[#0F172A] font-medium">{contact.contactName}</div>
                      <div className="text-[#64748B] text-sm font-mono">
                        {shortenAddress(contact.walletAddress)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact._id)}
                    className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Contact Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white border border-[#E2E8F0] rounded-lg max-w-md w-full p-6 shadow-lg">
              <h3 className="text-xl font-bold text-[#0F172A] mb-4">Add Contact</h3>
              
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={newContact.address}
                    onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1] font-mono text-sm"
                    placeholder="ALGORAND_ADDRESS..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewContact({ name: '', address: '' });
                      setError('');
                    }}
                    className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] shadow-sm"
                  >
                    Add Contact
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

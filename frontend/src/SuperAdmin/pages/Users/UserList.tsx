import React, { useEffect, useState, useCallback } from 'react';
import PageLayout from '../../../components/PageLayout';
import { showToast, AlertContainer } from '../../../components/AlertBox';
import ConfirmModal from '../../../components/ConfirmModal';
import axiosInstance from '../../../utils/axiosInstance';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  X,
  Building,
  UserCheck
} from 'lucide-react';

interface UserRecord {
  userId: string;
  username: string;
  email: string;
  mobile: string;
  country?: string;
  city?: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  isConfirmed?: boolean;
  companyId?: string;
  company?: {
    companyId: string;
    companyName: string;
  };
  bookings?: any[];
  isDeleted?: boolean;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-rose-100 text-rose-800 border-rose-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
  ];
  const code = (name || 'U').charCodeAt(0);
  return colors[code % colors.length];
};

export default function UserList() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');

  // Selected User Detail Modal
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: UserRecord | null;
  }>({
    isOpen: false,
    user: null
  });
  const [deleting, setDeleting] = useState<boolean>(false);

  // Fetch real database users with booking associations
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/user/getAllUsers', {
        params: {
          search: searchText.trim() || undefined
        }
      });
      const list = res.data?.data || [];
      setUsers(list);
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('Failed to load users from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Execute User Deletion
  const handleConfirmDelete = async () => {
    if (!deleteModal.user) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/user/deleteUser/${deleteModal.user.userId}`);
      showToast(`User "${deleteModal.user.username}" deleted successfully!`, 'success');
      setDeleteModal({ isOpen: false, user: null });
      if (selectedUser?.userId === deleteModal.user.userId) {
        setSelectedUser(null);
      }
      await fetchUsers();
    } catch (err: any) {
      console.error('User delete error:', err);
      showToast(err.response?.data?.message || 'Failed to delete user.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} /> Active
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={12} /> Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <XCircle size={12} /> {status || 'Inactive'}
      </span>
    );
  };

  return (
    <PageLayout>
      <AlertContainer />
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Users</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase">
                {users.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage registered customers, view trip histories, and account statuses.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="text-xs text-slate-400 font-semibold self-end sm:self-center">
            Showing <span className="font-bold text-slate-900">{users.length}</span> registered users
          </div>
        </div>

        {/* Main Users Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Bookings</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                      <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
                      Loading users from database...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Users size={32} className="text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No users found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {searchText ? 'No users matched your search criteria.' : 'No registered users in database.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const initials = (u.username || 'U')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    const bookingCount = Array.isArray(u.bookings) ? u.bookings.length : 0;

                    return (
                      <tr key={u.userId} className="hover:bg-slate-50/80 transition-colors">
                        {/* User & Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs border ${getAvatarColor(
                                u.username
                              )} flex-shrink-0`}
                            >
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm block">
                                {u.username || 'Anonymous User'}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                                {u.email || 'No email provided'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-800">
                            {u.mobile || '-'}
                          </span>
                        </td>

                        {/* Location / Company */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-700 block">
                            {u.city ? `${u.city}${u.country ? `, ${u.country}` : ''}` : '-'}
                          </span>
                          {u.company?.companyName && (
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {u.company.companyName}
                            </span>
                          )}
                        </td>

                        {/* Bookings */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-extrabold text-xs">
                            <Car size={12} className="text-slate-500" />
                            {bookingCount} {bookingCount === 1 ? 'Ride' : 'Rides'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">{getStatusBadge(u.status)}</td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {formatDate(u.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedUser(u)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1"
                              title="View User Details"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, user: u })}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors"
                              title="Delete User"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clean Modern User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border ${getAvatarColor(
                      selectedUser.username
                    )}`}
                  >
                    {(selectedUser.username || 'U')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{selectedUser.username}</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {selectedUser.userId.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Account Status Card */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-600">Account Status</span>
                {getStatusBadge(selectedUser.status)}
              </div>

              {/* User Info Details Grid */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Mail size={16} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                    <span className="font-bold text-slate-900">{selectedUser.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Phone size={16} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Number</span>
                    <span className="font-mono font-bold text-slate-900">{selectedUser.mobile || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {selectedUser.city ? `${selectedUser.city}, ${selectedUser.country || ''}` : 'Not Specified'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bookings</span>
                    <span className="font-black text-emerald-700 mt-0.5 block text-sm">
                      {Array.isArray(selectedUser.bookings) ? selectedUser.bookings.length : 0} Rides
                    </span>
                  </div>
                </div>

                {selectedUser.company?.companyName && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <Building size={16} className="text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Associated Company</span>
                      <span className="font-bold text-slate-900">{selectedUser.company.companyName}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration Date</span>
                    <span className="font-bold text-slate-800">{formatDate(selectedUser.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: true, user: selectedUser })}
                  className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete User</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reusable Confirmation Modal for User Deletion */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Delete User Account?"
          description={`Are you sure you want to delete user "${deleteModal.user?.username}"? Their historical booking records will remain preserved.`}
          confirmText="Delete User"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleting}
          loadingText="Deleting..."
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModal({ isOpen: false, user: null })}
        />
      </div>
    </PageLayout>
  );
}
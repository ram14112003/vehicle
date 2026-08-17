import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../../components/PageLayout';
import axiosInstance from '../../../utils/axiosInstance';
import { DataTable, Column } from '../../../components/DataTable';
import InputBox from '../../../components/InputBox';
import SearchBar from '../../../components/SearchBar';
import { FileText } from 'lucide-react';
import { showToast, ActionModal } from "../../../components/AlertBox";

type User = {
  userId: string;
  username: string;
  email: string;
  mobile: string;
  country: string;
  city: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  isConfirmed: boolean;
  companyId: string;
  isDeleted?: boolean;
};

type ModalType =
  | "confirm-delete"
  | "confirm-restore"
  | "confirm-permanent-delete";

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrashed, setShowTrashed] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>("confirm-delete");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const navigate = useNavigate();

  /* Filters */
  const [formKeyword, setFormKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  /* Fetch */
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get(
        `/user/getAllUsers${showTrashed ? '?includeDeleted=1' : ''}`
      );

      const list = showTrashed
        ? res.data.data.filter((u: User) => u.isDeleted)
        : res.data.data;

      setUsers(list);
    } catch {
      showToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [showTrashed]);

const handleSearch = () => {
  setAppliedKeyword(formKeyword);
  window.scrollTo(0,0); 
};

  /* Modal Open */
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setModalType("confirm-delete");
    setModalOpen(true);
  };

  const openRestoreModal = (user: User) => {
    setSelectedUser(user);
    setModalType("confirm-restore");
    setModalOpen(true);
  };

  const openPermanentDeleteModal = (user: User) => {
    setSelectedUser(user);
    setModalType("confirm-permanent-delete");
    setModalOpen(true);
  };

  /* Confirm */
  const handleConfirm = async () => {
    if (!selectedUser) return;

    try {
      if (modalType === "confirm-delete") {
        await axiosInstance.delete(`/user/deleteUser/${selectedUser.userId}`);
        showToast("Deleted successfully", "success");
      }

      if (modalType === "confirm-restore") {
        await axiosInstance.put(`/user/restoreUser/${selectedUser.userId}`);
        showToast("Restored successfully", "success");
      }

      if (modalType === "confirm-permanent-delete") {
        await axiosInstance.delete(`/user/permanentDeleteUser/${selectedUser.userId}`);
        showToast("Permanently deleted", "success");
      }

      setModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch {
      showToast("Action failed", "error");
    }
  };

  /* Filter */
  const filteredUsers = users.filter((u) =>
    appliedKeyword
      ? u.username.toLowerCase().includes(appliedKeyword.toLowerCase()) ||
        u.email.toLowerCase().includes(appliedKeyword.toLowerCase())
      : true
  );

  /* Columns (NO ACTION COLUMN HERE ❌) */
  const columns: Column<User>[] = [
    {
      header: 'User Name',
      accessor: 'username',
      render: (row) => (
        <div>
          <div className="font-medium">{row.username}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Register Date',
      accessor: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Confirmed',
      accessor: 'isConfirmed',
      render: (row) => (row.isConfirmed ? 'Yes' : 'No'),
    },
    { header: 'Country', accessor: 'country' },
    { header: 'City', accessor: 'city' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 text-xs rounded ${
          row.status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-200'
        }`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <PageLayout>
      <div className="py-6">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">User List</h1>

          <button
            onClick={() => {
              setLoading(true);
              setShowTrashed(!showTrashed);
            }}
            className={`px-4 py-2 text-white rounded ${
              showTrashed ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {showTrashed ? "Show Active" : "Trashed Entries"}
          </button>
        </div>

        {/* FILTER */}
        <div className="bg-white p-4 mb-4 rounded shadow">
          <div className="flex gap-4 flex-wrap">
            <InputBox
              name="keyword"
              placeholder="Search..."
              value={formKeyword}
              onValueChange={(v) => setFormKeyword(String(v))}
                onEnterPress={handleSearch}

            />
            <SearchBar onlyButton onSearch={handleSearch} />
          </div>
        </div>

        {/* TABLE */}
        <DataTable<User>
           key={appliedKeyword}
          columns={columns}
          data={filteredUsers}
          loading={loading}
          rowsPerPage={10}
          emptyMessage="No users found."

          onView={!showTrashed ? (row) =>
            navigate(`/users/userdetails/${row.userId}`) : undefined}

onInvoice={!showTrashed ? async (row: any) => {
  const r = row?.original ?? row;

  if (String(r?.status).toLowerCase() !== "active") {
    showToast("Inactive user", "warn");
    return;
  }

  try {
    // 🔥 API CALL
    const res = await axiosInstance.get(`/company/getCompanyById/${r.companyId}`);

    const companyName = res?.data?.data?.companyName?.toLowerCase();

    // ✅ CONDITION
    if (companyName?.includes("grace cabs")) {
      navigate(`/users/createinvoice/${r.userId}?companyId=${r.companyId}`);
    } else {
      navigate(`/users/userinvoice/${r.userId}?companyId=${r.companyId}`);
    }

  } catch (err) {
    console.error("Company fetch error", err);
    showToast("Failed to fetch company details", "error");
  }

} : undefined}

          /* ✅ SAME COLUMN ACTIONS */
          onDelete={!showTrashed ? (row) => openDeleteModal(row) : undefined}
          onRestore={showTrashed ? (row) => openRestoreModal(row) : undefined}
          onPermanentDelete={showTrashed ? (row) => openPermanentDeleteModal(row) : undefined}

          invoiceVisible={(row) => row.status === "active"}
          invoiceIcon={<FileText size={16} />}
          invoiceLabel="Invoice"
        />

        {/* MODAL */}
        <ActionModal
          isOpen={modalOpen}
          type={modalType}
          itemName={selectedUser?.username}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirm}
        />

      </div>
    </PageLayout>
  );
}
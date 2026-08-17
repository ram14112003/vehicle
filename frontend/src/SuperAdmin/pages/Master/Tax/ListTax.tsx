import React, { useEffect, useState } from "react";
import PageLayout from "../../../../components/PageLayout";
import { DataTable, Column } from "../../../../components/DataTable";
import { ActionModal, showToast } from "../../../../components/AlertBox";
import axiosInstance from "../../../../utils/axiosInstance";

interface TaxItem {
  taxId: string;
  taxName: string;
  taxPercent: number;
  isActive: boolean;
  createdAt?: string;
}

interface TaxListResponse {
  message: string;
  data: TaxItem[];
}

export default function ListMasterTax() {
  const [taxes, setTaxes] = useState<TaxItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [editingTax, setEditingTax] = useState<TaxItem | null>(null);
  const [editData, setEditData] = useState<TaxItem>({
    taxId: "",
    taxName: "",
    taxPercent: 0,
    isActive: false,
  });

  const [modalType, setModalType] = useState<
    "confirm-delete" | "delete-success" | null
  >(null);
  const [targetItem, setTargetItem] = useState<TaxItem | null>(null);

  useEffect(() => {
    fetchTaxList();
  }, []);

  const fetchTaxList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get<TaxListResponse>("/emp/getTaxList");
      if (Array.isArray(res.data.data)) {
        setTaxes(res.data.data);
      } else {
        throw new Error("Invalid data format from API");
      }
    } catch (err) {
      
      setError("Failed to fetch tax list. Please try again later.");
      showToast("Failed to load taxes.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete
  const handleDelete = (row: TaxItem) => {
    setTargetItem(row);
    setModalType("confirm-delete");
  };

  const confirmDelete = async () => {
    if (!targetItem) return;
    try {
      await axiosInstance.delete(`/emp/deleteTax/${targetItem.taxId}`);
      const updated = taxes.filter((t) => t.taxId !== targetItem.taxId);
      setTaxes(updated);
      setModalType("delete-success");
      showToast("Tax deleted successfully!", "success");
    } catch (err) {
     
      showToast("Failed to delete tax.", "error");
    }
    setTargetItem(null);
  };

  // 🔹 Edit
  const handleEdit = (row: TaxItem) => {
    setEditingTax(row);
    setEditData(row);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "taxPercent"
          ? parseFloat(value)
          : value,
    }));
  };

  const handleEditSubmit = async () => {
    if (!editData.taxName.trim()) {
      showToast("Tax name is required.", "warn");
      return;
    }

    try {
      await axiosInstance.put(`/emp/editTax/${editData.taxId}`, {
        taxName: editData.taxName,
        taxPercent: editData.taxPercent,
        isActive: editData.isActive,
      });
      const updated = taxes.map((tax) =>
        tax.taxId === editData.taxId ? editData : tax
      );
      setTaxes(updated);
      setEditingTax(null);
      showToast("Tax updated successfully!", "success");
    } catch (err) {
    
      showToast("Failed to update tax.", "error");
    }
  };

  const columns: Column<TaxItem>[] = [
    { header: "Tax Name", accessor: "taxName" },
    { header: "Tax Percent", accessor: "taxPercent" },
 { 
    header: "Status", 
    accessor: "isActive",
    render: (row: TaxItem) => (row.isActive ? "Active" : "In-Active"),
  },  ];

  return (
    <PageLayout>
      <main className=" py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
Tax List</h1>

       
          <DataTable
            columns={columns}
            loading={loading}
            data={taxes}
            rowsPerPage={5} // ✅ Only here set rows per page
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        

        {/* 🔹 Edit Modal */}
        {editingTax && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Edit Tax</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tax Name
                  </label>
                  <input
                    type="text"
                    name="taxName"
                    value={editData.taxName}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 px-4 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tax Percent
                  </label>
                  <input
                    type="number"
                    name="taxPercent"
                    value={editData.taxPercent}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 px-4 py-2 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editData.isActive}
                    onChange={handleEditChange}
                    className="h-4 w-4"
                  />
                  <label className="text-sm">Is Active</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setEditingTax(null)}
                  className="px-4 py-2 border rounded text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔹 Action Modal */}
        {modalType && (
          <ActionModal
            isOpen={!!modalType}
            type={modalType}
            onClose={() => setModalType(null)}
            onConfirm={modalType === "confirm-delete" ? confirmDelete : undefined}
          />
        )}
      </main>
    </PageLayout>
  );
}

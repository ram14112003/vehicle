import React, { useEffect, useState, useCallback } from "react";
import PageLayout from "../../../../components/PageLayout";
import { DataTable, Column } from "../../../../components/DataTable";
import CommonButton from "../../../../components/CommonButton";
import InputBox from "../../../../components/InputBox";
import SearchBar from "../../../../components/SearchBar";
import TrashToggleButton from "../../../../components/TrashToggleButton";
import { ActionModal, showToast } from "../../../../components/AlertBox";
import axiosInstance from "../../../../utils/axiosInstance";

interface PickupArea {
  areaId: string;
  city: string;
  area: string;
}

interface PickupAreaListResponse {
  data: any[];
  message: string;
}

interface PickupAreaByIdResponse {
  data: {
    areaId: string;
    pickupCity: string;
    pickupArea: string;
  };
  message: string;
}

const PickupAreaInfo: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pickupAreas, setPickupAreas] = useState<PickupArea[]>([]);
  const [trashedAreas, setTrashedAreas] = useState<PickupArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<PickupArea>({
    areaId: "",
    city: "",
    area: "",
  });

  const [editRow, setEditRow] = useState<PickupArea | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "confirm-delete" | "delete-success" | "restore-success" | null
  >(null);
  const [targetRow, setTargetRow] = useState<PickupArea | null>(null);

  const [showTrash, setShowTrash] = useState(false);
// Add with other state variables
const [cities, setCities] = useState<string[]>([]);

// Fetch cities (like PickupAreaAdd.tsx)
useEffect(() => {
  const fetchCities = async () => {
    try {
      const response = await axiosInstance.get<{ data: { pickupCity: string }[] }>("/city/listCity");
      const cityList = response.data.data.map((item) => item.pickupCity);
      setCities(cityList);
    } catch (error) {
      showToast("Failed to load cities.", "error");
    }
  };
  fetchCities();
}, []);

  // 🔹 Fetch Areas
  const fetchPickupAreas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = showTrash ? "1" : "0";
      const response = await axiosInstance.get<PickupAreaListResponse>(
        `/area/listArea?status=${statusParam}`
      );
      if (response.data && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => ({
          areaId: item.areaId,
          city: item.pickupCity || "",
          area: item.pickupArea || "",
        }));
        if (showTrash) {
          setTrashedAreas(mapped);
        } else {
          setPickupAreas(mapped);
        }
      }
    } catch (err) {
      
      setError("Failed to fetch data.");
      showToast("Failed to fetch data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showTrash]);

  useEffect(() => {
    fetchPickupAreas();
  }, [fetchPickupAreas]);

  // 🔹 Search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPickupAreas();
      return;
    }
    try {
      const isDeletedFlag = showTrash ? 1 : 0;
      const response = await axiosInstance.get("/globalsearch", {
        params: {
          model: "pickuparea",
          keyword: searchTerm,
          isDeleted: isDeletedFlag,
        },
      });

      if (Array.isArray(response.data)) {
        const mapped = response.data.map((item: any) => ({
          areaId: item.areaId,
          city: item.pickupCity || "",
          area: item.pickupArea || "",
        }));
        if (showTrash) {
          setTrashedAreas(mapped);
        } else {
          setPickupAreas(mapped);
        }
      }
    } catch (error) {
      
       showToast("Error searching pickup areas:", "error");
    }
  };

  // 🔹 Columns for DataTable
  const columns: Column<PickupArea>[] = [
    { header: "Pickup City", accessor: "city" },
    { header: "Pickup Area", accessor: "area" },
  ];

  // 🔹 Edit
  const handleEdit = async (row: PickupArea) => {
    try {
      const response = await axiosInstance.get<PickupAreaByIdResponse>(
        `/area/getPickupAreaById/${row.areaId}`
      );
      const data = response.data.data;
      setEditForm({
        areaId: data.areaId,
        city: data.pickupCity,
        area: data.pickupArea,
      });
      setEditRow(row);
      setIsEditOpen(true);
    } catch (err) {
      
      showToast("Failed to load data for editing.", "error");
    }
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditRow(null);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      await axiosInstance.put(`/area/pickupAreaUpdate/${editForm.areaId}`, {
        pickupCity: editForm.city,
        pickupArea: editForm.area,
      });
      setPickupAreas((prev) =>
        prev.map((item) => (item.areaId === editForm.areaId ? editForm : item))
      );
      closeEdit();
      showToast("Pickup area updated successfully!", "success");
    } catch (err) {
      
      showToast("Failed to update pickup area.", "error");
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Delete / Restore
  const handleDelete = (row: PickupArea) => {
    setTargetRow(row);
    setModalType("confirm-delete");
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetRow) return;
    try {
      await axiosInstance.delete(`/area/pickupAreaDelete/${targetRow.areaId}`);
       showToast("Pickup area moved to trash!", "success");
      setPickupAreas((prev) =>
        prev.filter((item) => item.areaId !== targetRow.areaId)
      );
      setTrashedAreas((prev) => [...prev, targetRow]);
     
    } catch (err) {
     
      showToast("Failed to delete pickup area.", "error");
    }
    setTargetRow(null);
    setModalOpen(false);
  };

  const handleRestore = async (row: PickupArea) => {
    try {
      await axiosInstance.put(`/area/pickupAreaRestore/${row.areaId}`);
      showToast("Pickup area restored successfully!", "success");
      setPickupAreas((prev) => [...prev, row]);
      setTrashedAreas((prev) =>
        prev.filter((item) => item.areaId !== row.areaId)
      );
      
    } catch (err) {
      
      showToast("Failed to restore pickup area.", "error");
    }
  };

  // 🔹 Keyboard Esc close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeEdit();
        setModalOpen(false);
      }
    };
    if (isEditOpen || modalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEditOpen, modalOpen]);

  const currentData = showTrash ? trashedAreas : pickupAreas;

  return (
    <PageLayout>
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {showTrash ? "Trashed Pickup Areas" : "List Pickup Area"}
        </h1>

        <div className="py-6 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <SearchBar
              placeholder="(Pickup Area)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleSearch}
            />
            <TrashToggleButton
              showTrashed={showTrash}
              onToggle={() => setShowTrash(!showTrash)}
            />
          </div>

            <DataTable
              key={searchTerm + showTrash + currentData.length}
              columns={columns}
              data={currentData}
              loading={loading}
              onEdit={!showTrash ? handleEdit : undefined}
              onDelete={!showTrash ? handleDelete : undefined}
              onRestore={showTrash ? handleRestore : undefined}
              rowsPerPage={5}
            />
          
        </div>

        {/* Edit Modal */}
        {/* Edit Modal */}
{isEditOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="relative z-10 w-full max-w-md bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Edit Pickup Area</h2>
      <div className="space-y-4">
        
        {/* Pickup City Dropdown */}
        <div className="flex flex-col">
          <label htmlFor="editCity" className="font-medium text-gray-700 mb-1">
            Pickup City <span className="text-red-500">*</span>
          </label>
          <select
            id="editCity"
            value={editForm.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a city</option>
            {cities.map((pickupCity, index) => (
              <option key={index} value={pickupCity}>
                {pickupCity}
              </option>
            ))}
          </select>
        </div>

        {/* Pickup Area Input */}
        <InputBox
          label="Pickup Area"
          name="area"
          value={editForm.area}
          onChange={handleInputChange}
          placeholder="Enter area"
          required
        />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <CommonButton text="Cancel" onClick={closeEdit} variant="secondary" />
        <CommonButton text="Save" onClick={saveEdit} variant="primary" />
      </div>
    </div>
  </div>
)}


        {/* Action Modal */}
        {modalType && (
          <ActionModal
            isOpen={modalOpen}
            type={modalType}
            onClose={() => setModalOpen(false)}
            onConfirm={modalType === "confirm-delete" ? confirmDelete : undefined}
          />
        )}
      </main>
    </PageLayout>
  );
};

export default PickupAreaInfo;

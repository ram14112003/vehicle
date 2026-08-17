
// src/SuperAdmin/pages/Vehicle/VehicleType/ListVehicleType.tsx

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import PageLayout from "../../../../components/PageLayout";
import { DataTable, Column } from "../../../../components/DataTable";
import CommonButton from "../../../../components/CommonButton";
import InputBox from "../../../../components/InputBox";
import SearchBar from "../../../../components/SearchBar";
import TrashToggleButton from "../../../../components/TrashToggleButton";
import { showToast, ActionModal, AlertContainer } from "../../../../components/AlertBox";
import axiosInstance from "../../../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import config from "../../../../config/config";


interface VehicleType {
  vehicleTypeId: string;
  vehicleType: string;
  priorMinutes: number; 
   seatCapacity: number; 
   vehicleImg?: string[];
  trashed?: boolean;
}

const ITEMS_PER_PAGE = 8;

const ListVehicleType: React.FC = () => {
  const navigate = useNavigate();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState(""); // controlled input
  const [showTrashed, setShowTrashed] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHours, setEditHours] = useState("");
const [editSeats, setEditSeats] = useState(""); 
  const [currentPage, setCurrentPage] = useState(1);
const [editPriorMinutes, setEditPriorMinutes] = useState("");
const [currentImages, setCurrentImages] = useState<string[]>([]);
const [newImages, setNewImages] = useState<File[]>([]);
const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Modal state
  const [modalType, setModalType] = useState<"confirm-delete" | "delete-success" | "restore-success" | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);



const buildImageUrl = (filenameOrUrl: string) => {
  if (!filenameOrUrl) return "";
  if (/^https?:\/\//i.test(filenameOrUrl)) return filenameOrUrl;

  const BASE_URL = config.baseurl.apibaseurl;
  return `${BASE_URL}/uploads/vehicleImg/${filenameOrUrl}`;
};

  // Fetch API
  const fetchVehicleTypes = async () => {
    try {
      setLoading(true);
      let res;

      if (searchText.trim() !== "") {
        res = await axiosInstance.get<VehicleType[]>("/globalsearch", {
          params: {
            model: "vehicleType",
            keyword: searchText,
            isDeleted: showTrashed ? "1" : "0",
          },
        });
        setVehicleTypes(res.data || []);
      } else {
        res = await axiosInstance.get<{ data: VehicleType[] }>(
          `/vehicleType/getAllVehicleType${showTrashed ? "?status=1" : ""}`
        );
        setVehicleTypes(res.data?.data || []);
      }
    } catch (err) {
      
      showToast("Failed to load data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchVehicleTypes();
  }, [searchText, showTrashed]);

  // Pagination
  // const pageCount = Math.ceil(vehicleTypes.length / ITEMS_PER_PAGE) || 1;
  // const paginated = vehicleTypes.slice(
  //   (currentPage - 1) * ITEMS_PER_PAGE,
  //   currentPage * ITEMS_PER_PAGE
  // );

  // Edit Handlers
const openEdit = (v: VehicleType) => {
  setEditId(v.vehicleTypeId);
  setEditName(v.vehicleType);
  setEditPriorMinutes(v.priorMinutes?.toString() || "");
  setEditSeats(v.seatCapacity?.toString() || "");

  // ✅ convert filenames → full URLs
  const imgs = Array.isArray(v.vehicleImg) ? v.vehicleImg : [];

  setCurrentImages(imgs);
  setPreviewImages(imgs.map(img => buildImageUrl(img)));
  setNewImages([]);
};


  const closeEdit = () => {
    setEditId(null);
    setEditName("");
    setEditHours("");
      setEditSeats(""); 
  };
const saveEdit = async () => {
  if (!editId) return;

  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("vehicleType", editName);
    formData.append("priorMinutes", editPriorMinutes);
    formData.append("seatCapacity", editSeats);

    newImages.forEach(img => {
      formData.append("vehicleImg", img);
    });

    await axiosInstance.put(
      `/vehicleType/${editId}/update`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    showToast("Vehicle Type updated successfully!", "success");
    await fetchVehicleTypes();
    closeEdit();
  } catch (err: any) {
    showToast(err?.response?.data?.message || "Update failed", "error");
  } finally {
    setLoading(false);
  }
};


const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files) return;

  const files = Array.from(e.target.files);
  setNewImages(files);

  const previews = files.map(file => URL.createObjectURL(file));
  setPreviewImages(previews); // ✅ override current preview
};


  // Delete/Restore Handlers
  const handleDelete = (row: VehicleType) => {
    setSelectedVehicle(row);
    setModalType("confirm-delete");
  };
  const confirmDeleteAction = async () => {
    if (!selectedVehicle) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/vehicleType/${selectedVehicle.vehicleTypeId}/delete`);
      showToast(showTrashed ? "Vehicle Type permanently deleted!" : "Vehicle Type moved to trash!", "success");
      await fetchVehicleTypes();
      setModalType(null);
    } catch (err) {
    
      showToast("Deletion failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleRestore = async (row: VehicleType) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/vehicleType/${row.vehicleTypeId}/restore`);
      showToast("Vehicle Type restored successfully!", "success");
      setCurrentPage(1);
      await fetchVehicleTypes();
    } catch (err) {
     
      showToast("Restore failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns: Column<VehicleType>[] = [
    { header: "Vehicle Type", accessor: "vehicleType" },
    { header: "Advance Booking Hours", accessor:  "priorMinutes"  },
      { header: "Seat Capacity", accessor: "seatCapacity" },

  ];

  return (
    <PageLayout>
      <AlertContainer />
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">List Vehicle Type</h1>
        </div>

        {/* Search + Trash Toggle + Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center w-full sm:w-auto">
            <SearchBar
              placeholder="Search Vehicle Type..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={() => setSearchText(searchInput)}
            />
          </div>
          <TrashToggleButton showTrashed={showTrashed} onToggle={() => setShowTrashed((t) => !t)} />
          <CommonButton
            variant="success"
            className="w-full sm:w-auto"
            onClick={() => navigate("/vehicle/vehicletype/add")}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Vehicle Type</span>
          </CommonButton>
        </div>

        {/* Data Table */}
        <DataTable
          key={searchText + showTrashed + vehicleTypes.length}
          columns={columns}
          data={vehicleTypes}
          onEdit={!showTrashed ? openEdit : undefined}
          onDelete={!showTrashed ? handleDelete : undefined}
          onRestore={showTrashed ? handleRestore : undefined}
          loading={loading}
          rowsPerPage={5}
          emptyMessage="No vehicle types found."
        />

        {/* Pagination */}
        {/* <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Showing {pageCount === 0 ? 0 : currentPage} of {pageCount} pages
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div> */}

        {/* Edit Modal */}
        {editId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 w-full max-w-md relative shadow-2xl">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={closeEdit}
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Vehicle Type</h2>
              <InputBox
                name="editName"
                label="Vehicle Type Name"
                required
                placeholder="Enter vehicle type"
                value={editName}
                onChange={(name, value) => setEditName(value)}
              />
            <InputBox
  name="editPriorMinutes"
  label="Advance Booking Hours"
  type="number"
  required
  placeholder="Enter prior minutes"
  value={editPriorMinutes}
  onChange={(name, value) => setEditPriorMinutes(value)}
/>

              <InputBox
  name="editSeats"
  label="Seat Capacity"
  type="number"
  required
  placeholder="Enter seat capacity"
  value={editSeats}
  onChange={(name, value) => setEditSeats(value)}
/>

{/* Current / New Image Preview */}
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Vehicle Image
  </label>

  <div className="flex gap-3 flex-wrap mb-3">
    {previewImages.length > 0 ? (
      previewImages.map((img, index) => (
        <img
          key={index}
          src={img}
          alt="vehicle"
          className="w-24 h-24 object-cover rounded-lg border"
        />
      ))
    ) : (
      <span className="text-gray-400">No Image</span>
    )}
  </div>

  <input
    type="file"
    multiple
    accept="image/*"
    onChange={handleImageChange}
    className="block w-full text-sm text-gray-500"
  />
</div>



              <div className="flex justify-end space-x-3 mt-6">
                <CommonButton onClick={closeEdit} variant="secondary">
                  Cancel
                </CommonButton>
                <CommonButton onClick={saveEdit} variant="primary" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </CommonButton>
              </div>
            </div>
          </div>
        )}

        {/* Global Action Modal for Delete/Restore */}
        <ActionModal
          isOpen={modalType !== null}
          type={modalType as any}
          onClose={() => setModalType(null)}
          onConfirm={confirmDeleteAction}
          itemName={selectedVehicle?.vehicleType}
        />
      </div>
    </PageLayout>
  );
};

export default ListVehicleType;

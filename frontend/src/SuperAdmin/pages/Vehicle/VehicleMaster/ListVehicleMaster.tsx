import React, { useEffect, useState } from "react";
import PageLayout from "../../../../components/PageLayout";
import { DataTable, Column } from "../../../../components/DataTable";
import SearchBar from "../../../../components/SearchBar";
import TrashToggleButton from "../../../../components/TrashToggleButton";
import { ActionModal, showToast, AlertContainer } from "../../../../components/AlertBox";
import InputBox from "../../../../components/InputBox";
import axiosInstance from "../../../../utils/axiosInstance";
import CommonButton from "../../../../components/CommonButton";

interface VehicleMaster {
  id: string;
  vehicleNumber: string;
  vehicleModel: string;   // UI shows the model name
  vehicleType: string;    // UI shows the type name
  vendorName: string;
  trashed: boolean;
  // optional ids used by dropdowns (not always present in list API)
  vehicleId?: string;
  vehicleTypeId?: string;
  vendorId?: string;
}

interface VehicleAPIResponse {
  message: string;
  count: number;
  vehicles: {
    vehicleMasterId: string;
    vehicleNumber: string;
    vehicleModel?: string;        // some places may send this
    vehicleModelName?: string;    // our correct column in DB
    vehicleType: string;
    vendorName: string;
    isDeleted: number;
    vehicleId?: string;
    vehicleTypeId?: string;
    vendorId?: string;
  }[];
}

interface GlobalSearchVehicleMaster {
  vehicleMasterId: string;
  vehicleNumber: string;
  vehicleModelName: string;
  vehicleType: string;
  vendorName: string;
  isDeleted: number;
  vehicleId?: string;
  vehicleTypeId?: string;
  vendorId?: string;
}

type Option = {
  id: string;
  label: string;
  vehicleTypeId?: string; // 🔥 ADD THIS
};

const ITEMS_PER_PAGE = 10;

const ListVehicleMaster: React.FC = () => {
  const [vehicleMasters, setVehicleMasters] = useState<VehicleMaster[]>([]);
  const [search, setSearch] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [modalType, setModalType] = useState<"confirm-delete" | "confirm-restore" | null>(null);
  const [targetRow, setTargetRow] = useState<VehicleMaster | null>(null);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<VehicleMaster>>({});

  // Dropdown options
  const [modelOpts, setModelOpts] = useState<Option[]>([]);
  const [typeOpts, setTypeOpts]   = useState<Option[]>([]);
  const [vendorOpts, setVendorOpts] = useState<Option[]>([]);

  // ---------- Fetch dropdowns ----------
  useEffect(() => {
    (async () => {
      try {
        const [m, t, o] = await Promise.all([
          axiosInstance.get("/vehicleMaster/dropdown/models"), // { data: [{id,label}] }
          axiosInstance.get("/vehicleMaster/dropdown/types"),
          axiosInstance.get("/vehicleMaster/dropdown/vendors"),
        ]);
        setModelOpts(m.data?.data || []);
        setTypeOpts(t.data?.data || []);
        setVendorOpts(o.data?.data || []);
      } catch (e) {
        showToast("Failed to load dropdown data", "warn");
      }
    })();
  }, []);

  // ---------- Fetch list ----------
  const fetchVehicleMasters = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<VehicleAPIResponse>(
        `/vehicleMaster/getAllVehicleMaster?status=${showTrashed ? 1 : 0}`
      );
      const formatted: VehicleMaster[] = response.data.vehicles.map((item) => ({
        id: item.vehicleMasterId,
        vehicleNumber: item.vehicleNumber,
        vehicleModel: item.vehicleModel ?? item.vehicleModelName ?? "", // tolerate both keys
        vehicleType: item.vehicleType,
        vendorName: item.vendorName,
        trashed: item.isDeleted === 1,
        vehicleId: item.vehicleId,
        vehicleTypeId: item.vehicleTypeId,
        vendorId: item.vendorId,
      }));
      setVehicleMasters(formatted);
    } catch (err) {
     
      showToast("Failed to fetch vehicles", "error");
    } finally {
      setLoading(false);
    }
  };

const globalSearchFetch = async () => {
  const q = search.trim();
  if (!q) return fetchVehicleMasters();

  setLoading(true);
  try {
    const res = await axiosInstance.get(
      "/globalsearch",
      { params: { model: "vehiclemaster", keyword: q, isDeleted: showTrashed ? 1 : 0 } }
    );

    // Accept either:  [ ... ]  OR  { data: [ ... ] }
    const payload = res.data;
    const list: GlobalSearchVehicleMaster[] = Array.isArray(payload)
      ? payload
      : (payload?.data ?? []);

    const formatted: VehicleMaster[] = (list || []).map((item) => ({
      id: item.vehicleMasterId,
      vehicleNumber: item.vehicleNumber,
      vehicleModel: item.vehicleModelName,
      vehicleType: item.vehicleType,
      vendorName: item.vendorName,
      trashed: item.isDeleted === 1,
      vehicleId: item.vehicleId,
      vehicleTypeId: item.vehicleTypeId,
      vendorId: item.vendorId,
    }));

    setVehicleMasters(formatted);
    setCurrentPage(1);
  } catch (err) {
   
    showToast("Search failed", "error");
  } finally {
    setLoading(false);
  }
};


  // ---------- Delete / Restore ----------
  const confirmDelete = async () => {
    if (!targetRow) return;
    try {
      await axiosInstance.delete(`/vehicleMaster/${targetRow.id}/delete`);
      showToast("Vehicle deleted", "success");
      fetchVehicleMasters();
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setModalType(null);
      setTargetRow(null);
    }
  };

  const confirmRestore = async () => {
    if (!targetRow) return;
    try {
      await axiosInstance.put(`/vehicleMaster/${targetRow.id}/restore`);
      showToast("Vehicle restored", "success");
      if (showTrashed) {
        setVehicleMasters((prev) => prev.filter((v) => v.id !== targetRow.id));
      } else {
        fetchVehicleMasters();
      }
    } catch {
      showToast("Restore failed", "error");
    } finally {
      setModalType(null);
      setTargetRow(null);
    }
  };

  // ---------- Edit ----------
const openEditModal = (row: VehicleMaster) => {
  // 🔥 derive vehicleTypeId from label if missing
  const typeId =
    row.vehicleTypeId ??
    typeOpts.find((t) => t.label === row.vehicleType)?.id;

  // 🔥 derive vehicleId from model + type
  const modelId =
    row.vehicleId ??
    modelOpts.find(
      (m) =>
        m.label === row.vehicleModel &&
        m.vehicleTypeId === typeId
    )?.id;

  setEditData({
    ...row,
    vehicleTypeId: typeId,
    vehicleId: modelId,
  });

  setEditModalOpen(true);
};

  const closeEditModal = () => {
    setEditData({});
    setEditModalOpen(false);
  };

  const saveEdit = async () => {
    if (!editData.id) return;
    try {
      await axiosInstance.put(`/vehicleMaster/${editData.id}/update`, {
        vehicleNumber: editData.vehicleNumber,
        vehicleModelName: editData.vehicleModel,         // backend expects vehicleModelName
        vehicleType: editData.vehicleType,               // stored as string in VehicleMaster
        vendorName: editData.vendorName,
        // optional ids from dropdowns (if you want to keep FK columns in sync)
        vehicleId: (editData as any).vehicleId,
        vehicleTypeId: (editData as any).vehicleTypeId,
        vendorId: (editData as any).vendorId,
      });
      showToast("Updated successfully", "success");
      setVehicleMasters((prev) =>
        prev.map((v) => (v.id === editData.id ? { ...v, ...editData } as VehicleMaster : v))
      );
      closeEditModal();
    } catch (e: any) {
    // ✅ Extract message safely from backend response
    const errorMessage =
      e.response?.data?.message || "Update failed";

    showToast(errorMessage, "error");
  }
  };
const filteredModelOpts = modelOpts.filter(
  (m) =>
    !editData.vehicleTypeId ||
    m.vehicleTypeId === editData.vehicleTypeId
);


  // ---------- Pagination ----------
  const pageCount = Math.ceil(vehicleMasters.length / ITEMS_PER_PAGE) || 1;
  const paginated = vehicleMasters.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    fetchVehicleMasters();
  }, [showTrashed]);

  // ---------- Table Columns ----------
  const columns: Column<VehicleMaster>[] = [
    { header: "Vehicle Number", accessor: "vehicleNumber", sortable: true },
    { header: "Vehicle Model", accessor: "vehicleModel", sortable: true },
    { header: "Vehicle Type", accessor: "vehicleType", sortable: true },
    { header: "Owner Name", accessor: "vendorName", sortable: true },
  ];

  // ---------- Helpers to bind dropdowns ----------
  const getSelectedId = (opts: Option[], label?: string, id?: string) =>
    id ?? opts.find((o) => o.label === label)?.id ?? "";

  // put near other handlers
const handleInputBox = (a: any, b?: any) => {
  // supports onChange(value) OR onChange(name,value) OR onChange(event)
  let name: string;
  let value: string;

  if (typeof a === "string" && typeof b === "string") {
    // onChange(name, value)
    name = a;
    value = b;
  } else if (a?.target) {
    // onChange(event)
    name = a.target.name;
    value = a.target.value;
  } else {
    // onChange(value)
    name = "vehicleNumber";
    value = a ?? "";
  }

  setEditData((d) => ({ ...d, [name]: value }));
};


  return (
    <PageLayout>
      <AlertContainer />
      <div className="py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">List Vehicle Master</h1>
        </div>

        {/* Search & Trash Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-center py-5 space-y-4 sm:space-y-0 sm:space-x-4">
          <SearchBar
            placeholder="Search vehicles..."
            value={search}
            onChange={(v: any) => setSearch(typeof v === "string" ? v : v?.target?.value ?? "")}
            onSearch={globalSearchFetch}
          />
          <TrashToggleButton
            showTrashed={showTrashed}
            onToggle={() => {
              setShowTrashed((t) => !t);
              setSearch("");
              setCurrentPage(1);
            }}
          />
        </div>

        {/* DataTable */}
        <DataTable
          key={search + showTrashed + vehicleMasters.length}
          columns={columns}
          data={vehicleMasters} 
          onEdit={!showTrashed ? openEditModal : undefined}
          onDelete={
            !showTrashed ? (row) => { setTargetRow(row); setModalType("confirm-delete"); } : undefined
          }
          onRestore={
            showTrashed ? (row) => { setTargetRow(row); setModalType("confirm-restore"); } : undefined
          }
          // loading={loading}
          // rowsPerPage={ITEMS_PER_PAGE}
          // emptyMessage="No vehicle entries found."
          // uniqueRowKey="id"
        />

        {/* Pagination */}
        {/* <div className="flex justify-end mt-4 space-x-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${page === currentPage ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              {page}
            </button>
          ))}
        </div> */}

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 w-full max-w-lg relative shadow-2xl">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={closeEditModal}
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Vehicle Master</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle Number (free text) */}
                {/* <InputBox
                  name="vehicleNumber"
                  label="Vehicle Number"
                  value={editData.vehicleNumber || ""}
                  onChange={(val) => setEditData((d) => ({ ...d, vehicleNumber: val }))}
                  required
                /> */}
                <InputBox
  name="vehicleNumber"
  label="Vehicle Number"
  value={editData.vehicleNumber || ""}
  onChange={handleInputBox}
  required
/>
   {/* Vehicle Type (dropdown) */}
                <div>
                  <label className="text-sm font-medium block mb-1">Vehicle Type *</label>
                 <select
  className="border rounded px-3 py-2 w-full"
  value={getSelectedId(typeOpts, editData.vehicleType, editData.vehicleTypeId)}
  onChange={(e) => {
    const sel = typeOpts.find((t) => t.id === e.target.value);

    setEditData((d) => ({
      ...d,
      vehicleType: sel?.label || "",
      vehicleTypeId: sel?.id,
      vehicleModel: "",      // 🔥 reset
      vehicleId: undefined,  // 🔥 reset
    }));
  }}
>

                    <option value="">Select type...</option>
                    {typeOpts.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Vehicle Model (dropdown) */}
                <div>
                  <label className="text-sm font-medium block mb-1">Vehicle Model *</label>
                 <select
  className="border rounded px-3 py-2 w-full"
  value={getSelectedId(filteredModelOpts, editData.vehicleModel, editData.vehicleId)}
  onChange={(e) => {
    const sel = filteredModelOpts.find((m) => m.id === e.target.value);

    setEditData((d) => ({
      ...d,
      vehicleModel: sel?.label || "",
      vehicleId: sel?.id,
    }));
  }}
>
  <option value="">Select model...</option>
  {filteredModelOpts.map((m) => (
    <option key={m.id} value={m.id}>{m.label}</option>
  ))}
</select>

                </div>

             

                {/* Owner (dropdown) */}
                <div>
                  <label className="text-sm font-medium block mb-1">Owner Name *</label>
                  <select
                    className="border rounded px-3 py-2 w-full"
                    value={getSelectedId(vendorOpts, editData.vendorName, (editData as any).vendorId)}
                    onChange={(e) => {
                      const sel = vendorOpts.find((o) => o.id === e.target.value);
                      setEditData((d) => ({ ...d, vendorName: sel?.label || "", vendorId: sel?.id }));
                    }}
                  >
                    <option value="">Select owner...</option>
                    {vendorOpts.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* <div className="flex justify-end space-x-3 mt-6">
                <button className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                <button className="btn btn-primary" onClick={saveEdit}>Save</button>
              </div> */}
                 <div className="flex justify-end space-x-3 mt-6">
                              <CommonButton onClick={closeEditModal} variant="secondary">
                                Cancel
                              </CommonButton>
                              <CommonButton onClick={saveEdit} variant="primary" disabled={loading}>
                                {loading ? "Saving..." : "Save"}
                              </CommonButton>
                            </div>
            </div>
          </div>
        )}

        {/* Delete/Restore Modal */}
        <ActionModal
          isOpen={modalType !== null}
          type={modalType as any}
          onClose={() => { setModalType(null); setTargetRow(null); }}
          onConfirm={modalType === "confirm-delete" ? confirmDelete : confirmRestore}
          itemName={targetRow?.vehicleNumber}
        />
      </div>
    </PageLayout>
  );
};

export default ListVehicleMaster;

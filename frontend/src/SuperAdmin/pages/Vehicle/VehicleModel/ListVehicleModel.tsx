import React, { useState, useEffect } from 'react';
import PageLayout from '../../../../components/PageLayout';
import CommonButton from '../../../../components/CommonButton';
import InputBox from '../../../../components/InputBox';
import SearchBar from '../../../../components/SearchBar';
import TrashToggleButton from '../../../../components/TrashToggleButton';
import { AlertContainer, ActionModal, showToast } from '../../../../components/AlertBox';
import axiosInstance from '../../../../utils/axiosInstance';
import { DataTable, Column } from '../../../../components/DataTable';
import config from "../../../../config/config";

interface VehicleModel {
  vehicleId: string;
  vehicleName: string;
  vehicleTypeId: string;
    manufacturing: string;
  isDeleted: boolean;
  vehicleImg?: string[]; // array of full URLs for display
  // optional: keep raw filenames if you need to tell backend which existing images to keep
  vehicleImgFiles?: string[];
}

interface VehicleType {
  vehicleTypeId: string;
  vehicleType: string;
}

const ListVehicleModel: React.FC = () => {
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [search, setSearch] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<VehicleModel>>({});
  const [loading, setLoading] = useState(false);
  const [vehicleTypeMap, setVehicleTypeMap] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'confirm-delete' | 'confirm-permanent-delete' | 'confirm-restore' | 'delete-success' | 'restore-success';
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'confirm-delete' });

  // new state to store files selected in Edit modal
  const [editFiles, setEditFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const typeRes = await axiosInstance.get<{ data: VehicleType[] }>('/vehicleType/getAllVehicleType');
        const types = typeRes.data.data;
        const typeMap: Record<string, string> = {};
        types.forEach(t => {
          typeMap[t.vehicleTypeId] = t.vehicleType;
        });
        setVehicleTypeMap(typeMap);
      } catch (err) {
        showToast('Failed to load vehicle types.', 'error');
      }
      fetchVehicles();
    };
    fetchInitialData();
  }, [showTrashed]);

  const buildImageUrl = (filenameOrUrl: string) => {
    if (!filenameOrUrl) return '';
    if (/^https?:\/\//i.test(filenameOrUrl)) return filenameOrUrl;
        const BASE_URL = config.baseurl.apibaseurl;
    // derive base from axiosInstance or fallback to your production host
    const baseUrl = axiosInstance.defaults.baseURL
      ? axiosInstance.defaults.baseURL.replace(/\/api\/?$/, '')
      : BASE_URL;
    console.log("");
    return `${baseUrl}/uploads/vehicleImg/${filenameOrUrl}`;
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const isDeletedStatus = showTrashed ? '1' : '0';
      const response = await axiosInstance.get<{ vehicles: any[] }>(
        `/vehicle/getAllVehicles?isDeleted=${isDeletedStatus}`
      );

      const vehicles = (response.data.vehicles || []).map((v) => {
        // backend returns vehicleImg as array of filenames OR full urls
        const rawImgs = Array.isArray(v.vehicleImg) ? v.vehicleImg : (v.vehicleImg ? [v.vehicleImg] : []);
        const urls = rawImgs.map((f: string) => buildImageUrl(f));
        return {
          ...v,
          vehicleImg: urls,
          vehicleImgFiles: rawImgs // keep originals (filenames) if you later need to send existing ones back
        } as VehicleModel;
      });

      setVehicleModels(vehicles);
    } catch (err) {
      showToast('Failed to fetch vehicle data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (search.trim() === '') {
        fetchVehicles();
        return;
      }
      const isDeletedStatus = showTrashed ? '1' : '0';
      const response = await axiosInstance.get<any[]>(
        `/globalsearch?model=vehicle&keyword=${search}&isDeleted=${isDeletedStatus}`
      );
      // map images same as fetchVehicles
      const vehicles = (response.data || []).map((v: any) => {
        const rawImgs = Array.isArray(v.vehicleImg) ? v.vehicleImg : (v.vehicleImg ? [v.vehicleImg] : []);
        const urls = rawImgs.map((f: string) => buildImageUrl(f));
        return { ...v, vehicleImg: urls, vehicleImgFiles: rawImgs } as VehicleModel;
      });
      setVehicleModels(vehicles);
    } catch (err) {
      showToast('Failed to perform search.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (row: VehicleModel) => {
    setModal({
      isOpen: true,
      type: 'confirm-delete',
      onConfirm: async () => {
        try {
          await axiosInstance.put(`/vehicle/${row.vehicleId}/softDeleteVehicle`);
          showToast('Vehicle soft-deleted successfully!', 'success');
          fetchVehicles();
        } catch (error) {
          showToast('Failed to soft-delete vehicle.', 'error');
        }
      }
    });
  };

  const handleRestore = (row: VehicleModel) => {
    setModal({
      isOpen: true,
      type: 'confirm-restore',
      onConfirm: async () => {
        try {
          await axiosInstance.put(`/vehicle/${row.vehicleId}/restoreVehicle`);
          showToast('Vehicle restored successfully!', 'success');
          fetchVehicles();
        } catch (error) {
          showToast('Failed to restore vehicle.', 'error');
        }
      }
    });
  };

  const handlePermanentDelete = (row: VehicleModel) => {
    setModal({
      isOpen: true,
      type: 'confirm-permanent-delete',
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/vehicle/${row.vehicleId}/deleteVehicle`);
          showToast('Vehicle permanently deleted successfully!', 'success');
          fetchVehicles();
        } catch (error) {
          showToast('Failed to permanently delete vehicle.', 'error');
        }
      }
    });
  };

  const openEdit = (v: VehicleModel) => {
    setEditId(v.vehicleId);
    // set editData with values; keep vehicleImg as urls for preview and vehicleImgFiles if you need filenames
    setEditData({ ...v, vehicleTypeId: v.vehicleTypeId });
    setEditFiles([]);
  };

  const closeEdit = () => {
    setEditId(null);
    setEditData({});
    setEditFiles([]);
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      // If there are files selected, send multipart/form-data
      if (editFiles && editFiles.length > 0) {
        const formData = new FormData();

        if (editData.vehicleName) formData.append('vehicleName', String(editData.vehicleName));
        if (editData.vehicleTypeId) formData.append('vehicleTypeId', String(editData.vehicleTypeId));
        if (editData.manufacturing)
  formData.append('manufacturing', String(editData.manufacturing));

        // if (editData.localPerHour != null) formData.append('localPerHour', String(editData.localPerHour));
        // if (editData.localPerKm != null) formData.append('localPerKm', String(editData.localPerKm));
        // if (editData.OutstationPerKm != null) formData.append('OutstationPerKm', String(editData.OutstationPerKm));
        // if (editData.OSDriverBata != null) formData.append('OSDriverBata', String(editData.OSDriverBata));

        // if you want to tell backend which existing filenames to keep, send them here
        if (editData.vehicleImgFiles && editData.vehicleImgFiles.length > 0) {
          formData.append('existingImages', JSON.stringify(editData.vehicleImgFiles));
        }

        editFiles.forEach((file) => {
          // backend expects field name 'vehicleImg' as per your multer config
          formData.append('vehicleImg', file);
        });

        await axiosInstance.put(`/vehicle/${editId}/updateVehicle`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // no new files — send json
        await axiosInstance.put(`/vehicle/${editId}/updateVehicle`, editData);
      }

      showToast('Vehicle updated successfully!', 'success');
      fetchVehicles();
      closeEdit();
    } catch (error) {
      console.error(error);
      showToast('Failed to update vehicle.', 'error');
    }
  };

  const columns: Column<VehicleModel>[] = [
    {
      header: 'Image',
      accessor: 'vehicleImg',
      render: (row: VehicleModel) =>
        row.vehicleImg && row.vehicleImg.length > 0 ? (
          <div className="flex gap-2">
            {row.vehicleImg.slice(0, 3).map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={row.vehicleName}
                className="w-24 h-16 object-cover rounded border"
              />
            ))}
          </div>
        ) : (
          <span className="text-gray-400">No Image</span>
        ),
    },
    { header: 'Vehicle Name', accessor: 'vehicleName' },
    {
      header: 'Vehicle Type',
      accessor: 'vehicleTypeId',
      render: (row: VehicleModel) => vehicleTypeMap[row.vehicleTypeId] || 'Unknown'
    },
{ header: 'Manufacturer', accessor: 'manufacturing' },

  ];

  return (
    <PageLayout>
      <AlertContainer />
      <ActionModal
        isOpen={modal.isOpen}
        type={modal.type}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modal.onConfirm}
      />

      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {showTrashed ? 'Trashed Vehicle Models' : 'List Vehicle Model'}
        </h1>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <SearchBar
            placeholder="Search (Vehicle Name)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={handleSearch}
          />
          <TrashToggleButton
            showTrashed={showTrashed}
            onToggle={() => setShowTrashed(prev => !prev)}
          />
        </div>

        <DataTable
          key={search + showTrashed + vehicleModels.length}
          columns={columns}
          data={vehicleModels}
          loading={loading}
          onEdit={!showTrashed ? openEdit : undefined}
          onDelete={!showTrashed ? handleDelete : undefined}
          onRestore={showTrashed ? handleRestore : undefined}
          onPermanentDelete={showTrashed ? handlePermanentDelete : undefined}
          rowsPerPage={5}
          emptyMessage="No vehicle models found."
        />

        {/* Edit Modal */}
        {editId && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-xl relative">
              <button
                className="absolute top-2 right-5 text-3xl text-gray-500 hover:text-gray-800"
                onClick={closeEdit}
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">Edit Vehicle</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Vehicle Name</label>
                  <input
                    type="text"
                    value={editData.vehicleName || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, vehicleName: e.target.value })
                    }
                    className="w-full p-2 border"
                  />

                  <label className="block text-sm mt-2 mb-1">Vehicle Type</label>
                  <select
                    value={editData.vehicleTypeId || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, vehicleTypeId: e.target.value })
                    }
                    className="w-full p-2 border"
                  >
                    <option value="">-- Select Vehicle Type --</option>
                    {Object.entries(vehicleTypeMap).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
<label className="block text-sm mt-2 mb-1">Manufacturer</label>
<input
  type="text"
  value={editData.manufacturing || ''}
  onChange={(e) =>
    setEditData({ ...editData, manufacturing: e.target.value })
  }
  className="w-full p-2 border"
/>
                  {/* <label className="block text-sm mt-2 mb-1">Local Per Hour ₹</label>
                  <input
                    type="number"
                    value={editData.localPerHour ?? ''}
                    onChange={(e) =>
                      setEditData({ ...editData, localPerHour: Number(e.target.value) })
                    }
                    className="w-full p-2 border"
                  /> */}
                </div>


                {/* <div>
                  <label className="block text-sm mb-1">Local Per Km ₹</label>
                  <input
                    type="number"
                    value={editData.localPerKm ?? ''}
                    onChange={(e) =>
                      setEditData({ ...editData, localPerKm: Number(e.target.value) })
                    }
                    className="w-full p-2 border"
                  />

                  <label className="block text-sm mt-2 mb-1">Outstation Per Km ₹</label>
                  <input
                    type="number"
                    value={editData.OutstationPerKm ?? ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        OutstationPerKm: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border"
                  />

                  <label className="block text-sm mt-2 mb-1">Driver Batta ₹</label>
                  <input
                    type="number"
                    value={editData.OSDriverBata ?? ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        OSDriverBata: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border"
                  />
                </div> */}
              </div>

              {/* Images preview and upload */}
              <div className="mt-4">
                <label className="block text-sm mb-1">Current Images</label>
                <div className="flex gap-2">
                  {(editData.vehicleImg && editData.vehicleImg.length > 0) ? (
                    editData.vehicleImg.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt={`img-${i}`} className="w-24 h-16 object-cover rounded border" />
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                </div>
              </div>

              {/* <div className="mt-3">
                <label className="block text-sm mb-1">Upload New Image(s)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    setEditFiles(files);
                    // create local previews for immediate feedback
                    const previews = files.map(f => URL.createObjectURL(f));
                    setEditData(prev => ({ ...prev, vehicleImg: previews }));
                    // Note: you might want to store original existing filenames separately in vehicleImgFiles
                  }}
                  className="w-full"
                />
                {editFiles.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {editFiles.length} file(s) selected
                  </div>
                )}
              </div> */}
              <div className="mt-3">
  <label className="block text-sm mb-1">Upload New Image(s)</label>
  <input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      // ✅ Check all selected files
      const validFiles: File[] = [];
      for (const file of files) {
        if (file.size > 1 * 1024 * 1024) {
          // ✅ Toast for large file
          showToast("Image too large! Please select below 1 MB.", "error");
        } else {
          validFiles.push(file);
        }
      }

      // ✅ If no valid files, reset input and previews
      if (validFiles.length === 0) {
        e.target.value = "";
        setEditFiles([]);
        return;
      }

      // ✅ Save valid files and show preview
      setEditFiles(validFiles);
      const previews = validFiles.map((f) => URL.createObjectURL(f));
      setEditData((prev) => ({ ...prev, vehicleImg: previews }));
    }}
    className="w-full"
  />
  {editFiles.length > 0 && (
    <div className="mt-2 text-sm text-gray-600">
      {editFiles.length} file(s) selected
    </div>
  )}
</div>


              <div className="flex justify-end mt-4 space-x-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={closeEdit}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={saveEdit}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  );
};

export default ListVehicleModel;

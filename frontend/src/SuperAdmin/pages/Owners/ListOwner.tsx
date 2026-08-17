// src/SuperAdmin/pages/Owners/ListOwner.tsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PageLayout from '../../../components/PageLayout';
import { DataTable, Column } from '../../../components/DataTable';
import CommonButton from '../../../components/CommonButton';
import SearchBar from '../../../components/SearchBar';
import TrashToggleButton from '../../../components/TrashToggleButton';
import { showToast, ActionModal, AlertContainer } from '../../../components/AlertBox';
import InputBox, { getFormStore } from '../../../components/InputBox';
import axiosInstance from '../../../utils/axiosInstance';
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

// Define the data types
type Owner = {
  ownerId: string;
  ownerName: string;
  email: string;
  phno?: string;
  address?: string;
  country: string;
  state: string;
  city: string;
  vehicleId?: string;
  isDeleted: boolean;
};

const OwnerList: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showTrashed, setShowTrashed] = useState<boolean>(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);

  // Modal states for delete/restore confirmation
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'confirm-delete' | 'restore-success'>('confirm-delete');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);

  const [countries] = useState<ICountry[]>(Country.getAllCountries());
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  // Function to fetch owners from the API
  const fetchOwners = async () => {
    setLoading(true);
    try {
      const isDeletedStatus = showTrashed ? '1' : '0';
      let fetchedData: Owner[] = [];

      if (search.trim() !== '') {
        const res = await axiosInstance.get<Owner[]>(
          `/globalsearch?model=owner&keyword=${encodeURIComponent(search)}&isDeleted=${isDeletedStatus}`
        );
        fetchedData = res.data || [];
      } else {
        const res = await axiosInstance.get<{ owner: Owner[] }>(
          `/owner/getAllOwner?status=${isDeletedStatus}`
        );
        fetchedData = res.data.owner || [];
      }
      setOwners(fetchedData);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch owners.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, [showTrashed]);

  // Handle cascading dropdowns in the edit modal
  useEffect(() => {
    if (editingOwner?.country) {
      const selectedCountry = countries.find((c: ICountry) => c.name === editingOwner.country);
      if (selectedCountry) {
        setStates(State.getStatesOfCountry(selectedCountry.isoCode));
      }
    }
  }, [editingOwner?.country]);

  useEffect(() => {
    if (editingOwner?.country && editingOwner?.state) {
      const selectedCountry = countries.find((c: ICountry) => c.name === editingOwner.country);
      const selectedState = states.find((s: IState) => s.name === editingOwner.state);
      if (selectedCountry && selectedState) {
        setCities(City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode));
      }
    }
  }, [editingOwner?.state, states]);

  // Handle edit flow
  const openEditModal = (owner: Owner) => {
    setEditingOwner(owner);
  };

  const handleCancelEdit = () => {
    setEditingOwner(null);
  };

  const handleSaveEdit = async () => {
    if (!editingOwner) return;

    const updatedData = getFormStore();

    try {
      await axiosInstance.put(`/owner/updateOwner/${editingOwner.ownerId}`, {
        ownerName: updatedData.ownerName || editingOwner.ownerName,
        email: updatedData.email || editingOwner.email,
        phno: updatedData.phno || editingOwner.phno,
        address: `${updatedData.address1 || ''}, ${updatedData.address2 || ''}`,
        country: updatedData.country || editingOwner.country,
        state: updatedData.state || editingOwner.state,
        city: updatedData.city || editingOwner.city,
        vehicleId: updatedData.vehicleId || editingOwner.vehicleId,
      });

      await fetchOwners();
      setEditingOwner(null);
      showToast('Owner details updated successfully!', 'success');
    } catch (err) {
      console.error('Failed update:', err);
      showToast('Update failed. Please try again.', 'error');
    }
  };

  // Handle delete and restore flow
  const handleDelete = (owner: Owner) => {
    setSelectedOwner(owner);
    setModalType('confirm-delete');
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedOwner) return;
    try {
      await axiosInstance.delete(`/owner/deleteOwner/${selectedOwner.ownerId}`);
      await fetchOwners();
      showToast(`Owner ${selectedOwner.ownerName} has been moved to trash.`, 'success');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Deletion failed. Please try again.', 'error');
    } finally {
      setSelectedOwner(null);
      setModalOpen(false);
    }
  };

  const handleRestore = async (owner: Owner) => {
    try {
      await axiosInstance.put(`/owner/${owner.ownerId}/restore`);
      await fetchOwners();
      showToast(`Owner ${owner.ownerName} has been restored successfully.`, 'success');
    } catch (err) {
      console.error('Restore failed:', err);
      showToast('Restore failed. Please try again.', 'error');
    }
  };

  // Define columns for the DataTable component
  const columns: Column<Owner>[] = [
    { header: 'Owner Name', accessor: 'ownerName' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Country', accessor: 'country' },
    { header: 'State', accessor: 'state' },
    { header: 'City', accessor: 'city' },
  ];

  const handleSearch = () => {
    fetchOwners();
  };

  return (
    <PageLayout>
      <div className="py-6">
        <AlertContainer />
        <div className="max-w-7xl mx-auto">
          {/* Header and Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">List Owner</h1>
            <div className="flex items-center gap-3">
              <SearchBar
                placeholder="Search Owner (Name, Email, City...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={handleSearch}
              />
              <TrashToggleButton showTrashed={showTrashed} onToggle={() => setShowTrashed(!showTrashed)} />
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={owners}
            loading={loading} // Correctly passes the loading state
            onEdit={!showTrashed ? openEditModal : undefined}
            onDelete={!showTrashed ? handleDelete : undefined}
            onRestore={showTrashed ? handleRestore : undefined}
            rowsPerPage={10}
            emptyMessage="No owners found." // Use 'emptyMessage' prop
          />
        </div>

        {/* Edit Modal */}
        {editingOwner && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg relative shadow-2xl">
              <button
                onClick={handleCancelEdit}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Owner</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputBox label="Owner Name" name="ownerName" defaultValue={editingOwner.ownerName} />
                <InputBox label="Email Address" name="email" defaultValue={editingOwner.email} />
                <InputBox label="Phone Number" name="phno" defaultValue={editingOwner.phno} />
                <InputBox label="Address 1" name="address1" defaultValue={editingOwner.address?.split(', ')[0]} />
                <InputBox label="Address 2" name="address2" defaultValue={editingOwner.address?.split(', ')[1]} />
                <InputBox
                  label="Country"
                  name="country"
                  type="select"
                  options={countries.map((c: ICountry) => ({ value: c.name, label: c.name }))}
                  defaultValue={editingOwner.country}
                />
                <InputBox
                  label="State"
                  name="state"
                  type="select"
                  options={states.map((s: IState) => ({ value: s.name, label: s.name }))}
                  defaultValue={editingOwner.state}
                />
                <InputBox
                  label="City"
                  name="city"
                  type="select"
                  options={cities.map((c: ICity) => ({ value: c.name, label: c.name }))}
                  defaultValue={editingOwner.city}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <CommonButton onClick={handleCancelEdit} variant="secondary" className="px-4 py-2">
                  Cancel
                </CommonButton>
                <CommonButton onClick={handleSaveEdit} variant="primary" className="px-4 py-2">
                  Save
                </CommonButton>
              </div>
            </div>
          </div>
        )}

        {/* Action Modal for Delete/Restore */}
        <ActionModal
          isOpen={modalOpen}
          type={modalType}
          onClose={() => setModalOpen(false)}
          onConfirm={confirmDelete}
        />
      </div>
    </PageLayout>
  );
};

export default OwnerList;
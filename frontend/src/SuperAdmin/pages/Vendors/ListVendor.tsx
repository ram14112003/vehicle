import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PageLayout from '../../../components/PageLayout';
import { DataTable, Column } from '../../../components/DataTable';
import CommonButton from '../../../components/CommonButton';
import SearchBar from '../../../components/SearchBar';
import TrashToggleButton from '../../../components/TrashToggleButton';
import { showToast, ActionModal, AlertContainer } from '../../../components/AlertBox';
import axiosInstance from '../../../utils/axiosInstance';
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

type Vendor = {
  vendorId: string;
  vendorName: string;
  email: string;
  phno?: string;
  address?: string;
  country: string;
  state: string;
  city: string;
  vehicleId?: string;
  isDeleted: boolean;
};

const VendorList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showTrashed, setShowTrashed] = useState<boolean>(false);

  // Edit modal state
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Controlled form for modal
  const [form, setForm] = useState({
    vendorName: '',
    email: '',
    phno: '',
    address1: '',
    address2: '',
    country: '',
    state: '',
    city: '',
  });

  // Cascading lists
  const [countries] = useState<ICountry[]>(Country.getAllCountries());
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCountryIso, setSelectedCountryIso] = useState<string>('');
  const [selectedStateIso, setSelectedStateIso] = useState<string>('');

  // Delete/restore modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'confirm-delete' | 'restore-success'>('confirm-delete');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const isDeletedStatus = showTrashed ? '1' : '0';
      let fetchedData: Vendor[] = [];

      if (search.trim() !== '') {
        const res = await axiosInstance.get<Vendor[]>(
          `/globalsearch?model=vendor&keyword=${encodeURIComponent(search)}&isDeleted=${isDeletedStatus}`
        );
        fetchedData = res.data || [];
      } else {
        const res = await axiosInstance.get<{ vendors: Vendor[] }>(
          `/vendor/getAllVendors?status=${isDeletedStatus}`
        );
        fetchedData = res.data.vendors || [];
      }
      setVendors(fetchedData);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch owners.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, [showTrashed]);

  // ---------- Edit Modal Helpers ----------

  const openEditModal = (owner: Vendor) => {
    setEditingVendor(owner);

    // split address
    const [a1 = '', a2 = ''] = (owner.address || '').split(',').map(s => s?.trim() || '');

    setForm({
      vendorName: owner.vendorName || '',
      email: owner.email || '',
      phno: owner.phno || '',
      address1: a1,
      address2: a2,
      country: owner.country || '',
      state: owner.state || '',
      city: owner.city || '',
    });

    // prime cascading lists for the existing values
    const c = countries.find(cc => cc.name === owner.country);
    if (c) {
      setSelectedCountryIso(c.isoCode);
      const st = State.getStatesOfCountry(c.isoCode);
      setStates(st);

      const s = st.find(ss => ss.name === owner.state);
      if (s) {
        setSelectedStateIso(s.isoCode);
        setCities(City.getCitiesOfState(c.isoCode, s.isoCode));
      } else {
        setSelectedStateIso('');
        setCities([]);
      }
    } else {
      setSelectedCountryIso('');
      setStates([]);
      setCities([]);
      setSelectedStateIso('');
    }
  };

  const handleCancelEdit = () => {
    setEditingVendor(null);
    setStates([]);
    setCities([]);
    setSelectedCountryIso('');
    setSelectedStateIso('');
  };

  const handleSaveEdit = async () => {
    if (!editingVendor) return;

    try {
      await axiosInstance.put(`/owner/updateOwner/${editingVendor.vendorId}`, {
        vendorName: form.vendorName,
        email: form.email,
        phno: form.phno,
        address: `${form.address1}${form.address2 ? ', ' + form.address2 : ''}`,
        country: form.country,
        state: form.state,
        city: form.city,
        vehicleId: editingVendor.vehicleId,
      });

      await fetchVendors();
      setEditingVendor(null);
      showToast('Owner details updated successfully!', 'success');
    } catch (err) {
      console.error('Failed update:', err);
      showToast('Update failed. Please try again.', 'error');
    }
  };

  // ---------- Cascading Handlers ----------

  const onCountryChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const countryName = e.target.value;
    setForm(prev => ({ ...prev, country: countryName, state: '', city: '' }));

    const c = countries.find(cc => cc.name === countryName);
    if (c) {
      setSelectedCountryIso(c.isoCode);
      const st = State.getStatesOfCountry(c.isoCode);
      setStates(st);
      setSelectedStateIso('');
      setCities([]);
    } else {
      setSelectedCountryIso('');
      setStates([]);
      setSelectedStateIso('');
      setCities([]);
    }
  };

  const onStateChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const stateName = e.target.value;
    setForm(prev => ({ ...prev, state: stateName, city: '' }));

    const s = states.find(ss => ss.name === stateName);
    if (s && selectedCountryIso) {
      setSelectedStateIso(s.isoCode);
      setCities(City.getCitiesOfState(selectedCountryIso, s.isoCode));
    } else {
      setSelectedStateIso('');
      setCities([]);
    }
  };

  const onCityChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    setForm(prev => ({ ...prev, city: e.target.value }));
  };

  // ---------- Delete / Restore ----------

  const handleDelete = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setModalType('confirm-delete');
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedVendor) return;
    try {
      await axiosInstance.delete(`/owner/deleteOwner/${selectedVendor.vendorId}`);
      await fetchVendors();
      showToast(`Owner ${selectedVendor.vendorName} has been moved to trash.`, 'success');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Deletion failed. Please try again.', 'error');
    } finally {
      setSelectedVendor(null);
      setModalOpen(false);
    }
  };

  const handleRestore = async (owner: Vendor) => {
    try {
      await axiosInstance.put(`/owner/${owner.vendorId}/restore`);
      await fetchVendors();
      showToast(`Owner ${owner.vendorName} has been restored successfully.`, 'success');
    } catch (err) {
      console.error('Restore failed:', err);
      showToast('Restore failed. Please try again.', 'error');
    }
  };

  // ---------- Table ----------

  const columns: Column<Vendor>[] = [
    { header: 'Owner Name', accessor: 'vendorName' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Country', accessor: 'country' },
    { header: 'State', accessor: 'state' },
    { header: 'City', accessor: 'city' },
  ];

  const handleSearch = () => { fetchVendors(); };

  return (
    <PageLayout>
      <div className="py-6">
        <AlertContainer />
        <div className="max-w-7xl mx-auto">
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

          <DataTable
            columns={columns}
            data={vendors}
            loading={loading}
            onEdit={!showTrashed ? openEditModal : undefined}
            onDelete={!showTrashed ? handleDelete : undefined}
            onRestore={showTrashed ? handleRestore : undefined}
            rowsPerPage={10}
            emptyMessage="No owners found."
          />
        </div>

        {/* Edit Modal */}
        {editingVendor && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl relative shadow-2xl">
              <button onClick={handleCancelEdit} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Owner</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Text inputs (controlled) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form.vendorName}
                    onChange={e => setForm(p => ({ ...p, vendorName: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form.phno}
                    onChange={e => setForm(p => ({ ...p, phno: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address 1</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form.address1}
                    onChange={e => setForm(p => ({ ...p, address1: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address 2</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form.address2}
                    onChange={e => setForm(p => ({ ...p, address2: e.target.value }))}
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.country}
                    onChange={onCountryChange}
                  >
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.state}
                    onChange={onStateChange}
                    disabled={!selectedCountryIso || states.length === 0}
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={`${selectedCountryIso}-${s.isoCode}`} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.city}
                    onChange={onCityChange}
                    disabled={!selectedStateIso || cities.length === 0}
                  >
                    <option value="">Select City</option>
                    {cities.map((c) => (
                      <option key={`${selectedCountryIso}-${selectedStateIso}-${c.name}`} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
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

export default VendorList;


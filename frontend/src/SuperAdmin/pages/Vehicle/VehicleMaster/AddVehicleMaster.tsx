

import React, { useEffect, useState } from 'react';
import PageLayout from '../../../../components/PageLayout';
import InputBox, { getFormStore } from '../../../../components/InputBox';
import CommonButton from '../../../../components/CommonButton';
import { AlertContainer, showToast } from '../../../../components/AlertBox';
import { faCar, faIdCard, faUser,faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axiosInstance from '../../../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import VendorList from '../../Vendors/ListVendor';

interface Vendor {
  vendorId: string;
  vendorName: string;
}

interface VehicleModel {
  vehicleId: string;
  vehicleName: string;
}

const AddVehicleMaster: React.FC = () => {
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await axiosInstance.get('/vendor/getAllVendors');
        setVendorsList(res.data.vendors || []);
      } catch (err) {
        console.error('Error fetching owners:', err);
        showToast('Failed to fetch owners.', 'error');
      }
    };

    const fetchVehicleModels = async () => {
      try {
        const res = await axiosInstance.get('/vehicle/getAllVehicles');
        setVehicleModels(res.data.vehicles || []);
      } catch (err) {
        console.error('Error fetching vehicle models:', err);
        showToast('Failed to fetch vehicle models.', 'error');
      }
    };

    fetchVendors();
    fetchVehicleModels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = getFormStore();
    const { vehicleNumber, vehicleModel, vendors } = form;

    if (!vehicleNumber?.trim() || !vehicleModel || !vendors) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    try {
      const selectedVendor = vendorsList.find(o => o.vendorId === vendors);
      const payload = {
        vehicleNumber,
        vehicleId: vehicleModel,
        vendorId: vendors,
        vendors: selectedVendor?.vendorName || '',
      };

      const res = await axiosInstance.post('/vendor/createVehicleMaster', payload);

      if (res.status === 201 || res.status === 200) {
        showToast('Vehicle master added successfully!', 'success');

        // ✅ Clear form manually
        setTimeout(() => {
          const inputs = document.querySelectorAll('input, select') as NodeListOf<HTMLInputElement | HTMLSelectElement>;
          inputs.forEach(input => input.value = '');
        }, 100);

        navigate('/vehicle/vehiclemaster/list');
      } else {
        showToast('Something went wrong. Try again.', 'error');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      showToast('Server error. Please try again.', 'error');
    }
  };

  const vehicleModelOptions = [
    { value: '', label: 'Select a vehicle model' },
    ...vehicleModels.map(v => ({
      value: v.vehicleId,
      label: v.vehicleName,
    })),
  ];

  const vendorOptions = [
    { value: '', label: 'Select a owner' },
    ...vendorsList.map(o => ({
      value: o.vendorId,
      label: o.vendorName,
    })),
  ];

  return (
    <PageLayout>
      <AlertContainer />

      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-800">Add Vehicle Master</h1>

        <form onSubmit={handleSubmit} className="max-w-4xl text-left">
          <div className="text-lg font-semibold text-[#275981] py-5 underline" >
            
           <FontAwesomeIcon icon={faClipboardList} /> Vehicle Type Info</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="flex flex-col gap-4 w-[280px]">
              <InputBox
                label="Vehicle Number"
                name="vehicleNumber"
                placeholder="Enter Vehicle Number"
                required
                icon={faIdCard}
              />
              <span className="text-xs text-gray-400">Enter a vehicle number E.g: CM 8643</span>

              <InputBox
                label="Owner"
                name="vendors"
                options={vendorOptions}
                required
                icon={faUser}
              />
              <span className="text-xs text-gray-400">Select a owner</span>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4 w-[280px]">
              <InputBox
                label="Vehicle Model"
                name="vehicleModel"
                options={vehicleModelOptions}
                required
                icon={faCar}
              />
              <span className="text-xs text-gray-400">Select a vehicle model</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <CommonButton type="submit" variant="success" className="px-8 py-2">
              Save
            </CommonButton>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default AddVehicleMaster;

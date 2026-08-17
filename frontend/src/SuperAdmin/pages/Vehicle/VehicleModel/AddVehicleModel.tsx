import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../../../components/PageLayout';
import CommonButton from '../../../../components/CommonButton';
import InputBox, { getFormStore } from '../../../../components/InputBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCar,
  faClock,
  faRoad,
  faCogs,
  faImage,
  faList,
  faTachometerAlt,
  faUserClock,
} from '@fortawesome/free-solid-svg-icons';
import { showToast, AlertContainer } from '../../../../components/AlertBox';
import axiosInstance from '../../../../utils/axiosInstance';

interface VehicleType {
  vehicleType: string;
  vehicleTypeId: string;
}

const AddVehicleModel: React.FC = () => {
  const navigate = useNavigate();
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [vehicleImagePreview, setVehicleImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const res = await axiosInstance.get<{ data: VehicleType[] }>('/vehicleType/getAllVehicleType');
        const formattedTypes = res.data.data.map(type => ({
          value: type.vehicleTypeId,
          label: type.vehicleType,
        }));
        setVehicleTypeOptions([{ value: '', label: 'Select a vehicle type' }, ...formattedTypes]);
      } catch (error) {
        console.error('Error fetching vehicle types:', error);
        showToast('Failed to load vehicle types.', 'error');
      }
    };
    fetchVehicleTypes();
  }, []);

  // Update image preview when file is selected
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVehicleImagePreview(URL.createObjectURL(file));
    }
  };
const handleVehicleImageChange = (name: string, value: any) => {
  // 'value' here is the file selected from InputBox
  if (value instanceof File) {
    setVehicleImagePreview(URL.createObjectURL(value));
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formValues = getFormStore();

    if (formValues.vehicleTypeId) {
      const selectedType = vehicleTypeOptions.find(opt => opt.value === formValues.vehicleTypeId);
      formValues.vehicleTypeLabel = selectedType?.label || '';
    }

    if (
      !formValues.vehicleName ||
      !formValues.vehicleTypeId ||
      // !formValues.localPerHour ||
      // !formValues.localPerKm ||
      // !formValues.outStationPerKm ||
      // !formValues.outStationDriverBatta ||
      !formValues.manufacturing ||

      !formValues.vehicleImage
    ) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('vehicleName', formValues.vehicleName);
      formData.append('vehicleTypeId', formValues.vehicleTypeId);
      formData.append('vehicleType', formValues.vehicleTypeLabel || '');
      // formData.append('localPerHour', formValues.localPerHour);
      // formData.append('localPerKm', formValues.localPerKm);
      // formData.append('OutstationPerKm', formValues.outStationPerKm);
      // formData.append('OSDriverBata', formValues.outStationDriverBatta);
      formData.append('manufacturing', formValues.manufacturing);

      formData.append('vehicleImg', formValues.vehicleImage as Blob);
      formData.append('availableStatus', 'Available');

      await axiosInstance.post('/vendor/createVehicle', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('Vehicle model saved successfully!', 'success');
      setTimeout(() => navigate('/vehicle/vehiclemodel/list'), 1000);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Something went wrong. Please try again.', 'error');
    }
  };

  return (
    <PageLayout>
      <div className="py-6">
        <AlertContainer />
        <h1 className="text-3xl font-bold text-gray-800">Add Vehicle Model</h1>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="text-lg font-semibold text-[#275981] py-5 underline">
            <FontAwesomeIcon icon={faCogs} /> Vehicle Model Info
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            {/* Left Column */}
            <div className="flex flex-col gap-4">
              <InputBox label="Vehicle Name" name="vehicleName" placeholder="Vehicle Name" required icon={faCar} />
              {/* <InputBox label="Local Per Hour" name="localPerHour" placeholder="Per Hour" required icon={faClock} />
              <InputBox label="Out Station Per Km" name="outStationPerKm" placeholder="Per Km" required icon={faRoad} /> */}
<InputBox
  label="Manufacturer"
  name="manufacturing"
  placeholder="Manufacturer"
  required
  icon={faCogs}
/>

   
     

            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-4">
              <InputBox
                label="Vehicle Type"
                name="vehicleTypeId"
                options={vehicleTypeOptions}
                required
                icon={faList}
              />
              {/* <InputBox label="Local Per Km" name="localPerKm" placeholder="Per Km" required icon={faTachometerAlt} />
              <InputBox
                label="Out Station Driver Batta Per Day"
                name="outStationDriverBatta"
                placeholder="Driver Batta"
                required
                icon={faUserClock}
              /> */}

                             <div>
                  <label className="block text-sm font-medium text-black mb-1">
    Vehicle Image
  </label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        // ✅ 1 MB size check
        if (file.size > 1 * 1024 * 1024) {
          showToast("Image too large! Please select below 1 MB.", "error");
          e.target.value = ""; // reset input
          return;
        }

        // ✅ show preview & store file
        setVehicleImagePreview(URL.createObjectURL(file));
        getFormStore().vehicleImage = file;
      }
    }}
      className="block w-full border border-gray-300 rounded-lg p-2"

  />

  {vehicleImagePreview && (
    <img
      src={vehicleImagePreview}
      alt="Vehicle Preview"
      className="mt-2 w-48 h-32 object-cover border rounded"
    />
  )}
</div>
            </div>

      
          </div>

          <div className="flex justify-end mt-6">
            <CommonButton type="submit" variant="success">
              Save
            </CommonButton>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default AddVehicleModel;

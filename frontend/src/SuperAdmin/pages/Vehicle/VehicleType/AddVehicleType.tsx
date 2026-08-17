// import React, { useState } from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faCar, faClock, faPlusCircle, faTruck, faUsers } from '@fortawesome/free-solid-svg-icons';
// import PageLayout from '../../../../components/PageLayout';
// import CommonButton from '../../../../components/CommonButton';
// import InputBox from '../../../../components/InputBox';
// import { showToast, AlertContainer } from '../../../../components/AlertBox';
// import axiosInstance from '../../../../utils/axiosInstance';
// import { useNavigate } from 'react-router-dom';

// const AddVehicleType: React.FC = () => {
//   const navigate = useNavigate();
//   const [vehicleType, setVehicleType] = useState('');
//   const [advanceBookingHours, setAdvanceBookingHours] = useState('');
//   const [seatCapacity, setSeatCapacity] = useState('');
//   const [errors, setErrors] = useState<{ vehicleType?: string; advanceBookingHours?: string; seatCapacity?: string }>({});
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const newErrors: typeof errors = {};

//     if (!vehicleType.trim()) {
//       newErrors.vehicleType = 'Vehicle Type is required';
//     }
//     if (!advanceBookingHours.trim()) {
//       newErrors.advanceBookingHours = 'Advance Booking Hours is required';
//     }
//     if (!seatCapacity.trim()) {
//       newErrors.seatCapacity = 'Seat Capacity is required';
//     }

//     setErrors(newErrors);

//     if (Object.keys(newErrors).length === 0) {
//       try {
//         setLoading(true);

//         const payload = {
//           vehicleType,
//           AdvanceBookingHours: advanceBookingHours, // match backend
//           seatCapacity: Number(seatCapacity),
//         };

//         const res = await axiosInstance.post('/vendor/createVehicleType', payload);

//         if (res.status === 201) {
//           showToast('Vehicle Type added successfully!', 'success');
//           setVehicleType('');
//           setAdvanceBookingHours('');
//           setSeatCapacity('');

//           setTimeout(() => {
//             navigate('/vehicle/vehicletype/list');
//           }, 1000);
//         }
//       } catch (err: any) {
//         const errorMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
//         showToast(errorMsg, 'error');
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   return (
//     <PageLayout>
//       <AlertContainer />
//       <main className="py-6">
//         <h1 className="text-3xl font-bold text-gray-800">Add Vehicle Type</h1>
//         <div className="text-lg font-semibold text-[#275981] py-5 underline">
//           <FontAwesomeIcon icon={faTruck} /> Vehicle Master Info
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
//             <InputBox
//               label="Vehicle Type"
//               name="vehicleType"
//               required
//               placeholder="Enter a vehicle type"
//               icon={faCar}
//               value={vehicleType}
//               onChange={(name, value) => setVehicleType(value)}
//               error={errors.vehicleType}
//             />

//             <InputBox
//               label="Advance Booking Hours"
//               name="advanceBookingHours"
//               type="number"
//               required
//               placeholder="Enter advance booking hours"
//               icon={faClock}
//               value={advanceBookingHours}
//               onChange={(name, value) => setAdvanceBookingHours(value)}
//               error={errors.advanceBookingHours}
//             />

//             <InputBox
//               label="Seat Capacity"
//               name="seatCapacity"
//               type="number"
//               required
//               placeholder="Enter seat capacity"
//               icon={faUsers}
//               value={seatCapacity}
//               onChange={(name, value) => setSeatCapacity(value)}
//               error={errors.seatCapacity}
//             />
//           </div>

//           <div className="flex justify-end">
//             <CommonButton
//               type="submit"
//               variant="success"
//               className="px-6 py-2 text-lg"
//               disabled={loading}
//             >
//               <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
//               {loading ? 'Submitting...' : 'Submit'}
//             </CommonButton>
//           </div>
//         </form>
//       </main>
//     </PageLayout>
//   );
// };

// export default AddVehicleType;



import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faClock, faPlusCircle, faTruck, faUsers } from '@fortawesome/free-solid-svg-icons';
import PageLayout from '../../../../components/PageLayout';
import CommonButton from '../../../../components/CommonButton';
import InputBox from '../../../../components/InputBox';
import { showToast, AlertContainer } from '../../../../components/AlertBox';
import axiosInstance from '../../../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';

const AddVehicleType: React.FC = () => {
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState('');
  const [seatCapacity, setSeatCapacity] = useState('');
  const [priorMinutes, setPriorMinutes] = useState(''); // ✅ NEW
  const [errors, setErrors] = useState<{
    vehicleType?: string;
    advanceBookingHours?: string;
    seatCapacity?: string;
    priorMinutes?: string; // ✅ NEW
  }>({});
  const [loading, setLoading] = useState(false);
const [vehicleImages, setVehicleImages] = useState<File[]>([]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const newErrors: typeof errors = {};
  if (!vehicleType.trim()) newErrors.vehicleType = "Vehicle Type is required";
  if (!seatCapacity.trim()) newErrors.seatCapacity = "Seat Capacity is required";
  if (!priorMinutes.trim())
    newErrors.priorMinutes = "Advance Booking Hours is required";

  setErrors(newErrors);
  if (Object.keys(newErrors).length !== 0) return;

  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("vehicleType", vehicleType);
    formData.append("seatCapacity", seatCapacity);
    formData.append("priorMinutes", priorMinutes);

    vehicleImages.forEach((file) => {
      formData.append("vehicleImg", file); // 🔥 same name as backend
    });

    const res = await axiosInstance.post(
      "/vendor/createVehicleType",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    if (res.status === 201) {
      showToast("Vehicle Type added successfully!", "success");
      navigate("/vehicle/vehicletype/list");
    }
  } catch (err: any) {
    showToast(
      err.response?.data?.message || "Something went wrong",
      "error"
    );
  } finally {
    setLoading(false);
  }
};

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files ? Array.from(e.target.files) : [];

  if (files.length === 0) return;

  const validFiles: File[] = [];

  for (let file of files) {
    // ❌ size check
    if (file.size > MAX_FILE_SIZE) {
      showToast(
        `❌ ${file.name} size 5MB-ku mela irukku`,
        "error"
      );
      return; // stop here, images set aagathu
    }

    // ❌ type check (extra safety)
    if (!file.type.startsWith("image/")) {
      showToast("❌ Only image files allowed", "error");
      return;
    }

    validFiles.push(file);
  }

  setVehicleImages(validFiles); // ✅ only valid images
};

  return (
    <PageLayout>
      <AlertContainer />
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800">Add Vehicle Type</h1>
        <div className="text-lg font-semibold text-[#275981] py-5 underline">
          <FontAwesomeIcon icon={faTruck} /> Vehicle Master Info
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            <InputBox
              label="Vehicle Type"
              name="vehicleType"
              required
              placeholder="Enter a vehicle type"
              icon={faCar}
              value={vehicleType}
              onChange={(name, value) => setVehicleType(value)}
              error={errors.vehicleType}
            />

          

            <InputBox
              label="Seat Capacity"
              name="seatCapacity"
              type="number"
              required
              placeholder="Enter seat capacity"
              icon={faUsers}
              value={seatCapacity}
              onChange={(name, value) => setSeatCapacity(value)}
              error={errors.seatCapacity}
            />


            {/* ✅ NEW FIELD */}
         <InputBox
  label="Advance Booking Hours"
  name="priorMinutes"
  type="number"
  required
  placeholder="Enter Advance Booking Hours"
  icon={faClock}
  value={priorMinutes}
  onChange={(name, value) => setPriorMinutes(value)}
  error={errors.priorMinutes}
/>
<div>
  <label className="block text-sm font-medium text-black mb-1">
    Vehicle Image
  </label>

 <input
  type="file"
  multiple
  accept="image/*"
  onChange={(e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const validFiles: File[] = [];

    for (let file of files) {
      // 🔥 size check
      if (file.size > MAX_FILE_SIZE) {
        showToast(
          `${file.name} is too large! Please select below 5 MB.`,
          "error"
        );
        e.target.value = ""; // reset input so user can reselect
        return; // stop processing
      }

      // 🔥 type check
      if (!file.type.startsWith("image/")) {
        showToast("Only image files allowed", "error");
        e.target.value = "";
        return;
      }

      validFiles.push(file);
    }

    setVehicleImages(validFiles);
  }}
  className="block w-full border border-gray-300 rounded-lg p-2"
/>


  {vehicleImages.length > 0 && (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
    {vehicleImages.map((file, index) => (
      <div
        key={index}
        className="relative border rounded-lg overflow-hidden"
      >
        <img
          src={URL.createObjectURL(file)}
          alt={`preview-${index}`}
          className="w-full h-32 object-cover"
        />

        <p className="text-xs text-center p-1 truncate">
          {file.name}
        </p>
      </div>
    ))}
  </div>
)}

</div>

          </div>

          <div className="flex justify-end">
            <CommonButton
              type="submit"
              variant="success"
              className="px-6 py-2 text-lg"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
              {loading ? 'Submitting...' : 'Submit'}
            </CommonButton>
          </div>
        </form>
      </main>
    </PageLayout>
  );
};

export default AddVehicleType;
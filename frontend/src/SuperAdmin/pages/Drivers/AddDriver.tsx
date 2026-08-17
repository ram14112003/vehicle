
// import React, { useEffect, useState } from 'react';
// import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';
// import { useNavigate } from 'react-router-dom';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faEye, faEyeSlash,faIdCard,faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

// import {
//   faUser,
//   faLock,
//   faEnvelope,
//   faPhone,
//   faMapMarkerAlt,
//   faGlobe,
//   faCity,
//   faFlag,
//   faMapPin,
//   faCar
// } from '@fortawesome/free-solid-svg-icons';
// import PageLayout from '../../../components/PageLayout';
// import CommonButton from '../../../components/CommonButton';
// import InputBox from '../../../components/InputBox';
// import { showToast, AlertContainer } from '../../../components/AlertBox';
// import axiosInstance from '../../../utils/axiosInstance';

// interface DriverFormData {
//   name: string;
//   password: string;
//   address1: string;
//   address2: string;
//   email: string;
//   phone: string;
//   country: string;
//   state: string;
//   city: string;
//   pincode: string;
//   vehicleType: string;
//    licenseNo: string;  
//   licExpDate: string;
//   trackingSource: string;

// }

// type VehicleType = {
//   vehicleTypeId: string;
//   vehicleType: string;
// };

// type FormErrors = {
//   [K in keyof DriverFormData]?: string;
// };

// const AddDriverForm: React.FC = () => {
//   const [formData, setFormData] = useState<DriverFormData>({
//     name: '',
//     password: '',
//     address1: '',
//     address2: '',
//     email: '',
//     phone: '',
//     country: '',
//     state: '',
//     city: '',
//     pincode: '',
//     vehicleType: '',
//       licenseNo: '',   
//   licExpDate: '', 
//     trackingSource: '',

//   });

//   const [errors, setErrors] = useState<FormErrors>({});
//   const [countries, setCountries] = useState<ICountry[]>([]);
//   const [states, setStates] = useState<IState[]>([]);
//   const [cities, setCities] = useState<ICity[]>([]);
//   const [loadingPincode, setLoadingPincode] = useState(false);
//   const navigate = useNavigate();
//   const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
// const [showPassword, setShowPassword] = useState(false);

//   // Function to fetch pincode based on city and state
//   const fetchPincode = async (cityName: string, stateName: string) => {
//     try {
//       setLoadingPincode(true);
      
//       // Using India Post API for pincode lookup
//       const response = await fetch(`https://api.postalpincode.in/postoffice/${cityName}`);
//       const data = await response.json();
      
//       if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
//         const postOffices = data[0].PostOffice;
        
//         // Filter by state if multiple results
//         const filteredOffices = postOffices.filter(
//           (office: any) => office.State.toLowerCase() === stateName.toLowerCase()
//         );
        
//         if (filteredOffices.length > 0) {
//           const pincode = filteredOffices[0].Pincode;
//           setFormData(prev => ({ ...prev, pincode: pincode }));
//           showToast(`Pincode auto-filled: ${pincode}`, 'success');
//         } else if (postOffices.length > 0) {
//           // Fallback to first available pincode
//           const pincode = postOffices[0].Pincode;
//           setFormData(prev => ({ ...prev, pincode: pincode }));
//           showToast(`Pincode auto-filled: ${pincode}`, 'success');
//         } else {
//           showToast('Pincode not found for this city', 'warn');
//         }
//       } else {
//         // Fallback: Try alternative API or manual mapping
//         await fetchPincodeAlternative(cityName, stateName);
//       }
//     } catch (error) {
//       console.error('Error fetching pincode:', error);
//       await fetchPincodeAlternative(cityName, stateName);
//     } finally {
//       setLoadingPincode(false);
//     }
//   };

//   // Alternative pincode fetch method
//   const fetchPincodeAlternative = async (cityName: string, stateName: string) => {
//     try {
//       // Using alternative API
//       const response = await fetch(`https://api.postalpincode.in/pincode/${cityName}`);
//       const data = await response.json();
      
//       if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
//         const postOffice = data[0].PostOffice.find(
//           (office: any) => office.Name.toLowerCase().includes(cityName.toLowerCase())
//         );
        
//         if (postOffice) {
//           setFormData(prev => ({ ...prev, pincode: postOffice.Pincode }));
//           showToast(`Pincode auto-filled: ${postOffice.Pincode}`, 'success');
//         } else {
//           showToast('Unable to auto-fill pincode. Please enter manually.', 'info');
//         }
//       } else {
//         showToast('Unable to auto-fill pincode. Please enter manually.', 'info');
//       }
//     } catch (error) {
//       console.error('Alternative pincode fetch failed:', error);
//       showToast('Unable to auto-fill pincode. Please enter manually.', 'info');
//     }
//   };

//   // Fetch Vehicle Types
//   useEffect(() => {
//     const fetchVehicleTypes = async () => {
//       try {
//         const res = await axiosInstance.get<{ data: VehicleType[] }>(
//           "/vehicleType/getAllVehicleType"
//         );
//         if (Array.isArray(res.data.data)) {
//           setVehicleTypes(res.data.data);
//         } else {
//           setVehicleTypes([]);
//         }
//       } catch (err) {
//         showToast('Failed to fetch vehicle types', 'error');
//       }
//     };

//     fetchVehicleTypes();
//   }, []);

//   useEffect(() => {
//     // Only India
//     const india = Country.getAllCountries().filter(c => c.name === "India");
//     setCountries(india);

//     // Preselect India by default
//     if (india.length > 0) {
//       setFormData(prev => ({ ...prev, country: india[0].name }));
//       setStates(State.getStatesOfCountry(india[0].isoCode));
//     }
//   }, []);

//   const handleCountryChange = (name: string, value: string) => {
//     const selectedCountry = countries.find((c) => c.name === value);
//     setFormData((prev) => ({ ...prev, country: value, state: '', city: '', pincode: '' }));
//     setErrors((prev) => ({ ...prev, country: '' }));

//     if (selectedCountry) {
//       setStates(State.getStatesOfCountry(selectedCountry.isoCode));
//       setCities([]);
//     } else {
//       setStates([]);
//       setCities([]);
//     }
//   };

//   const handleStateChange = (name: string, value: string) => {
//     const selectedState = states.find((s) => s.name === value);
//     const countryIso = countries.find((c) => c.name === formData.country)?.isoCode;
//     setFormData((prev) => ({ ...prev, state: value, city: '', pincode: '' }));
//     setErrors((prev) => ({ ...prev, state: '' }));

//     if (countryIso && selectedState) {
//       setCities(City.getCitiesOfState(countryIso, selectedState.isoCode));
//     } else {
//       setCities([]);
//     }
//   };

//   const handleCityChange = async (name: string, value: string) => {
//     setFormData((prev) => ({ ...prev, city: value, pincode: '' }));
//     setErrors((prev) => ({ ...prev, city: '' }));

//     // Auto-fill pincode when city is selected
//     if (value && formData.state) {
//       await fetchPincode(value, formData.state);
//     }
//   };

//   const handleChange = (name: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     setErrors((prev) => ({ ...prev, [name]: '' }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     e.stopPropagation();

//     //  Toast validation messages for all required fields
//     if (!formData.name.trim()) {
//       showToast('Driver name is required', 'warn');
//       return;
//     }

//     if (!formData.password) {
//       showToast('Password is required', 'warn');
//       return;
//     }

//     if (!formData.phone.trim()) {
//       showToast('Phone number is required', 'warn');
//       return;
//     }

//     //  Phone number validation
//     if (!/^[6-9]\d{9}$/.test(formData.phone)) {
//       showToast('Phone number must be 10 digits starting with 6-9', 'warn');
//       return;
//     }

//     if (!formData.address1.trim()) {
//       showToast('Address Line 1 is required', 'warn');
//       return;
//     }

//     if (!formData.country) {
//       showToast('Please select a country', 'warn');
//       return;
//     }

//     if (!formData.state) {
//       showToast('Please select a state', 'warn');
//       return;
//     }

//     if (!formData.city) {
//       showToast('Please select a city', 'warn');
//       return;
//     }

//     if (!formData.pincode.trim()) {
//       showToast('Pincode is required', 'warn');
//       return;
//     }

//     //  Pincode validation
//     if (!/^\d{6}$/.test(formData.pincode)) {
//       showToast('Pincode must be 6 digits', 'warn');
//       return;
//     }

//     if (!formData.vehicleType) {
//       showToast('Please select a vehicle type', 'warn');
//       return;
//     }

//     // Email validation (only if provided)
//     if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
//       showToast('Please enter a valid email address', 'warn');
//       return;
//     }
// if (!formData.licenseNo.trim()) {
//   showToast('License number is required', 'warn');
//   return;
// }

// if (!formData.licExpDate.trim()) {
//   showToast('License expiry date is required', 'warn');
//   return;
// }
// if (!formData.trackingSource) {
//   showToast('Please select Tracking Source', 'warn');
//   return;
// }

//     const payload = {
//       driverName: formData.name,
//       password: formData.password,
//       driverEmail: formData.email,
//       phno: formData.phone,
//       city: formData.city,
//       state: formData.state,
//       country: formData.country,
//       pincode: formData.pincode,
//       address: `${formData.address1}${formData.address2 ? ', ' + formData.address2 : ''}`,
//       vehicleTypeId: formData.vehicleType,
//         licenseNo: formData.licenseNo,    
//   licExpDate: formData.licExpDate, 
//   trackingSource: formData.trackingSource,
//     };

//     try {
//       await axiosInstance.post('/vendor/createDriver', payload);
//       showToast('Driver created successfully!', 'success');
      
//       // Reset form
//       setFormData({
//         name: '',
//         password: '',
//         address1: '',
//         address2: '',
//         email: '',
//         phone: '',
//         country: '',
//         state: '',
//         city: '',
//         pincode: '',
//         vehicleType: '',
//         licenseNo:'',
//         licExpDate:'',
//           trackingSource: '',
//       });

//       setTimeout(() => navigate('/drivers/list'), 1000);
//     } catch (error: any) {
//       if (error.response && error.response.data) {
//         showToast(error.response.data.message || 'An error occurred while adding driver.', 'error');
//       } else {
//         showToast('Network error. Please try again.', 'error');
//       }
//     }
//   };

//   return (
//     <PageLayout>
//       <div className="py-6">
//         <AlertContainer />
//         <h2 className="text-3xl font-bold text-gray-800 mb-4">Add New Driver</h2>
//         <div className="text-yellow-800 bg-yellow-100 px-4 py-2 rounded-md mb-6">
//           All Fields are Mandatory (except Email). Pincode will be auto-filled when you select a city.
//         </div>

//         <form onSubmit={handleSubmit} className="" noValidate>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="space-y-4">
//               <InputBox
//                 label={<>Driver Name <span className="text-red-500">*</span></>}
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 placeholder="Enter driver name"
//                 icon={<FontAwesomeIcon icon={faUser} />}
//                 error={errors.name}
//               />
//            <div className="relative">
//   <InputBox
//     label={<>Password <span className="text-red-500">*</span></>}
//     name="password"
//     type={showPassword ? "text" : "password"}
//     value={formData.password}
//     onChange={handleChange}
//     placeholder="Enter password"
//     icon={<FontAwesomeIcon icon={faLock} />}
//     error={errors.password}
//   />
//   {/* Eye toggle button - right side */}
//   <button
//     type="button"
//     onClick={() => setShowPassword(!showPassword)}
//     className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
//   >
//     <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
//   </button>
// </div>


//               <InputBox
//                 label={<>Address Line 1 <span className="text-red-500">*</span></>}
//                 name="address1"
//                 value={formData.address1}
//                 onChange={handleChange}
//                 placeholder="Enter address line 1"
//                 icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
//                 error={errors.address1}
//               />
//               <InputBox
//                 label={<>Country <span className="text-red-500">*</span></>}
//                 name="country"
//                 type="select"
//                 value={formData.country}
//                 onChange={handleCountryChange}
//                 options={countries.map((c: ICountry) => ({ value: c.name, label: c.name }))}
//                 placeholder="Select country"
//                 icon={<FontAwesomeIcon icon={faGlobe} />}
//                 error={errors.country}
//               />
//               <InputBox
//                 label={<>City <span className="text-red-500">*</span></>}
//                 name="city"
//                 type="select"
//                 value={formData.city}
//                 onChange={handleCityChange}
//                 options={cities.map((c: ICity) => ({ value: c.name, label: c.name }))}
//                 placeholder="Select city"
//                 icon={<FontAwesomeIcon icon={faCity} />}
//                 error={errors.city}
//                 disabled={!formData.state}
//               />
//               <InputBox
//                 label={<>Vehicle Type <span className="text-red-500">*</span></>}
//                 name="vehicleType"
//                 type="select"
//                 value={formData.vehicleType}
//                 onChange={handleChange}
//                 options={vehicleTypes.map((vt) => ({
//                   value: vt.vehicleTypeId,
//                   label: vt.vehicleType,
//                 }))}
//                 placeholder="Select vehicle type"
//                 icon={<FontAwesomeIcon icon={faCar} />}
//                 error={errors.vehicleType}
//               />
// <InputBox
//   label={<>License Expiry Date <span className="text-red-500">*</span></>}
//   name="licExpDate"
//   type="date"
//   value={formData.licExpDate}
//   onChange={handleChange}
//   icon={<FontAwesomeIcon icon={faCalendarAlt} />} // import faCalendarAlt
//   error={errors.licExpDate}
// />


// {/* <InputBox
//   label={<>License Expiry Date (DD/MM/YYYY) <span className="text-red-500">*</span></>}
//   name="licExpDate"
//   type="text" // ✅ CHANGE 1: Changed from "date" to "text"
//   value={formData.licExpDate}
//   onChange={handleChange}
//   placeholder="DD/MM/YYYY (e.g., 24/10/2025)" // ✅ Updated placeholder for user clarity
//   icon={<FontAwesomeIcon icon={faCalendarAlt} />}
//   error={errors.licExpDate}
// /> */}
//             </div>
//             <div className="space-y-4">
//               <InputBox
//                 label="Email Address (Optional)"
//                 name="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Enter email address (optional)"
//                 icon={<FontAwesomeIcon icon={faEnvelope} />}
//                 error={errors.email}
//               />
//               <InputBox
//                 label={<>Phone Number <span className="text-red-500">*</span></>}
//                 name="phone"
//                 type="number"
//                 value={formData.phone}
//                 onChange={handleChange}
//                 placeholder="Enter phone number"
//                 icon={<FontAwesomeIcon icon={faPhone} />}
//                 error={errors.phone}
//               />
//               <InputBox
//                 label="Address Line 2"
//                 name="address2"
//                 value={formData.address2}
//                 onChange={handleChange}
//                 placeholder="Enter address line 2 (optional)"
//                 icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
//               />
//               <InputBox
//                 label={<>State <span className="text-red-500">*</span></>}
//                 name="state"
//                 type="select"
//                 value={formData.state}
//                 onChange={handleStateChange}
//                 options={states.map((s: IState) => ({ value: s.name, label: s.name }))}
//                 placeholder="Select state"
//                 icon={<FontAwesomeIcon icon={faFlag} />}
//                 error={errors.state}
//                 disabled={!formData.country}
//               />
//               <InputBox
//                 label={<>Pincode <span className="text-red-500">*</span></>}
//                 name="pincode"
//                 value={formData.pincode}
//                 onChange={handleChange}
//                 placeholder={loadingPincode ? "Loading pincode..." : "Enter pincode (auto-filled)"}
//                 icon={<FontAwesomeIcon icon={faMapPin} />}
//                 error={errors.pincode}
//                 disabled={loadingPincode}
//                 // readOnly
//               />
//               <InputBox
//   label={<>License Number <span className="text-red-500">*</span></>}
//   name="licenseNo"
//   value={formData.licenseNo}
//   onChange={handleChange}
//   placeholder="Enter license number"
//   icon={<FontAwesomeIcon icon={faIdCard} />} // you can import faIdCard from FontAwesome
//   error={errors.licenseNo}
// />

// <InputBox
//   label={<>Tracking Source <span className="text-red-500">*</span></>}
//   name="trackingSource"
//   type="select"
//   value={formData.trackingSource}
//   onChange={handleChange}
//   options={[
//     { value: "IP Address", label: "IP Address" },
//     { value: "GPS", label: "GPS" }
//   ]}
//   placeholder="Select Tracking Source"
// />


//             </div>
//           </div>
//           <div className="mt-10 flex justify-end">
//             <CommonButton
//               type="submit"
//               variant="primary"
//               className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
//               disabled={loadingPincode}
//             >
//               Save Driver
//             </CommonButton>
//           </div>
//         </form>
//       </div>
//     </PageLayout>
//   );
// };

// export default AddDriverForm;


//remove vehicle type field
import React, { useEffect, useState } from "react";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faIdCard,
  faCalendarAlt,
  faUser,
  faLock,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faGlobe,
  faCity,
  faFlag,
  faMapPin,
} from "@fortawesome/free-solid-svg-icons";

import PageLayout from "../../../components/PageLayout";
import CommonButton from "../../../components/CommonButton";
import InputBox from "../../../components/InputBox";
import { showToast, AlertContainer } from "../../../components/AlertBox";
import axiosInstance from "../../../utils/axiosInstance";

interface DriverFormData {
  name: string;
  password: string;
  address1: string;
  address2: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  licenseNo: string;
  licExpDate: string;
  trackingSource: string;
}

type FormErrors = {
  [K in keyof DriverFormData]?: string;
};

const AddDriverForm: React.FC = () => {
  const [formData, setFormData] = useState<DriverFormData>({
    name: "",
    password: "",
    address1: "",
    address2: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    licenseNo: "",
    licExpDate: "",
    trackingSource: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // Function to fetch pincode based on city and state
  const fetchPincode = async (cityName: string, stateName: string) => {
    try {
      setLoadingPincode(true);

      // Using India Post API for pincode lookup
      const response = await fetch(`https://api.postalpincode.in/postoffice/${cityName}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
        const postOffices = data[0].PostOffice;

        // Filter by state if multiple results
        const filteredOffices = postOffices.filter(
          (office: any) => office.State.toLowerCase() === stateName.toLowerCase()
        );

        if (filteredOffices.length > 0) {
          const pincode = filteredOffices[0].Pincode;
          setFormData((prev) => ({ ...prev, pincode }));
          showToast(`Pincode auto-filled: ${pincode}`, "success");
        } else if (postOffices.length > 0) {
          // Fallback to first available pincode
          const pincode = postOffices[0].Pincode;
          setFormData((prev) => ({ ...prev, pincode }));
          showToast(`Pincode auto-filled: ${pincode}`, "success");
        } else {
          showToast("Pincode not found for this city", "warn");
        }
      } else {
        // Fallback: Try alternative API or manual mapping
        await fetchPincodeAlternative(cityName, stateName);
      }
    } catch (error) {
      console.error("Error fetching pincode:", error);
      await fetchPincodeAlternative(cityName, stateName);
    } finally {
      setLoadingPincode(false);
    }
  };

  // Alternative pincode fetch method
  const fetchPincodeAlternative = async (cityName: string, stateName: string) => {
    try {
      // Using alternative API
      const response = await fetch(`https://api.postalpincode.in/pincode/${cityName}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
        const postOffice = data[0].PostOffice.find((office: any) =>
          office.Name.toLowerCase().includes(cityName.toLowerCase())
        );

        if (postOffice) {
          setFormData((prev) => ({ ...prev, pincode: postOffice.Pincode }));
          showToast(`Pincode auto-filled: ${postOffice.Pincode}`, "success");
        } else {
          showToast("Unable to auto-fill pincode. Please enter manually.", "info");
        }
      } else {
        showToast("Unable to auto-fill pincode. Please enter manually.", "info");
      }
    } catch (error) {
      console.error("Alternative pincode fetch failed:", error);
      showToast("Unable to auto-fill pincode. Please enter manually.", "info");
    }
  };

  useEffect(() => {
    // Only India
    const india = Country.getAllCountries().filter((c) => c.name === "India");
    setCountries(india);

    // Preselect India by default
    if (india.length > 0) {
      setFormData((prev) => ({ ...prev, country: india[0].name }));
      setStates(State.getStatesOfCountry(india[0].isoCode));
    }
  }, []);

  const handleCountryChange = (name: string, value: string) => {
    const selectedCountry = countries.find((c) => c.name === value);
    setFormData((prev) => ({ ...prev, country: value, state: "", city: "", pincode: "" }));
    setErrors((prev) => ({ ...prev, country: "" }));

    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry.isoCode));
      setCities([]);
    } else {
      setStates([]);
      setCities([]);
    }
  };

  const handleStateChange = (name: string, value: string) => {
    const selectedState = states.find((s) => s.name === value);
    const countryIso = countries.find((c) => c.name === formData.country)?.isoCode;

    setFormData((prev) => ({ ...prev, state: value, city: "", pincode: "" }));
    setErrors((prev) => ({ ...prev, state: "" }));

    if (countryIso && selectedState) {
      setCities(City.getCitiesOfState(countryIso, selectedState.isoCode));
    } else {
      setCities([]);
    }
  };

  const handleCityChange = async (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, city: value, pincode: "" }));
    setErrors((prev) => ({ ...prev, city: "" }));

    // Auto-fill pincode when city is selected
    if (value && formData.state) {
      await fetchPincode(value, formData.state);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!formData.name.trim()) {
      showToast("Driver name is required", "warn");
      return;
    }

    if (!formData.password) {
      showToast("Password is required", "warn");
      return;
    }

    if (!formData.phone.trim()) {
      showToast("Phone number is required", "warn");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      showToast("Phone number must be 10 digits starting with 6-9", "warn");
      return;
    }

    if (!formData.address1.trim()) {
      showToast("Address Line 1 is required", "warn");
      return;
    }

    if (!formData.country) {
      showToast("Please select a country", "warn");
      return;
    }

    if (!formData.state) {
      showToast("Please select a state", "warn");
      return;
    }

    if (!formData.city) {
      showToast("Please select a city", "warn");
      return;
    }

    if (!formData.pincode.trim()) {
      showToast("Pincode is required", "warn");
      return;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      showToast("Pincode must be 6 digits", "warn");
      return;
    }

    // Email validation (only if provided)
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      showToast("Please enter a valid email address", "warn");
      return;
    }

    if (!formData.licenseNo.trim()) {
      showToast("License number is required", "warn");
      return;
    }

    if (!formData.licExpDate.trim()) {
      showToast("License expiry date is required", "warn");
      return;
    }

    if (!formData.trackingSource) {
      showToast("Please select Tracking Source", "warn");
      return;
    }

    const payload = {
      driverName: formData.name,
      password: formData.password,
      driverEmail: formData.email,
      phno: formData.phone,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pincode: formData.pincode,
      address: `${formData.address1}${formData.address2 ? ", " + formData.address2 : ""}`,
      licenseNo: formData.licenseNo,
      licExpDate: formData.licExpDate,
      trackingSource: formData.trackingSource,
    };

    try {
      await axiosInstance.post("/vendor/createDriver", payload);
      showToast("Driver created successfully!", "success");

      setFormData({
        name: "",
        password: "",
        address1: "",
        address2: "",
        email: "",
        phone: "",
        country: "",
        state: "",
        city: "",
        pincode: "",
        licenseNo: "",
        licExpDate: "",
        trackingSource: "",
      });

      setTimeout(() => navigate("/drivers/list"), 1000);
    } catch (error: any) {
      if (error.response && error.response.data) {
        showToast(error.response.data.message || "An error occurred while adding driver.", "error");
      } else {
        showToast("Network error. Please try again.", "error");
      }
    }
  };

  return (
    <PageLayout>
      <div className="py-6">
        <AlertContainer />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Add New Driver</h2>
        <div className="text-yellow-800 bg-yellow-100 px-4 py-2 rounded-md mb-6">
          All Fields are Mandatory (except Email). Pincode will be auto-filled when you select a city.
        </div>

        <form onSubmit={handleSubmit} className="" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InputBox
                label={
                  <>
                    Driver Name <span className="text-red-500">*</span>
                  </>
                }
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter driver name"
                icon={<FontAwesomeIcon icon={faUser} />}
                error={errors.name}
              />

              <div className="relative">
                <InputBox
                  label={
                    <>
                      Password <span className="text-red-500">*</span>
                    </>
                  }
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  icon={<FontAwesomeIcon icon={faLock} />}
                  error={errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>

              <InputBox
                label={
                  <>
                    Address Line 1 <span className="text-red-500">*</span>
                  </>
                }
                name="address1"
                value={formData.address1}
                onChange={handleChange}
                placeholder="Enter address line 1"
                icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
                error={errors.address1}
              />

              <InputBox
                label={
                  <>
                    Country <span className="text-red-500">*</span>
                  </>
                }
                name="country"
                type="select"
                value={formData.country}
                onChange={handleCountryChange}
                options={countries.map((c: ICountry) => ({ value: c.name, label: c.name }))}
                placeholder="Select country"
                icon={<FontAwesomeIcon icon={faGlobe} />}
                error={errors.country}
              />

              <InputBox
                label={
                  <>
                    City <span className="text-red-500">*</span>
                  </>
                }
                name="city"
                type="select"
                value={formData.city}
                onChange={handleCityChange}
                options={cities.map((c: ICity) => ({ value: c.name, label: c.name }))}
                placeholder="Select city"
                icon={<FontAwesomeIcon icon={faCity} />}
                error={errors.city}
                disabled={!formData.state}
              />

              <InputBox
                label={
                  <>
                    License Expiry Date <span className="text-red-500">*</span>
                  </>
                }
                name="licExpDate"
                type="date"
                value={formData.licExpDate}
                onChange={handleChange}
                icon={<FontAwesomeIcon icon={faCalendarAlt} />}
                error={errors.licExpDate}
              />

              <InputBox
                label={
                  <>
                    Tracking Source <span className="text-red-500">*</span>
                  </>
                }
                name="trackingSource"
                type="select"
                value={formData.trackingSource}
                onChange={handleChange}
                options={[
                  { value: "IP Address", label: "IP Address" },
                  { value: "GPS", label: "GPS" },
                ]}
                placeholder="Select Tracking Source"
              />
            </div>

            <div className="space-y-4">
              <InputBox
                label="Email Address (Optional)"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address (optional)"
                icon={<FontAwesomeIcon icon={faEnvelope} />}
                error={errors.email}
              />

              <InputBox
                label={
                  <>
                    Phone Number <span className="text-red-500">*</span>
                  </>
                }
                name="phone"
                type="number"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                icon={<FontAwesomeIcon icon={faPhone} />}
                error={errors.phone}
              />

              <InputBox
                label="Address Line 2"
                name="address2"
                value={formData.address2}
                onChange={handleChange}
                placeholder="Enter address line 2 (optional)"
                icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
              />

              <InputBox
                label={
                  <>
                    State <span className="text-red-500">*</span>
                  </>
                }
                name="state"
                type="select"
                value={formData.state}
                onChange={handleStateChange}
                options={states.map((s: IState) => ({ value: s.name, label: s.name }))}
                placeholder="Select state"
                icon={<FontAwesomeIcon icon={faFlag} />}
                error={errors.state}
                disabled={!formData.country}
              />

              <InputBox
                label={
                  <>
                    Pincode <span className="text-red-500">*</span>
                  </>
                }
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder={loadingPincode ? "Loading pincode..." : "Enter pincode (auto-filled)"}
                icon={<FontAwesomeIcon icon={faMapPin} />}
                error={errors.pincode}
                disabled={loadingPincode}
              />

              <InputBox
                label={
                  <>
                    License Number <span className="text-red-500">*</span>
                  </>
                }
                name="licenseNo"
                value={formData.licenseNo}
                onChange={handleChange}
                placeholder="Enter license number"
                icon={<FontAwesomeIcon icon={faIdCard} />}
                error={errors.licenseNo}
              />

              {/* <InputBox
                label={
                  <>
                    Tracking Source <span className="text-red-500">*</span>
                  </>
                }
                name="trackingSource"
                type="select"
                value={formData.trackingSource}
                onChange={handleChange}
                options={[
                  { value: "IP Address", label: "IP Address" },
                  { value: "GPS", label: "GPS" },
                ]}
                placeholder="Select Tracking Source"
              /> */}
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <CommonButton
              type="submit"
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
              disabled={loadingPincode}
            >
              Save Driver
            </CommonButton>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default AddDriverForm;

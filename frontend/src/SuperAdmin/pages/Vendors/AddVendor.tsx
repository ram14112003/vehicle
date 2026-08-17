// src/SuperAdmin/pages/Owners/AddOwnerForm.tsx

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import {
  faUser,
  faEnvelope,
  faPhone,
  faLocationDot,
  faCity,
  faGlobe,
  faFlag,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PageLayout from '../../../components/PageLayout';
import CommonButton from '../../../components/CommonButton';
import InputBox from '../../../components/InputBox';
import { showToast, AlertContainer } from '../../../components/AlertBox';
import axiosInstance from '../../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

// Define the data types
type FormData = {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  password: string;
};

type FormErrors = {
  [K in keyof FormData]?: string;
};

export default function AddOwnerForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    country: '',
    state: '',
    city: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  const countries: ICountry[] = Country.getAllCountries().filter(
    (c) => c.name === "India"
  );

  // Unified change handler for InputBox
  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleCountryChange = (name: string, value: string) => {
    const selectedCountry = countries.find((c: ICountry) => c.name === value);
    
    setFormData((prev) => ({
      ...prev,
      country: value,
      state: '',
      city: '',
    }));
    
    if (selectedCountry) {
      const stateList = State.getStatesOfCountry(selectedCountry.isoCode);
      setStates(stateList);
      setCities([]);
    } else {
      setStates([]);
      setCities([]);
    }
  };

  const handleStateChange = (name: string, value: string) => {
    const stateName = value;
    const selectedCountry = countries.find((c: ICountry) => c.name === formData.country);
    const selectedState = states.find((s: IState) => s.name === stateName);

    setFormData((prev) => ({
      ...prev,
      state: stateName,
      city: '',
    }));
    
    if (selectedCountry && selectedState) {
      const cityList = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
      setCities(cityList);
    } else {
      setCities([]);
    }
  };

const validate = (): boolean => {
  if (!formData.name.trim()) {
    showToast("Owner name is required", "warn");
    return false;
  }

  if (!formData.email.trim()) {
    showToast("Email address is required", "warn");
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    showToast("Invalid email format", "warn");
    return false;
  }

  if (!formData.phone.trim()) {
    showToast("Phone number is required", "warn");
    return false;
  }
  if (!/^\d{10}$/.test(formData.phone)) {
    showToast("Phone number must be 10 digits", "warn");
    return false;
  }

  if (!formData.address1.trim()) {
    showToast("Address Line 1 is required", "warn");
    return false;
  }

  if (!formData.address2.trim()) {
    showToast("Address Line 2 is required", "warn");
    return false;
  }

  if (!formData.country) {
    showToast("Please select a country", "warn");
    return false;
  }

  if (!formData.state) {
    showToast("Please select a state", "warn");
    return false;
  }

  if (!formData.city) {
    showToast("Please select a city", "warn");
    return false;
  }
if (!formData.password.trim()) {
  showToast("Password is required", "warn");
  return false;
}
if (formData.password.length < 6) {
  showToast("Password must be at least 6 characters", "warn");
  return false;
}
  return true; // ✅ All checks passed
};


  // Form submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  if (!validate()) return;

    const payload = {
      vendorName: formData.name,
      email: formData.email,
      phno: formData.phone,
      password: formData.password,
      address: `${formData.address1}, ${formData.address2}`,
      country: formData.country,
      state: formData.state,
      city: formData.city,
    };

    try {
      const response = await axiosInstance.post('/emp/createVendor', payload);
     

      showToast('Owner added successfully!', 'success');
      navigate('/vendors/list');

    } catch (error: any) {
      console.error('❌ Error:', error.response?.data || error.message);

      // backend la already owner name/email duplicate error throw panniduchuna
      if (error.response?.status === 400 && error.response?.data?.message) {
        if (error.response.data.message.toLowerCase().includes("already")) {
          showToast('Owner with this name/email already exists. Try a different one.', 'error');
        } else {
          showToast(error.response.data.message, 'error');
        }
      } else {
        showToast('Failed to add owner. Please try again.', 'error');
      }
    }
  };

  return (
    <PageLayout>
      <div className="py-6">
        <AlertContainer />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Add Owner</h2>

        <div className="text-yellow-800 bg-yellow-100 px-4 py-2 rounded-md mb-6">
          All Fields are Mandatory
        </div>

        <form onSubmit={handleSubmit} className="">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-indigo-700 mb-4">
            <UserPlus className="w-5 h-5" /> Owner Info
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputBox
               label={
    <>
      Owner Name<span className="text-red-500">*</span>
    </>
  }
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Owner Name"
              icon={<FontAwesomeIcon icon={faUser} />}
              error={errors.name}
            />

            <InputBox
               label={
    <>
     Email Address<span className="text-red-500">*</span>
    </>
  }
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email Address"
              icon={<FontAwesomeIcon icon={faEnvelope} />}
              error={errors.email}
            />
<InputBox
  label={
    <>
      Password<span className="text-red-500">*</span>
    </>
  }
  name="password"
  type="password"
  value={formData.password}
  onChange={handleChange}
  placeholder="Enter Password"
/>

            <InputBox
               label={
    <>
      Phone Number<span className="text-red-500">*</span>
    </>
  }
              name="phone"
              type="number"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter Phone Number"
              icon={<FontAwesomeIcon icon={faPhone} />}
              error={errors.phone}
            />

            <InputBox
               label={
    <>
      Address 1<span className="text-red-500">*</span>
    </>
  }
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              placeholder="Enter Address Line 1"
              icon={<FontAwesomeIcon icon={faLocationDot} />}
              error={errors.address1}
            />

            <InputBox
               label={
    <>
      Address 2<span className="text-red-500">*</span>
    </>
  }
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              placeholder="Enter Address Line 2"
              icon={<FontAwesomeIcon icon={faLocationDot} />}
              error={errors.address2}
            />

            <InputBox
               label={
    <>
     Country<span className="text-red-500">*</span>
    </>
  }
              name="country"
              value={formData.country}
              onChange={handleCountryChange}
              type="select"
              options={countries.map((c: ICountry) => ({ value: c.name, label: c.name }))}
              placeholder="Select Country"
              icon={<FontAwesomeIcon icon={faGlobe} />}
              error={errors.country}
            />

            <InputBox
               label={
    <>
     State<span className="text-red-500">*</span>
    </>
  }
              name="state"
              value={formData.state}
              onChange={handleStateChange}
              type="select"
              options={states.map((s: IState) => ({ value: s.name, label: s.name }))}
              placeholder="Select State"
              icon={<FontAwesomeIcon icon={faFlag} />}
              error={errors.state}
              disabled={!formData.country}
            />

            <InputBox
               label={
    <>
      City<span className="text-red-500">*</span>
    </>
  }
              name="city"
              value={formData.city}
              onChange={handleChange}
              type="select"
              options={cities.map((c: ICity) => ({ value: c.name, label: c.name }))}
              placeholder="Select City"
              icon={<FontAwesomeIcon icon={faCity} />}
              error={errors.city}
              disabled={!formData.state}
            />
          </div>

          <div className="mt-6 text-right">
            <CommonButton type="submit" variant="success" className="px-6 py-2">
              Save
            </CommonButton>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}

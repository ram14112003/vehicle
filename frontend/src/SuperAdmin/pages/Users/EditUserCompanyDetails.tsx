import React, { useState } from "react";
import { X } from "lucide-react";
import { useEffect } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";

type Props = {
    userData: {
        userId: string;
        username: string;
        email: string;
        mobile: string;
        gender: string;
        companyId: string;
        userAddress: string;
        presentAddress?: string;
        pinCode?: string;
        city?: string;
        state?: string;
        country?: string;
        status?: string;
    };
    onClose: () => void;
    onSuccess: () => void;
};



export default function EditUserCompanyDetails({ userData, onClose, onSuccess }: Props) {
    const showAddress = (v?: string) =>
  v && v.trim() !== "" ? v : "Default Address";

const sanitizeAddress = (v?: string) =>
  v && v.trim() !== "" && v !== "Default Address" ? v : "";

    const [formData, setFormData] = useState({
        userAddress: showAddress(userData.userAddress),
  presentAddress: showAddress(userData.presentAddress),
        pinCode: userData.pinCode || "",
        city: userData.city || "",
        state: userData.state || "",
        country: userData.country || "",
    });

    const [countries, setCountries] = useState<ICountry[]>([]);
const [states, setStates] = useState<IState[]>([]);
const [cities, setCities] = useState<ICity[]>([]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Update user address
            // await axiosInstance.put(`/user/${userData.userId}`,
            await axiosInstance.put(`/user/updateUser/${userData.userId}`,

                {
                userAddress: sanitizeAddress(formData.userAddress),
  presentAddress: sanitizeAddress(formData.presentAddress),
                    pinCode: formData.pinCode,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                }
            );
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to update:", err);
        }
    };
    useEffect(() => {
  const list = Country.getAllCountries();
  setCountries(list);
  // preselect from userData if present
  if (userData.country) {
    const c = list.find(x => x.name === userData.country);
    if (c) {
      setStates(State.getStatesOfCountry(c.isoCode));
      if (userData.state) {
        const s = State.getStatesOfCountry(c.isoCode).find(x => x.name === userData.state);
        if (s) setCities(City.getCitiesOfState(c.isoCode, s.isoCode));
      }
    }
  }
}, []);

const onCountry = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const name = e.target.value;
  const c = countries.find(x => x.name === name);
  setFormData(p => ({ ...p, country: name, state: "", city: "" }));
  if (c) {
    setStates(State.getStatesOfCountry(c.isoCode));
    setCities([]);
  } else {
    setStates([]); setCities([]);
  }
};

const onState = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const name = e.target.value;
  const c = countries.find(x => x.name === formData.country);
  const s = states.find(x => x.name === name);
  setFormData(p => ({ ...p, state: name, city: "" }));
  if (c && s) setCities(City.getCitiesOfState(c.isoCode, s.isoCode));
  else setCities([]);
};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-lg relative max-h-[80vh] flex flex-col">

                {/* Header - static */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">User Address List</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body - scrollable */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Present Address</label>
                           <input
  type="text"
  name="userAddress"
  value={formData.userAddress}
  onChange={handleChange}
  onBlur={() =>
    setFormData(p => ({
      ...p,
      userAddress: showAddress(p.userAddress),
    }))
  }
  className="mt-1 block w-full px-3 py-2 border rounded"
/>

                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">User Address</label>
                         <input
  type="text"
  name="presentAddress"
  value={formData.presentAddress}
  onChange={handleChange}
  onBlur={() =>
    setFormData(p => ({
      ...p,
      presentAddress: showAddress(p.presentAddress),
    }))
  }
  className="mt-1 block w-full px-3 py-2 border rounded"
/>

                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Pin Code</label>
                            <input
                                type="text"
                                name="pinCode"
                                value={formData.pinCode}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border rounded"
                            />
                        </div>

                        <div>
                            {/* <label className="block text-sm font-medium text-gray-700">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border rounded"
                            /> */}
                         <label className="block text-sm font-medium mt-3">City</label>
<input
  type="text"
  name="city"
  value={formData.city}
  onChange={handleChange}
  placeholder="Enter city"
  className="mt-1 block w-full px-3 py-2 border rounded"
/>

                        </div>

                        <div>
                            {/* <label className="block text-sm font-medium text-gray-700">State</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border rounded"
                            /> */}
                            <label className="block text-sm font-medium mt-3">State</label>
<select name="state" value={formData.state} onChange={onState} className="mt-1 block w-full px-3 py-2 border rounded" disabled={!formData.country}>
  <option value="">Select State</option>
  {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
</select>
                        </div>

                        <div>
                            {/* <label className="block text-sm font-medium text-gray-700">Country</label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border rounded"
                            /> */}
                            <label className="block text-sm font-medium">Country</label>
<select name="country" value={formData.country} onChange={onCountry} className="mt-1 block w-full px-3 py-2 border rounded">
  <option value="">Select Country</option>
  {countries.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
</select>
                        </div>

                    </form>
                </div>

                {/* Footer - static */}
                <div className="flex justify-end p-4 border-t">
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );

}

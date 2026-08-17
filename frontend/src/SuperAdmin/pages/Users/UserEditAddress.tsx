import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Country,
  State,
  City,
  ICountry,
  IState,
  ICity,
} from "country-state-city";
import axiosInstance from "../../../utils/axiosInstance";
import TravelHeader from "./header";
import Footer from "./Footer";

interface User {
  userId?: string;
  id?: number;
  userAddress: string;
  presentAddress: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
}

type SavedAddress = {
  label?: string;
  userAddress: string;
  presentAddress: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
};

const blankForm: User = {
  id: 0,
  userAddress: "",
  presentAddress: "",
  country: "",
  state: "",
  city: "",
  pinCode: "",
};

const UserAddressEditForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [formData, setFormData] = useState<User>(blankForm);
  const [isEditing, setIsEditing] = useState<boolean>(false);        // editing default address
  const [adding, setAdding] = useState<boolean>(false);
  const [editingSavedIdx, setEditingSavedIdx] = useState<number | null>(null); // NEW: which saved card is being edited

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get(`/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data?.data);
    } catch (e) {
      console.error("fetch user error", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await axiosInstance.get(`/user/${id}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setAddresses(res.data.data || []);
    } catch (e) {
      console.error("fetch addresses error", e);
    }
  };

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchUser(), fetchAddresses()]).finally(() =>
      setLoading(false)
    );
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const c = countries.find((x) => x.name === value);
    setFormData((prev) => ({ ...prev, country: value, state: "", city: "" }));
    if (c) {
      const st = State.getStatesOfCountry(c.isoCode);
      setStates(st);
      setCities([]);
    } else {
      setStates([]);
      setCities([]);
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const c = countries.find((x) => x.name === formData.country);
    const s = states.find((x) => x.name === value);
    setFormData((prev) => ({ ...prev, state: value, city: "" }));
    if (c && s) {
      setCities(City.getCitiesOfState(c.isoCode, s.isoCode));
    } else {
      setCities([]);
    }
  };

  const preloadDropdowns = (countryName: string, stateName: string) => {
    const c = Country.getAllCountries().find((x) => x.name === countryName);
    if (c) {
      const st = State.getStatesOfCountry(c.isoCode);
      setStates(st);
      const s = st.find((x) => x.name === stateName);
      if (s) setCities(City.getCitiesOfState(c.isoCode, s.isoCode));
    }
  };

  // Default block edit
  const handleEditClick = () => {
    if (!user) return;
    setEditingSavedIdx(null); // not editing a saved one
    setFormData({
      id: user.id ?? 0,
      userAddress: user.userAddress || "",
      presentAddress: user.presentAddress || "",
      country: user.country || "",
      state: user.state || "",
      city: user.city || "",
      pinCode: user.pinCode || "",
    });
    setIsEditing(true);
    preloadDropdowns(user.country, user.state);
  };

  // NEW: edit a saved address card
  const startEditSaved = (idx: number) => {
    const a = addresses[idx];
    setIsEditing(false);             // not editing default
    setEditingSavedIdx(idx);         // remember which card
    setFormData({
      id: 0,
      userAddress: a.userAddress,
      presentAddress: a.presentAddress,
      country: a.country,
      state: a.state,
      city: a.city,
      pinCode: a.pinCode,
    });
    preloadDropdowns(a.country, a.state);
    // optional: scroll to form
    setTimeout(() => document.getElementById("address-form")?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  // NEW: remove a saved address card
  const removeSaved = async (idx: number) => {
    // if (!confirm("Remove this address?")) return;
     
    try {
      await axiosInstance.delete(`/user/${id}/address/${idx}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAddresses();
      alert("✅ Address removed.");
      // if we were editing this one, clear the form
      if (editingSavedIdx === idx) {
        setEditingSavedIdx(null);
        setFormData(blankForm);
        setStates([]);
        setCities([]);
      }
    } catch (e) {
      console.error("remove address error", e);
      alert("❌ Failed to remove address.");
    }
  };

  // Make a saved one the default
  const makeDefault = async (a: SavedAddress) => {
    if (!user) return;
    try {
      const payload = {
        ...user,
        userAddress: a.userAddress,
        presentAddress: a.presentAddress,
        country: a.country,
        state: a.state,
        city: a.city,
        pinCode: a.pinCode,
      };
      const res = await axiosInstance.put(`/user/updateUser/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data?.data);
      alert("✅ Set as default address!");
    } catch (e) {
      console.error(e);
      alert("❌ Failed to set default.");
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.presentAddress ||
      !formData.userAddress ||
      !formData.country ||
      !formData.state ||
      !formData.city ||
      !formData.pinCode
    ) {
      alert("Please fill all required fields.");
      return;
    }

    // 1) edit default
    if (isEditing) {
      try {
        const res = await axiosInstance.put(
          `/user/updateUser/${id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("✅ Address updated successfully!");
        setUser(res.data?.data);
        setFormData(blankForm);
        setStates([]);
        setCities([]);
        setIsEditing(false);
        await fetchAddresses();
      } catch (e) {
        console.error("update default error", e);
        alert("❌ Failed to update address.");
      }
      return;
    }

    // 2) edit saved
    if (editingSavedIdx !== null) {
      try {
        const payload = {
          label: formData.presentAddress || "Address",
          country: formData.country,
          state: formData.state,
          city: formData.city,
          pinCode: formData.pinCode,
          presentAddress: formData.presentAddress,
          userAddress: formData.userAddress,
        };
        await axiosInstance.put(`/user/${id}/address/${editingSavedIdx}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("✅ Address updated.");
        setEditingSavedIdx(null);
        setFormData(blankForm);
        setStates([]);
        setCities([]);
        await fetchAddresses();
      } catch (e) {
        console.error("update saved error", e);
        alert("❌ Failed to update address.");
      }
      return;
    }

    // 3) add new
    try {
      setAdding(true);
      const payload = {
        label: formData.presentAddress || "Address",
        country: formData.country,
        state: formData.state,
        city: formData.city,
        pinCode: formData.pinCode,
        presentAddress: formData.presentAddress,
        userAddress: formData.userAddress,
      };
      const res = await axiosInstance.post(`/user/${id}/address`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        alert("✅ New address added!");
        setFormData(blankForm);
        setStates([]);
        setCities([]);
        await fetchAddresses();
      } else {
        alert(res.data?.message || "Failed to add address.");
      }
    } catch (e) {
      console.error("add address error", e);
      alert("❌ Failed to add address.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <>
        <TravelHeader />
        <div className="text-center mt-10 text-gray-600">Loading user data...</div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <TravelHeader />
        <div className="text-center mt-10 text-red-500">User not found.</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TravelHeader />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-600 mb-4">
            <span className="font-semibold text-gray-800">Home</span> &gt; <span>Manage Address</span>
          </div>

          {/* Default Address Box */}
          <div className="border rounded shadow-sm">
            <div className="bg-[#275981] text-white px-4 py-2 font-semibold">
              {user.presentAddress || "Default Address"}
            </div>
            <div className="p-4 space-y-2 text-sm">
              <p>🏠 {user.userAddress || "No address added yet"}</p>
              <p>📍 {user.city}</p>
              <p>📍 {user.state}</p>
              <p>📍 {user.country}</p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleEditClick}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1 rounded text-sm"
                >
                  ✎ Edit
                </button>
                {/* <button
                  disabled
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded text-sm cursor-not-allowed"
                  title="Not implemented"
                >
                  ✖ Remove
                </button> */}
              </div>
            </div>
          </div>

          {/* Saved addresses */}
          {addresses.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mt-8 mb-3">Saved Addresses</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {addresses.map((a, idx) => (
                  <div key={idx} className="border rounded p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{a.label || "Address"}</div>
                      <button
                        className="text-xs bg-sky-600 text-white px-2 py-1 rounded"
                        onClick={() => makeDefault(a)}
                      >
                        Make Default
                      </button>
                    </div>

                    <div className="text-sm text-gray-700 mt-2">
                      <div>🏠 {a.userAddress}</div>
                      <div>📍 {a.presentAddress}</div>
                      <div>🌍 {a.city}, {a.state}, {a.country} - {a.pinCode}</div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded text-xs"
                        onClick={() => startEditSaved(idx)}
                      >
                        ✎ Edit
                      </button>
                      <button
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => removeSaved(idx)}
                      >
                        ✖ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Add / Edit Address Form */}
          <h2 className="text-3xl font-semibold mt-8 mb-4">
            {isEditing
              ? "Edit Default Address"
              : editingSavedIdx !== null
              ? "Edit Saved Address"
              : "Add New Address"}
          </h2>

          <form
            id="address-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Present Address<span className="text-red-500">*</span>
              </label>
              <input
                name="presentAddress"
                value={formData.presentAddress}
                onChange={handleChange}
                placeholder="Enter present address"
                className="mt-1 block w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Country<span className="text-red-500">*</span>
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleCountryChange}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.isoCode} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address Line 1<span className="text-red-500">*</span>
              </label>
              <input
                name="userAddress"
                value={formData.userAddress}
                onChange={handleChange}
                placeholder="Street / Building / Area"
                className="mt-1 block w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                State<span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleStateChange}
                disabled={!formData.country}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s.isoCode} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                City<span className="text-red-500">*</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={!formData.state}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Select City</option>
                {cities.map((ci) => (
                  <option key={ci.name} value={ci.name}>
                    {ci.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pincode<span className="text-red-500">*</span>
              </label>
              <input
                name="pinCode"
                value={formData.pinCode}
                onChange={handleChange}
                placeholder="Enter pincode"
                inputMode="numeric"
                className="mt-1 block w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 rounded disabled:opacity-60"
                disabled={adding}
              >
                {isEditing
                  ? "Update"
                  : editingSavedIdx !== null
                  ? "Update"
                  : adding
                  ? "Saving..."
                  : "Save"}
              </button>

              {(editingSavedIdx === null && !isEditing) && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData(blankForm);
                    setStates([]);
                    setCities([]);
                  }}
                  className="ml-3 bg-gray-400 hover:bg-gray-500 text-white font-medium px-6 py-2 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default UserAddressEditForm;


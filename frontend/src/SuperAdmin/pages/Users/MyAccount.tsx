import React, { useState, useEffect, FormEvent } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import PageLayout from "../../../components/PageLayout";
import CommonButton from "../../../components/CommonButton";
import InputBox from "../../../components/InputBox";
import { showToast } from "../../../components/AlertBox";
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCity,
  faLocationArrow,
  faGlobe,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";
import TravelHeader from "./header";
import Footer from "./Footer";

const MyAccount = () => {
  const userId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("male");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [loadingPincode, setLoadingPincode] = useState(false);

  // ✅ Load all countries
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);

  // ✅ Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/user/${userId}`);
        const data = res.data.data;

        setName(data.username || "");
        setEmail(data.email || "");
        setPhone(data.mobile || "");
        setGender(data.gender || "male");

        // Split userAddress into two parts
        const [addr1, addr2] = data.userAddress ? data.userAddress.split(",", 2) : ["", ""];
        setAddress1(addr1 || "");
        setAddress2(addr2 || "");

        setCountry(data.country || "");
        setState(data.state || "");
        setCity(data.city || "");
        setPincode(data.pinCode || "");

        // Preload states and cities
        if (data.country) {
          const selectedCountry = Country.getAllCountries().find(c => c.name === data.country);
          if (selectedCountry) {
            const statesOfCountry = State.getStatesOfCountry(selectedCountry.isoCode);
            setStates(statesOfCountry);

            const selectedState = statesOfCountry.find(s => s.name === data.state);
            if (selectedState) {
              const citiesOfState = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
              setCities(citiesOfState);
            }
          }
        }
      } catch (error) {
        showToast("Failed to load user details", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // ✅ Handle country change
  const handleCountryChange = (name: string, value: string) => {
    const selectedCountry = countries.find(c => c.name === value);
    setCountry(value);
    setState("");
    setCity("");
    setPincode("");
    setStates([]);
    setCities([]);
    if (selectedCountry) {
      const statesOfCountry = State.getStatesOfCountry(selectedCountry.isoCode);
      setStates(statesOfCountry);
    }
  };

  // ✅ Handle state change
  const handleStateChange = (name: string, value: string) => {
    const selectedState = states.find(s => s.name === value);
    const countryIso = countries.find(c => c.name === country)?.isoCode;
    setState(value);
    setCity("");
    setPincode("");
    setCities([]);
    if (countryIso && selectedState) {
      const citiesOfState = City.getCitiesOfState(countryIso, selectedState.isoCode);
      setCities(citiesOfState);
    }
  };

  // ✅ Handle city change + fetch pincode
  const handleCityChange = async (name: string, value: string) => {
    setCity(value);
    if (value && state) {
      await fetchPincode(value, state);
    }
  };

  const fetchPincode = async (cityName: string, stateName: string) => {
    try {
      setLoadingPincode(true);
      const response = await fetch(`https://api.postalpincode.in/postoffice/${cityName}`);
      const data = await response.json();
      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
        const office = data[0].PostOffice.find(
          (o: any) => o.State.toLowerCase() === stateName.toLowerCase()
        );
        const pin = office ? office.Pincode : data[0].PostOffice[0].Pincode;
        setPincode(pin);
        showToast(`Pincode auto-filled: ${pin}`, "success");
      }
    } catch {
      showToast("Unable to fetch pincode", "warn");
    } finally {
      setLoadingPincode(false);
    }
  };

  // ✅ Submit update
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showToast("Name required", "warn");
    if (!email.trim()) return showToast("Email required", "warn");
    if (!phone.trim()) return showToast("Phone required", "warn");

    const payload = {
      username: name,
      email,
      mobile: phone,
      gender,
      userAddress: address1, // main address
      address2,              // secondary address
      country,
      state,
      city,
      pinCode: pincode,
    };

    try {
      setLoading(true);
      const res = await axiosInstance.put(`/user/updateUser/${userId}`, payload);
      if (res.status === 200) {
        showToast("Profile updated successfully!", "success");
      }
    } catch (error) {
      showToast("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TravelHeader />
      <PageLayout>
        <main className="py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">My Account</h1>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputBox label="Full Name" name="name" value={name} onChange={(n,v)=>setName(v)} icon={faUser} placeholder="Enter your name"/>
              <InputBox label="Email" name="email" type="email" value={email} onChange={(n,v)=>setEmail(v)} icon={faEnvelope} placeholder="Enter email"/>
              <InputBox label="Phone" name="phone" value={phone} onChange={(n,v)=>setPhone(v)} icon={faPhone} placeholder="Enter phone number"/>
              <div>
                <label className="block text-gray-700">Gender</label>
                <select className="w-full border rounded p-2" value={gender} onChange={(e)=>setGender(e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <InputBox label="Address 1" name="address1" value={address1} onChange={(n,v)=>setAddress1(v)} icon={faMapMarkerAlt} placeholder="Enter Address Line 1"/>
              <InputBox label="Address 2" name="address2" value={address2} onChange={(n,v)=>setAddress2(v)} icon={faMapMarkerAlt} placeholder="Enter Address Line 2"/>
              <InputBox label="Country" name="country" type="select" value={country} onChange={handleCountryChange} options={countries.map(c=>({value:c.name,label:c.name}))} icon={faGlobe} placeholder="Select Country"/>
              <InputBox label="State" name="state" type="select" value={state} onChange={handleStateChange} options={states.map(s=>({value:s.name,label:s.name}))} icon={faLocationArrow} disabled={!country} placeholder="Select State"/>
              <InputBox label="City" name="city" type="select" value={city} onChange={handleCityChange} options={cities.map(c=>({value:c.name,label:c.name}))} icon={faCity} disabled={!state} placeholder="Select City"/>
              <InputBox label="Pincode" name="pincode" value={pincode} onChange={(n,v)=>setPincode(v)} icon={faHashtag} placeholder={loadingPincode?"Fetching...":"Enter Pincode"} disabled={loadingPincode}/>
            </div>
            <div className="flex justify-end">
              <CommonButton text="Update" type="submit" variant="success" disabled={loading}/>
            </div>
          </form>
        </main>
      </PageLayout>
      <Footer/>
    </>
  );
};

export default MyAccount;

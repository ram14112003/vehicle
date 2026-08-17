import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../../components/PageLayout";
import CommonButton from "../../../components/CommonButton";
import InputBox from "../../../components/InputBox";
import axiosInstance from "../../../utils/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faPhone,
  faGlobe,
  faCity,
  faMapMarkerAlt,
  faLocationArrow,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import { AlertContainer, showToast } from "../../../components/AlertBox";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";

interface Company {
  companyId: string;
  companyName: string;
}

export default function AddUser() {
  const [companies, setCompanies] = useState<Company[]>([]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [userAddress, setAddress] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [isManager, setIsManager] = useState(false);
const [userId, setUserId] = useState("");
const [managerId, setManagerId] = useState("");
const [managerEmail, setManagerEmail] = useState("");
const [costCenter, setCostCenter] = useState("");
  const navigate = useNavigate();

  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  const selectedCompany = companies.find((c) => c.companyId === companyId);
  const isDanfoss = selectedCompany?.companyName?.toLowerCase().includes("danfoss");

  const fetchPincode = async (cityName: string, stateName: string) => {
    try {
      setLoadingPincode(true);

      const response = await fetch(`https://api.postalpincode.in/postoffice/${cityName}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
        const postOffices = data[0].PostOffice;

        const filteredOffices = postOffices.filter(
          (office: any) => office.State.toLowerCase() === stateName.toLowerCase()
        );

        if (filteredOffices.length > 0) {
          const pincode = filteredOffices[0].Pincode;
          setPinCode(pincode);
          showToast(`Pincode auto-filled: ${pincode}`, "success");
        } else if (postOffices.length > 0) {
          const pincode = postOffices[0].Pincode;
          setPinCode(pincode);
          showToast(`Pincode auto-filled: ${pincode}`, "success");
        } else {
          showToast("Pincode not found for this city", "warn");
        }
      } else {
        await fetchPincodeAlternative(cityName, stateName);
      }
    } catch (error) {
      console.error("Error fetching pincode:", error);
      await fetchPincodeAlternative(cityName, stateName);
    } finally {
      setLoadingPincode(false);
    }
  };

  const fetchPincodeAlternative = async (cityName: string, stateName: string) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${cityName}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
        const postOffice = data[0].PostOffice.find((office: any) =>
          office.Name.toLowerCase().includes(cityName.toLowerCase())
        );

        if (postOffice) {
          setPinCode(postOffice.Pincode);
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
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);

    setCountry("");
    setStates([]);
    setCities([]);
  }, []);

  const handleCountryChange = (name: string, value: string) => {
    const selectedCountry = countries.find((c) => c.name === value);
    setCountry(value);
    setState("");
    setCity("");
    setPinCode("");

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
    const countryIso = countries.find((c) => c.name === country)?.isoCode;
    setState(value);
    setCity("");
    setPinCode("");

    if (countryIso && selectedState) {
      setCities(City.getCitiesOfState(countryIso, selectedState.isoCode));
    } else {
      setCities([]);
    }
  };

  const handleCityChange = async (name: string, value: string) => {
    setCity(value);
    setPinCode("");

    if (value && state) {
      await fetchPincode(value, state);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!username.trim()) {
      showToast("Username is required.", "warn");
      return;
    }

    if (!email.trim()) {
      showToast("Email is required.", "warn");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      showToast("Please enter a valid email address (example: user@domain.com)", "error");
      return;
    }

    if (isDanfoss) {
      const emailLower = email.trim().toLowerCase();
      if (!emailLower.endsWith("@danfoss.com")) {
        showToast("Danfoss users must use @danfoss.com email only.", "error");
        return;
      }
    }
if (isDanfoss) {
  if (!managerEmail.trim()) {
    showToast("Manager email is required for Danfoss users.", "warn");
    return;
  }

  const managerEmailLower = managerEmail.trim().toLowerCase();

  if (!managerEmailLower.endsWith("@danfoss.com")) {
    showToast("Manager email must be a @danfoss.com email.", "error");
    return;
  }
}
    try {
      const check = await axiosInstance.get(`/user/getAllUsers`, {
        params: { email: email.trim() },
      });

      if (check.data.exists) {
        showToast("This email is already registered. Please use another email.", "error");
        return;
      }
    } catch (error) {
      console.log("Email check failed, continuing...");
    }

    if (!mobile.trim()) {
      showToast("Mobile number is required.", "warn");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      showToast("Mobile number must be 10 digits.", "warn");
      return;
    }

    if (!country) {
      showToast("Please select a country.", "warn");
      return;
    }

    if (!state) {
      showToast("Please select a state.", "warn");
      return;
    }

    if (!city) {
      showToast("Please enter a city.", "warn");
      return;
    }

    if (!companyId) {
      showToast("Please select a company.", "warn");
      return;
    }

    if (pinCode && !/^[0-9]{6}$/.test(pinCode)) {
      showToast("Pin code must be 6 digits.", "warn");
      return;
    }

    try {
      const payload = {
        username: username.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        role: "user",
        gender,
        country,
        state,
        city,
        companyId,
        userAddress,
        presentAddress,
        pinCode,
        isDeleted: 0,
        status: "active",
        isConfirmed: 1,
        isManager,
         danfossuserId: userId,
  managerId,
  managerEmail,
   costCenter 
      };

      const response = await axiosInstance.post("/auth/createUser", payload);

      if (response.data?.success) {
        showToast("User added successfully. Login password sent to email.", "success");

        setUsername("");
        setEmail("");
        setMobile("");
        setGender("male");
        setCountry("");
        setState("");
        setCity("");
        setCompanyId("");
        setAddress("");
        setPresentAddress("");
        setPinCode("");
        setIsManager(false);
        setCostCenter("");

        setTimeout(() => navigate("/users/list"), 1000);
      } else {
        showToast(response.data?.message || "Already exists. Please try again.", "error");
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        showToast(error.response.data.message || "An error occurred while adding user.", "error");
      } else {
        showToast("Network error. Please try again.", "error");
      }
    }
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axiosInstance.get("/company/getAllCompany");
        if (response.status === 200 && Array.isArray(response.data.data)) {
          setCompanies(response.data.data);
        }
      } catch (error) {
        showToast("Failed to fetch companies", "error");
      }
    };

    fetchCompanies();
  }, []);

  return (
    <PageLayout>
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800">Add User</h1>

        <div className="rounded-lg py-3 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6 py-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputBox
                label={
                  <>
                    Username <span className="text-red-500">*</span>
                  </>
                }
                name="username"
                required={false}
                placeholder="Enter Username"
                value={username}
                onChange={(name, value) => setUsername(value)}
                icon={faUser}
              />

              <InputBox
                label={
                  <>
                    Email <span className="text-red-500">*</span>
                  </>
                }
                name="email"
                required={false}
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(name, value) => setEmail(value)}
                icon={faEnvelope}
              />

              <InputBox
                label={
                  <>
                    Mobile <span className="text-red-500">*</span>
                  </>
                }
                name="mobile"
                required={false}
                type="number"
                placeholder="Enter Mobile Number"
                value={mobile}
                onChange={(name, value) => setMobile(value)}
                icon={faPhone}
              />

              <div>
                <label className="block text-gray-700">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full border rounded p-2"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <InputBox
                label={
                  <>
                    Country <span className="text-red-500">*</span>
                  </>
                }
                name="country"
                type="select"
                required={false}
                value={country}
                onChange={handleCountryChange}
                options={countries.map((c: ICountry) => ({
                  value: c.name,
                  label: c.name,
                }))}
                placeholder="Select Country"
                icon={<FontAwesomeIcon icon={faGlobe} />}
              />

              <InputBox
                label={
                  <>
                    State <span className="text-red-500">*</span>
                  </>
                }
                name="state"
                type="select"
                required={false}
                value={state}
                onChange={handleStateChange}
                options={states.map((s: IState) => ({
                  value: s.name,
                  label: s.name,
                }))}
                placeholder="Select State"
                icon={<FontAwesomeIcon icon={faLocationArrow} />}
                disabled={!country}
              />

              <InputBox
                label={
                  <>
                    City <span className="text-red-500">*</span>
                  </>
                }
                name="city"
                type="text"
                required={false}
                value={city}
                onChange={(name, value) => setCity(value)}
                placeholder="Enter City"
                icon={<FontAwesomeIcon icon={faCity} />}
              />

              <div>
                <label className="block text-gray-700">
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  name="companyId"
                  value={companyId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setCompanyId(selectedId);

                    const selectedCompany = companies.find((c) => c.companyId === selectedId);
                    if (!selectedCompany?.companyName.toLowerCase().includes("danfoss")) {
                      setIsManager(false);
                    }
                  }}
                  className="w-full border rounded p-2"
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((company) => (
                    <option key={company.companyId} value={company.companyId}>
                      {company.companyName}
                    </option>
                  ))}
                </select>

                {companies
                  .find((c) => c.companyId === companyId)
                  ?.companyName.toLowerCase()
                  .includes("danfoss") && (
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="isManager"
                      checked={isManager}
                      onChange={(e) => setIsManager(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="isManager" className="text-gray-700">
                      Is Manager
                    </label>
                  </div>
                )}
              </div>
{isDanfoss && (
  <>
    <InputBox
      label="User ID"
       name="danfossuserId"
      placeholder="Enter User ID"
      value={userId}
      onChange={(name, value) => setUserId(value)}
      icon={faUser}
    />

    <InputBox
      label="Manager ID"
      name="managerId"
      placeholder="Enter Manager ID"
      value={managerId}
      onChange={(name, value) => setManagerId(value)}
      icon={faUser}
    />

    <InputBox
      label="Manager Email"
      name="managerEmail"
      type="email"
      placeholder="Enter Manager Email"
      value={managerEmail}
      onChange={(name, value) => setManagerEmail(value)}
      icon={faEnvelope}
    />
     <InputBox
      label="Cost Center"
      name="costCenter"
      placeholder="Enter Cost Center"
      value={costCenter}
      onChange={(name, value) => setCostCenter(value)}
      icon={faHashtag}
    />
  </>
)}
              <InputBox
                label={<>Permanent Address</>}
                name="address"
                required={false}
                placeholder="Enter Permanent Address"
                value={userAddress}
                onChange={(name, value) => setAddress(value)}
                icon={faMapMarkerAlt}
              />

              <InputBox
                label={<>Present Address</>}
                name="presentAddress"
                required={false}
                placeholder="Enter Present Address"
                value={presentAddress}
                onChange={(name, value) => setPresentAddress(value)}
                icon={faMapMarkerAlt}
              />

              <InputBox
                label={<>Pin Code</>}
                name="pinCode"
                required={false}
                placeholder={loadingPincode ? "Loading pincode..." : "Enter Pin Code (auto-filled)"}
                value={pinCode}
                onChange={(name, value) => setPinCode(value)}
                icon={faHashtag}
                disabled={loadingPincode}
              />
            </div>

            <div className="flex justify-end pt-4">
              <CommonButton
                text="Submit"
                type="submit"
                variant="success"
                disabled={loadingPincode}
              />
            </div>
          </form>
        </div>
      </main>
      <AlertContainer/>
    </PageLayout>
  );
}
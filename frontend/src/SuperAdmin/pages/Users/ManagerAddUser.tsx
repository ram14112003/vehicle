import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import config from "../../../config/config";
import Footer from "../../../components/Homepage/Footer";

interface Company {
  companyId: string;
  companyName: string;
  seoUrl?: string;
    companyLogo?: string;

}

export default function ManagerAddUser() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const { seoUrl } = useParams();
  const [companyName, setCompanyName] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [danfossUserId, setDanfossUserId] = useState("");
const [managerId, setManagerId] = useState("");
const [managerEmail, setManagerEmail] = useState("");
const [costCenter, setCostCenter] = useState("");
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

  const navigate = useNavigate();

  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCompanySEO, setSelectedCompanySEO] = useState<string>("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const BASE_URL = config.baseurl.apibaseurl;

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

    // Danfoss validation
    if (companyName?.toLowerCase().includes("danfoss")) {
      const emailLower = email.trim().toLowerCase();
      if (!emailLower.endsWith("@danfoss.com") ) {
        showToast("Danfoss users must use @danfoss.com email only.", "error");
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
      showToast("Please select a city.", "warn");
      return;
    }

    if (!companyId) {
      showToast("Company not found. Please refresh and try again.", "warn");
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
          danfossuserId: danfossUserId,
  managerId: managerId,
  managerEmail: managerEmail,
    costCenter: costCenter
      };

      const response = await axiosInstance.post("/auth/createUser", payload);

      if (response.data?.success || response.status === 200 || response.status === 201) {
        showToast("User added successfully. Password sent to user email.", "success");

        setUsername("");
        setEmail("");
        setMobile("");
        setGender("male");
        setCountry("");
        setState("");
        setCity("");
        setAddress("");
        setPresentAddress("");
        setPinCode("");
        setIsManager(false);
        setCostCenter("");

        setTimeout(() => navigate(`/company/${seoUrl}`), 1000);
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
  const fetchCompanyDetails = async () => {
    try {
      if (!seoUrl) {
        showToast("SEO URL not found in the link!", "error");
        return;
      }

      const response = await axiosInstance.get(`/company/${seoUrl}`);
      const company = response.data?.data || response.data;

      if (company?.companyName) {
        setCompanyName(company.companyName);
        setCompanyId(company.companyId);
        setCompanyLogo(company.companyLogo || null);

        localStorage.setItem("companyId", company.companyId);
        localStorage.setItem("companyName", company.companyName);

        if (company.companyLogo) {
          localStorage.setItem("companyLogo", company.companyLogo);
        } else {
          localStorage.removeItem("companyLogo");
        }
      } else {
        showToast("No company found for this SEO URL", "error");
      }
    } catch (err) {
      console.error("Error fetching company:", err);
      showToast("Something went wrong while fetching company", "error");
    }
  };

  fetchCompanyDetails();
}, [seoUrl]);
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axiosInstance.get("/company/getAllCompany");
        if (response.status === 200 && Array.isArray(response.data.data)) {
          setCompanies(response.data.data);

          const localCompanyName = localStorage.getItem("companyName");
          if (localCompanyName) {
            const matchedCompany = response.data.data.find(
              (c: any) => c.companyName.toLowerCase() === localCompanyName.toLowerCase()
            );
            if (matchedCompany) {
              setCompanyId(matchedCompany.companyId);
              setSelectedCompanySEO(matchedCompany.seoUrl || "");
            }
          }
        }
      } catch (error) {
        showToast("Failed to fetch companies", "error");
      }
    };

    fetchCompanies();
  }, []);

  return (
    <>
      <PageLayout>
        <main className="py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Add User</h1>

        {companyLogo && (
  <img
    src={`${BASE_URL}/uploads/companyLogo/${companyLogo}`}
    alt="Company Logo"
    className="h-12 object-contain"
  />
)}
          </div>

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
                  type="select"
                  required={false}
                  value={city}
                  onChange={handleCityChange}
                  options={cities.map((c: ICity) => ({
                    value: c.name,
                    label: c.name,
                  }))}
                  placeholder="Select City"
                  icon={<FontAwesomeIcon icon={faCity} />}
                  disabled={!state}
                />

                <div>
                  <label className="block text-gray-700 mb-1">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    disabled
                    className="border p-2 w-full bg-gray-100 cursor-not-allowed"
                  />

                  {companyName?.toLowerCase().includes("danfoss") && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="isManager"
                        checked={isManager}
                        onChange={(e) => setIsManager(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="isManager" className="text-gray-700">
                        Is Manager
                      </label>
                    </div>
                  )}
                </div>
{companyName?.toLowerCase().includes("danfoss") && (
  <>
    <InputBox
      label={<>User ID</>}
      name="danfossUserId"
      placeholder="Enter User ID"
      value={danfossUserId}
      onChange={(name, value) => setDanfossUserId(value)}
      icon={faUser}
    />

    <InputBox
      label={<>Manager ID</>}
      name="managerId"
      placeholder="Enter Manager ID"
      value={managerId}
      onChange={(name, value) => setManagerId(value)}
      icon={faUser}
    />

    <InputBox
      label={<>Manager Email</>}
      name="managerEmail"
      type="email"
      placeholder="Enter Manager Email"
      value={managerEmail}
      onChange={(name, value) => setManagerEmail(value)}
      icon={faEnvelope}
    />
       <InputBox
      label={<>Cost Center</>}
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
      </PageLayout>
      <Footer />
      <AlertContainer/>
    </>
  );
}
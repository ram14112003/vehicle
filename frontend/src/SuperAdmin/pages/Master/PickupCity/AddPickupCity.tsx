// import React, { useEffect, useState, FormEvent } from "react";
// import { useNavigate } from "react-router-dom";
// import PageLayout from "../../../../components/PageLayout";
// import CommonButton from "../../../../components/CommonButton";
// import InputBox from "../../../../components/InputBox";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faGlobe,
//   faMapMarkedAlt,
//   faCity,
//   faSortNumericUp,
// } from "@fortawesome/free-solid-svg-icons";
// import { showToast } from "../../../../components/AlertBox";
// import axiosInstance from "../../../../utils/axiosInstance";

// // ✅ Import country-state-city package
// import { Country, State, City, ICountry, IState, ICity } from "country-state-city";

// interface PickupCityForm {
//   country: string;
//   state: string;
//   pickupCity: string;
//   sortOrder: string;
//   isPickupCity: boolean;
// }

// const AddPickupCity: React.FC = () => {
//   const navigate = useNavigate();

//   const [form, setForm] = useState<PickupCityForm>({
//     country: "India", // Pre-selected
//     state: "",
//     pickupCity: "",
//     sortOrder: "",
//     isPickupCity: true,
//   });

//   // ✅ Dropdown states
//   const [countries, setCountries] = useState<ICountry[]>([]);
//   const [states, setStates] = useState<IState[]>([]);
//   const [cities, setCities] = useState<ICity[]>([]);

//   // ✅ Load India by default
//   useEffect(() => {
//     const india = Country.getAllCountries().filter((c) => c.name === "India");
//     setCountries(india);

//     if (india.length > 0) {
//       setForm((prev) => ({
//         ...prev,
//         country: india[0].name,
//       }));
//       setStates(State.getStatesOfCountry(india[0].isoCode));
//     }
//   }, []);

//   // ✅ Handle Country Change
//   const handleCountryChange = (name: string, value: string) => {
//     const selectedCountry = countries.find((c) => c.name === value);
//     setForm((prev) => ({ ...prev, country: value, state: "", pickupCity: "" }));

//     if (selectedCountry) {
//       setStates(State.getStatesOfCountry(selectedCountry.isoCode));
//       setCities([]);
//     } else {
//       setStates([]);
//       setCities([]);
//     }
//   };

//   // ✅ Handle State Change
//   const handleStateChange = (name: string, value: string) => {
//     const selectedState = states.find((s) => s.name === value);
//     const countryIso = countries.find((c) => c.name === form.country)?.isoCode;
//     setForm((prev) => ({ ...prev, state: value, pickupCity: "" }));

//     if (countryIso && selectedState) {
//       setCities(City.getCitiesOfState(countryIso, selectedState.isoCode));
//     } else {
//       setCities([]);
//     }
//   };

//   // ✅ Handle InputBox changes
//   const handleInputBoxChange = (name: string, value: string | boolean) => {
//     setForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   // ✅ Submit Form
// const handleSubmit = async (e: FormEvent) => {
//   e.preventDefault();

//   // --- Validation ---
//   if (!form.country.trim()) {
//     showToast("Please select a country.", "warn");
//     return;
//   }

//   if (!form.state.trim()) {
//     showToast("Please select a state.", "warn");
//     return;
//   }

//   if (!form.pickupCity.trim()) {
//     showToast("Please select a pickup city.", "warn");
//     return;
//   }

//   if (!form.sortOrder.trim()) {
//     showToast("Please enter sort order.", "warn");
//     return;
//   }

//   // Sort order must be a number
//   if (isNaN(Number(form.sortOrder))) {
//     showToast("Sort order must be a number.", "warn");
//     return;
//   }

//   try {
//     await axiosInstance.post("/location/addPickupCity", form);
//     showToast("Pickup City Added Successfully!", "success");

//     // Reset form
//     setForm({
//       country: "India",
//       state: "",
//       pickupCity: "",
//       sortOrder: "",
//       isPickupCity: true,
//     });
//     setStates([]);
//     setCities([]);

//     navigate("/master/pickupcity/list");
//   } catch (error) {
    
//     showToast(
//       "Pickup city could not be added. This name may already exist.",
//       "error"
//     );
//   }
// };


//   return (
//     <PageLayout>
//       <main className="py-6">
//         <h1 className="text-3xl font-bold text-gray-800">Add Pickup City</h1>

//         <div className="max-w-2xl bg-white py-3">
//           <h2 className="text-xl font-semibold text-[#025A64] flex items-center gap-2 py-3 underline">
//             <FontAwesomeIcon icon={faCity} />
//             Add Pickup City
//           </h2>

//           <form onSubmit={handleSubmit} className="space-y-6 py-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* ✅ Country */}
//              <InputBox
//   label={
//     <>
//       Country <span className="text-red-500">*</span>
//     </>
//   }
//   name="country"
//   type="select"
//   value={form.country}
//   onChange={handleCountryChange}
//   options={countries.map((c: ICountry) => ({
//     value: c.name,
//     label: c.name,
//   }))}
//   placeholder="Select Country"
//   icon={<FontAwesomeIcon icon={faGlobe} />}
// />

// <InputBox
//   label={
//     <>
//       State <span className="text-red-500">*</span>
//     </>
//   }
//   name="state"
//   type="select"
//   value={form.state}
//   onChange={handleStateChange}
//   options={states.map((s: IState) => ({
//     value: s.name,
//     label: s.name,
//   }))}
//   placeholder="Select State"
//   icon={<FontAwesomeIcon icon={faMapMarkedAlt} />}
//   disabled={!form.country}
// />

// <InputBox
//   label={
//     <>
//       Pickup City <span className="text-red-500">*</span>
//     </>
//   }
//   name="pickupCity"
//   type="select"
//   value={form.pickupCity}
//   onChange={handleInputBoxChange}
//   options={cities.map((c: ICity) => ({
//     value: c.name,
//     label: c.name,
//   }))}
//   placeholder="Select City"
//   icon={<FontAwesomeIcon icon={faCity} />}
// />

// <InputBox
//   label={
//     <>
//       Sort Order <span className="text-red-500">*</span>
//     </>
//   }
//   name="sortOrder"
//   placeholder="Enter Sort Order"
//   icon={<FontAwesomeIcon icon={faSortNumericUp} />}
//   value={form.sortOrder}
//   onChange={handleInputBoxChange}
// />

//             </div>

//             {/* Checkbox */}
//             <div className="flex items-center space-x-2 mt-4">
//               <input
//                 id="isPickupCity"
//                 name="isPickupCity"
//                 type="checkbox"
//                 checked={form.isPickupCity}
//                 onChange={(e) =>
//                   setForm((prev) => ({ ...prev, isPickupCity: e.target.checked }))
//                 }
//                 className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
//               />
//               <label htmlFor="isPickupCity" className="text-sm font-medium text-gray-700">
//                 Is Pickup City
//               </label>
//               <p className="text-xs text-red-600 ml-4">
//                 Note: Uncheck to save as destination city.
//               </p>
//             </div>

//             <div className="flex justify-end pt-4">
//               <CommonButton text="Submit" type="submit" variant="success" />
//             </div>
//           </form>
//         </div>
//       </main>
//     </PageLayout>
//   );
// };

// export default AddPickupCity;




import React, { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../../../components/PageLayout";
import CommonButton from "../../../../components/CommonButton";
import InputBox from "../../../../components/InputBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGlobe,
  faMapMarkedAlt,
  faCity,
} from "@fortawesome/free-solid-svg-icons";
import { AlertContainer, showToast } from "../../../../components/AlertBox";
import axiosInstance from "../../../../utils/axiosInstance";

import {
  Country,
  State,
  City,
  ICountry,
  IState,
  ICity,
} from "country-state-city";

interface PickupCityForm {
  country: string;
  state: string;
  pickupCity: string;
  isPickupCity: boolean;
}

const AddPickupCity: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<PickupCityForm>({
    country: "India",
    state: "",
    pickupCity: "",
    isPickupCity: true,
  });

  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);

  // Load India default
  useEffect(() => {
    const india = Country.getAllCountries().filter(
      (c) => c.name === "India"
    );

    setCountries(india);

    if (india.length > 0) {
      setForm((prev) => ({
        ...prev,
        country: india[0].name,
      }));
      setStates(State.getStatesOfCountry(india[0].isoCode));
    }
  }, []);

  const handleCountryChange = (name: string, value: string) => {
    const selectedCountry = countries.find((c) => c.name === value);

    setForm((prev) => ({
      ...prev,
      country: value,
      state: "",
      pickupCity: "",
    }));

    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry.isoCode));
    }
  };

  const handleStateChange = (name: string, value: string) => {
    const selectedState = states.find((s) => s.name === value);
    const countryIso = countries.find(
      (c) => c.name === form.country
    )?.isoCode;

    setForm((prev) => ({
      ...prev,
      state: value,
      pickupCity: "",
    }));

    if (countryIso && selectedState) {
   
    }
  };

  const handleInputBoxChange = (
    name: string,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.country.trim()) {
      showToast("Please select a country.", "warn");
      return;
    }

    if (!form.state.trim()) {
      showToast("Please select a state.", "warn");
      return;
    }

    if (!form.pickupCity.trim()) {
      showToast("Please select a pickup city.", "warn");
      return;
    }

    try {
      await axiosInstance.post("/location/addPickupCity", form);
      showToast("Pickup City Added Successfully!", "success");

      setForm({
        country: "India",
        state: "",
        pickupCity: "",
        isPickupCity: true,
      });

      setStates([]);

      navigate("/master/pickupcity/list");
    } catch (error) {
      showToast(
        "Pickup city could not be added. This name may already exist.",
        "error"
      );
    }
  };

  return (
    <>
    <PageLayout>
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Add Pickup City
        </h1>

        <div className="max-w-2xl bg-white py-3">
          <h2 className="text-xl font-semibold text-[#025A64] flex items-center gap-2 py-3 underline">
            <FontAwesomeIcon icon={faCity} />
            Add Pickup City
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputBox
                label={
                  <>
                    Country <span className="text-red-500">*</span>
                  </>
                }
                name="country"
                type="select"
                value={form.country}
                onChange={handleCountryChange}
                options={countries.map((c) => ({
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
                value={form.state}
                onChange={handleStateChange}
                options={states.map((s) => ({
                  value: s.name,
                  label: s.name,
                }))}
                placeholder="Select State"
                icon={<FontAwesomeIcon icon={faMapMarkedAlt} />}
                disabled={!form.country}
              />

            <InputBox
  label={
    <>
      Pickup City <span className="text-red-500">*</span>
    </>
  }
  name="pickupCity"
  type="text"   // 🔁 select → text
  value={form.pickupCity}
  onChange={handleInputBoxChange}
  placeholder="Enter Pickup City"
  icon={<FontAwesomeIcon icon={faCity} />}
/>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <input
                id="isPickupCity"
                name="isPickupCity"
                type="checkbox"
                checked={form.isPickupCity}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isPickupCity: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-orange-600 border-gray-300 rounded"
              />
              <label
                htmlFor="isPickupCity"
                className="text-sm font-medium text-gray-700"
              >
                Is Pickup City
              </label>
           
            </div>

            <div className="flex justify-end pt-4">
              <CommonButton text="Submit" type="submit" variant="success" />
            </div>
          </form>
        </div>
      </main>
    </PageLayout>
    <AlertContainer/>
    </>
  );
};

export default AddPickupCity;

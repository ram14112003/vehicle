import React, { useEffect, useState, FormEvent } from "react";
import PageLayout from '../../../../components/PageLayout';
import CommonButton from '../../../../components/CommonButton';
import InputBox from '../../../../components/InputBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faPercentage, faMapMarker } from '@fortawesome/free-solid-svg-icons';
import {
  faCity,
  faMapMarkedAlt,
  faMap
} from '@fortawesome/free-solid-svg-icons';
import { AlertContainer, showToast } from '../../../../components/AlertBox';
import axiosInstance from "../../../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

interface CityResponse {
  pickupCity: string;
}

const PickupAreaAdd: React.FC = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axiosInstance.get<{ data: CityResponse[] }>("/city/listCity");
        const cityList = response.data.data.map((item) => item.pickupCity);
        setCities(cityList);
      } catch (error) {
       
        showToast("Failed to load cities.", "error");
      }
    };

    fetchCities();
  }, []);

  const validateForm = () => {
    if (!city.trim()) {
      showToast("Please select a city.", "warn");
      return false;
    }

    if (!area.trim()) {
      showToast("Please enter a pickup area.", "warn");
      return false;
    }

    const areaRegex = /^[A-Za-z\s]+$/; // only letters & spaces
    if (!areaRegex.test(area)) {
      showToast("Pickup area should contain only letters.", "warn");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await axiosInstance.post("/location/addPickUpArea", {
        pickupCity: city,
        pickupArea: area,
      });

      showToast("Pickup Area added successfully!", "success");
      setCity("");
      setArea("");
      navigate("/master/pickuparea/info");
    } catch (error) {
     
      showToast("This area name already exists.", "error");
    }
  };

  return (
    <>
    <PageLayout>
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800">Add Pickup Area</h1>
        <div className="max-w-2xl bg-white py-3">
          <h2 className="text-xl font-semibold text-[#025A64] flex items-center gap-2 py-3 underline">
            <FontAwesomeIcon icon={faMap} />
            Pickup Area Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            {/* Pickup City Dropdown */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label htmlFor="pickupCity" className="w-40 font-medium text-gray-700 flex items-center">
                <FontAwesomeIcon icon={faCity} className="mr-2 text-gray-500" />
                Pickup City <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 w-full sm:max-w-sm">
                <select
                  id="pickupCity"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  // required
                >
                  <option value="">Select a city</option>
                  {cities.map((pickupCity, index) => (
                    <option key={index} value={pickupCity}>
                      {pickupCity}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pickup Area Input */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label htmlFor="pickupArea" className="w-40 font-medium text-gray-700 flex items-center">
                <FontAwesomeIcon icon={faMapMarkedAlt} className="mr-2 text-gray-500" />
                Pickup Area <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 w-full mt-6 sm:max-w-sm">
                <InputBox
                  name="pickupArea"
                  type="text"
                  placeholder="Enter your Pickup Area"
                  value={area}
                  onChange={(name, value) => setArea(value)}
                  // required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end sm:pl-44 pt-4">
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

export default PickupAreaAdd;

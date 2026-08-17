import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../../utils/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import { showToast, AlertContainer } from "../../../../components/AlertBox";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Interfaces
interface City {
  cityId: string;
  pickupCity: string;
}

interface VehicleType {
  vehicleTypeId: string;
  vehicleType: string;
}

interface VehicleModelItem {
  vehicleMasterId: string;
  vehicleTypeId: string;
  vehicleModelName: string;
  vehicleNumber: string;
  vehicleId: string;
}

type VehicleModelsApiResp =
  | {
      message?: string;
      vehicleType?: any;
      total?: number;
      items: VehicleModelItem[];
      grouped?: any[];
    }
  | {
      data: {
        message?: string;
        vehicleType?: any;
        total?: number;
        items: VehicleModelItem[];
        grouped?: any[];
      };
    };

interface FullOrderDetails {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
  pickupPoint: string;
  pickupCity: string;
  pickupArea: string;
  dropPoint: string;
  carType?: string;
  vehicleTypeId: string;
  vehicleId?: string;
  vehicleMasterId?: string;
  vehicle?: {
    vehicleId?: string;
    vehicleMaster?: {
      vehicleMasterId?: string;
      vehicleModelName?: string;
      vehicleNumber?: string;
    };
  };
  pickupStation?: string;
  pickupAirport?: string;
  trainNumber?: string;
  flightNo?: string;
  // ✅ New fields
  behalfOfName?: string;
  behalfOfPhone?: string;
  costCenter?: string;
  managerEmail?: string;
  companyId?: string;
}

const formatFromISO = (isoString: string | null) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

const EditClosePendingOrder: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();

  const [pickupPoint, setPickupPoint] = useState<string>("Local city use");
  const [formData, setFormData] = useState({
    bookingCode: "",
    orderDate: "",
    pickupDate: null as Date | null,
    pickupCity: "",
    pickupArea: "",
    dropArea: "",
    destinationCity: "",
    carType: "",
    pickupStation: "",
    pickupAirport: "",
    trainNumber: "",
    bookingFor: "Self",
    onBehalfOf: "",
    // ✅ New fields
    behalfOfPhone: "",
    costCenter: "",
    managerEmail: "",
  });

  // ✅ Danfoss detection
  const [showDanfossFields, setShowDanfossFields] = useState(false);

  const [areaType, setAreaType] = useState<"pickupArea" | "preDefinedArea">("pickupArea");
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [carTypes, setCarTypes] = useState<VehicleType[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const [vehicleItems, setVehicleItems] = useState<VehicleModelItem[]>([]);
  const [loadingVehicleItems, setLoadingVehicleItems] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedVehicleMasterId, setSelectedVehicleMasterId] = useState<string>("");
  const [selectedVehicleModelName, setSelectedVehicleModelName] = useState<string>("");

  const vehicleFetchReqId = useRef(0);

  const pickupPointsList = ["Local city use", "Outstation"];
  const pickupStations = ["Central Station", "Egmore", "Tambaram"];
  const airports = ["Chennai Airport", "Bangalore Airport", "Mumbai Airport"];
  const destinationCities = ["Coimbatore", "Madurai", "Trichy", "Salem"];
  const predefinedAreas = ["Anna Nagar", "T Nagar", "Adyar", "Velachery"];

  // Fetch cities
  useEffect(() => {
    const fetchPickupCities = async () => {
      setLoadingCities(true);
      try {
        const res = await axiosInstance.get<{ data: City[] }>("/city/listCity?status=0");
        setCities(Array.isArray(res.data.data) ? res.data.data : []);
      } catch {
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchPickupCities();
  }, []);

  // Fetch car types
  useEffect(() => {
    const fetchCarTypes = async () => {
      setLoadingCars(true);
      try {
        const res = await axiosInstance.get<{ data: VehicleType[] }>("/vehicleType/getAllVehicleType");
        setCarTypes(Array.isArray(res.data.data) ? res.data.data : []);
      } catch {
        setCarTypes([]);
      } finally {
        setLoadingCars(false);
      }
    };
    fetchCarTypes();
  }, []);

  const extractItems = (resp: VehicleModelsApiResp): VehicleModelItem[] => {
    const anyResp: any = resp as any;
    const items = anyResp?.items ?? anyResp?.data?.items ?? anyResp?.data?.data?.items;
    return Array.isArray(items) ? items : [];
  };

  const fetchVehicleModelsByType = async (vehicleTypeId: string) => {
    if (!vehicleTypeId) {
      setVehicleItems([]);
      return [];
    }
    const reqId = ++vehicleFetchReqId.current;
    setLoadingVehicleItems(true);
    try {
      setVehicleItems([]);
      const vmRes = await axiosInstance.get<VehicleModelsApiResp>(
        `/vehicle/vehicleType/${vehicleTypeId}/vehicle-models`
      );
      const items = extractItems(vmRes.data);
      if (reqId !== vehicleFetchReqId.current) return [];
      const filtered = items.filter((x) => x.vehicleTypeId === vehicleTypeId);
      setVehicleItems(filtered);
      return filtered;
    } catch (e) {
      if (reqId === vehicleFetchReqId.current) setVehicleItems([]);
      return [];
    } finally {
      if (reqId === vehicleFetchReqId.current) setLoadingVehicleItems(false);
    }
  };

  useEffect(() => {
    const vtId = formData.carType;
    setSelectedVehicleId("");
    setSelectedVehicleMasterId("");
    setSelectedVehicleModelName("");
    setVehicleItems([]);
    if (!vtId) return;
    fetchVehicleModelsByType(vtId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.carType]);

  const vehicleOptions = useMemo(() => {
    return vehicleItems
      .slice()
      .sort((a, b) =>
        `${a.vehicleModelName || ""}-${a.vehicleNumber || ""}`.localeCompare(
          `${b.vehicleModelName || ""}-${b.vehicleNumber || ""}`
        )
      );
  }, [vehicleItems]);

  // ✅ Fetch order + detect Danfoss company
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!bookingId) {
        showToast("Booking ID not found in URL.", "error");
        setLoadingOrder(false);
        return;
      }
      setLoadingOrder(true);
      try {
        const response = await axiosInstance.post(`/order/getOrdersById`, { bookingId });
        const data: FullOrderDetails = response.data.data;

        // ✅ Detect Danfoss from companyId
const companyId =
  data.companyId ||
  (data as any)?.user?.company?.companyId;
          if (companyId) {
          try {
            const companyRes = await axiosInstance.get(`/company/getCompanyById/${companyId}`);
            const company =
              companyRes?.data?.data || companyRes?.data?.company || companyRes?.data;

            const name = String(company?.companyName || "").toLowerCase();
            const code = String(company?.companyCode || "").toLowerCase();
            const seoUrl = String(company?.seoUrl || "").toLowerCase();

            const isDanfoss =
              name.includes("danfoss") ||
              code.includes("danfoss") ||
              seoUrl.includes("danfoss") ||
              code === "dan";

            const managerApproval =
              company?.managerApproval === true || company?.managerApproval === 1;

const hasValues = !!(data?.managerEmail || data?.costCenter);
setShowDanfossFields((isDanfoss && managerApproval) || hasValues);
          } catch {
            setShowDanfossFields(false);
          }
        }

        const pickupCityObj = cities.find((city) => city.pickupCity === data.pickupCity);
        const carTypeId =
          data.vehicleTypeId ||
          carTypes.find((c) => c.vehicleType === data.carType)?.vehicleTypeId ||
          "";

        setFormData({
          bookingCode: data.bookingCode || "",
          orderDate: formatFromISO(data.bookingDate) || "",
          pickupDate: data.bookingDate ? new Date(data.bookingDate) : null,
          pickupCity: pickupCityObj?.cityId || "",
          pickupArea: data.pickupArea || "",
          dropArea: data.dropPoint || "",
          destinationCity: data.dropPoint || "",
          carType: carTypeId,
          pickupStation: data.pickupStation || "",
          pickupAirport: data.pickupAirport || "",
          trainNumber: data.trainNumber || data.flightNo || "",
          bookingFor: data.behalfOfName ? "On behalf of" : "Self",
          onBehalfOf: data.behalfOfName || "",
          // ✅ Populate new fields
          behalfOfPhone: data.behalfOfPhone || "",
      costCenter: data.costCenter || "",
managerEmail: data.managerEmail || (data as any)?.user?.company?.managerEmail || ""        });

        setPickupPoint(data.pickupPoint);
        if (predefinedAreas.includes(data.pickupArea)) setAreaType("preDefinedArea");
        else setAreaType("pickupArea");

        if (carTypeId) {
          const items = await fetchVehicleModelsByType(carTypeId);
          const existingVehicleId = data.vehicleId || data.vehicle?.vehicleId || "";
          const existingMasterId =
            data.vehicleMasterId || data.vehicle?.vehicleMaster?.vehicleMasterId || "";

          let selected: VehicleModelItem | undefined;
          if (existingVehicleId) selected = items.find((x) => x.vehicleId === existingVehicleId);
          if (!selected && existingMasterId)
            selected = items.find((x) => x.vehicleMasterId === existingMasterId);

          if (selected) {
            setSelectedVehicleId(selected.vehicleId);
            setSelectedVehicleMasterId(selected.vehicleMasterId);
            setSelectedVehicleModelName(selected.vehicleModelName || "Unknown Model");
          }
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        showToast("Failed to fetch order details. Please try again.", "error");
      } finally {
        setLoadingOrder(false);
      }
    };

    if (!loadingCities && !loadingCars) fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, cities, carTypes, loadingCities, loadingCars]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // ✅ behalfOfPhone: digits only, max 10
    if (name === "behalfOfPhone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, behalfOfPhone: digits }));
      return;
    }

    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prevData) => ({ ...prevData, pickupDate: date }));
  };

  const handlePickupPointChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPickupPoint(value);
    setFormData((prev) => ({
      ...prev,
      pickupArea: "",
      dropArea: "",
      destinationCity: "",
      pickupStation: "",
      pickupAirport: "",
      trainNumber: "",
    }));
    setAreaType("pickupArea");
  };

  const handleAreaTypeChange = (type: "pickupArea" | "preDefinedArea") => {
    setAreaType(type);
    setFormData((prevData) => ({ ...prevData, pickupArea: "" }));
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const found = vehicleItems.find((x) => x.vehicleId === vehicleId);
    if (!found) {
      setSelectedVehicleMasterId("");
      setSelectedVehicleModelName("");
      return;
    }
    setSelectedVehicleMasterId(found.vehicleMasterId);
    setSelectedVehicleModelName(found.vehicleModelName || "Unknown Model");
  };

  const handleEditOrder = async () => {
    // ✅ Mandatory validations

if (!formData.pickupDate) {
  showToast("Pickup date is required.", "error");
  return;
}

if (!formData.pickupCity) {
  showToast("Pickup city is required.", "error");
  return;
}

if (!formData.pickupArea) {
  showToast("Pickup area is required.", "error");
  return;
}

if (pickupPoint === "Local city use" && !formData.dropArea) {
  showToast("Drop area is required.", "error");
  return;
}

if (pickupPoint === "Outstation" && !formData.destinationCity) {
  showToast("Destination city is required.", "error");
  return;
}

if (pickupPoint === "Airport" && !formData.pickupAirport) {
  showToast("Pickup airport is required.", "error");
  return;
}

if (pickupPoint === "Airport" && !formData.trainNumber) {
  showToast("Flight number is required.", "error");
  return;
}

if (pickupPoint === "Railway station" && !formData.pickupStation) {
  showToast("Pickup station is required.", "error");
  return;
}

if (pickupPoint === "Railway station" && !formData.trainNumber) {
  showToast("Train number is required.", "error");
  return;
}

if (!formData.carType) {
  showToast("Car type is required.", "error");
  return;
}


if (showDanfossFields && !formData.managerEmail.trim()) {
  showToast("Approver manager email is required.", "error");
  return;
}

if (showDanfossFields && !formData.costCenter.trim()) {
  showToast("Cost center is required.", "error");
  return;
}
    if (!bookingId) {
      showToast("Booking ID not found.", "error");
      return;
    }
// ✅ Validate Approver Manager email must be @danfoss.com
if (showDanfossFields && formData.managerEmail) {
  const email = formData.managerEmail.trim().toLowerCase();

  if (!email.endsWith("@danfoss.com")) {
    showToast("Approver Manager email must be a @danfoss.com address.", "error");
    return;
  }
}
    // ✅ Validate behalfOfPhone if provided
    if (
      formData.bookingFor === "On behalf of" &&
      formData.behalfOfPhone &&
      !/^[0-9]{10}$/.test(formData.behalfOfPhone.trim())
    ) {
      showToast("Phone number must be 10 digits.", "error");
      return;
    }

    try {
      const pickupCityName = cities.find((city) => city.cityId === formData.pickupCity)?.pickupCity;
      const vehicleTypeName = carTypes.find((c) => c.vehicleTypeId === formData.carType)?.vehicleType;

      const payload: any = {
        bookingCode: formData.bookingCode,
        bookingDate: formData.pickupDate?.toISOString(),
        pickupCity: pickupCityName,
        pickupPoint: pickupPoint,
        pickupArea: formData.pickupArea,
        dropPoint: formData.dropArea || formData.destinationCity,
        pickupStation: formData.pickupStation,
        pickupAirport: formData.pickupAirport,
        trainNo: pickupPoint === "Railway station" ? formData.trainNumber : null,
        flightNo: pickupPoint === "Airport" ? formData.trainNumber : null,
        vehicleTypeId: formData.carType,
        carType: vehicleTypeName,
        // ✅ On behalf of fields
        behalfOfName: formData.bookingFor === "On behalf of" ? formData.onBehalfOf : null,
        behalfOfPhone:
          formData.bookingFor === "On behalf of"
            ? formData.behalfOfPhone.trim() || null
            : null,
        // ✅ Danfoss fields
        costCenter: showDanfossFields ? formData.costCenter.trim() || null : null,
        managerEmail: showDanfossFields ? formData.managerEmail.trim() || null : null,
      };

      if (selectedVehicleId) payload.vehicleId = selectedVehicleId;
      if (selectedVehicleMasterId) payload.vehicleMasterId = selectedVehicleMasterId;

      const res = await axiosInstance.put(`/order/editBooking/${bookingId}`, payload);
      showToast(res.data?.message || "Booking updated successfully.", "success");
    } catch (error) {
      const errorMessage =
        (error as any).response?.data?.message ||
        "An error occurred while updating the booking.";
      showToast(errorMessage, "error");
    }
  };

  if (loadingOrder || loadingCities || loadingCars) {
    return <div className="text-center py-10">Loading...</div>;
  }

  const renderDynamicFields = () => {
    return (
      <>
        {/* Pickup City */}
        <tr>
          <td className="w-[150px] py-1 pr-2 text-[13px] font-medium text-green-700">Pickup City</td>
          <td className="py-1">
            <select
              name="pickupCity"
              className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-200"
              value={formData.pickupCity}
              onChange={handleInputChange}
              disabled={loadingCities}
            >
              <option value="">Select Pickup City</option>
              {cities.map((city) => (
                <option key={city.cityId} value={city.cityId}>
                  {city.pickupCity}
                </option>
              ))}
            </select>
          </td>
        </tr>

        {/* Booking On Behalf Of */}
        <tr>
          <td className="w-[150px] py-1 pr-2 text-[13px] font-medium text-green-700 align-top">
            Booking On Behalf Of
          </td>
          <td className="py-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-[13px]">
                  <input
                    type="radio"
                    name="bookingFor"
                    value="Self"
                    checked={formData.bookingFor === "Self"}
                    onChange={handleInputChange}
                  />
                  Self
                </label>
                <label className="flex items-center gap-1 text-[13px]">
                  <input
                    type="radio"
                    name="bookingFor"
                    value="On behalf of"
                    checked={formData.bookingFor === "On behalf of"}
                    onChange={handleInputChange}
                  />
                  On behalf of
                </label>
              </div>

              {formData.bookingFor === "On behalf of" && (
                <div className="flex flex-col gap-2 mt-1">
                  {/* Person Name */}
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-green-700 w-[90px]">Person Name</span>
                    <input
                      type="text"
                      name="onBehalfOf"
                      value={formData.onBehalfOf}
                      onChange={handleInputChange}
                      placeholder="Enter name"
                      className="flex-1 h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  {/* ✅ Guest Phone Number */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-green-700 w-[90px]">Guest Phone</span>
                      <input
                        type="text"
                        name="behalfOfPhone"
                        value={formData.behalfOfPhone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        maxLength={10}
                        className="flex-1 h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    {formData.behalfOfPhone && !/^[0-9]{10}$/.test(formData.behalfOfPhone) && (
                      <p className="text-red-500 text-xs ml-[98px]">
                        Phone number must be 10 digits (optional)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>

        {/* ✅ Danfoss: Approver Manager + Cost Center */}
        {showDanfossFields && (
          <>
            <tr>
              <td className="w-[150px] py-1 pr-2 text-[13px] font-medium text-green-700">
                Approver Manager
              </td>
              <td className="py-1">
                <input
                  type="email"
                  name="managerEmail"
                  value={formData.managerEmail}
                  onChange={handleInputChange}
                  placeholder="Enter manager email"
                  className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                />
              </td>
            </tr>
            <tr>
              <td className="w-[150px] py-1 pr-2 text-[13px] font-medium text-green-700">
                Cost Center
              </td>
              <td className="py-1">
                <input
                  type="text"
                  name="costCenter"
                  value={formData.costCenter}
                  onChange={handleInputChange}
                  placeholder="Enter cost center"
                  className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                />
              </td>
            </tr>
          </>
        )}

        {/* Airport */}
        {pickupPoint === "Airport" && (
          <>
            <tr>
              <td className="w-[150px] py-1 pr-2 text-[13px] font-medium text-green-700">Pickup Airport</td>
              <td className="py-1">
                <select
                  name="pickupAirport"
                  className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                  value={formData.pickupAirport}
                  onChange={handleInputChange}
                >
                  <option value="">Select Airport</option>
                  {airports.map((airport) => (
                    <option key={airport} value={airport}>{airport}</option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="w-[150px] py-1 pr-2 text-[13px] font-medium text-green-700">Flight Number</td>
              <td className="py-1">
                <input
                  type="text"
                  name="trainNumber"
                  placeholder="Enter Flight Number"
                  value={formData.trainNumber}
                  onChange={handleInputChange}
                  className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                />
              </td>
            </tr>
          </>
        )}

        {/* Railway Station */}
        {pickupPoint === "Railway station" && (
          <>
            <tr>
              <td className="w-[150px] py-1 pr-2 text-[13px] font-medium text-green-700">Pickup Station</td>
              <td className="py-1">
                <select
                  name="pickupStation"
                  className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                  value={formData.pickupStation}
                  onChange={handleInputChange}
                >
                  <option value="">Select Station</option>
                  {pickupStations.map((station) => (
                    <option key={station} value={station}>{station}</option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="w-[150px] py-1 pr-2 text-[13px] font-medium text-green-700">Train Number</td>
              <td className="py-1">
                <input
                  type="text"
                  name="trainNumber"
                  placeholder="Enter Train Number"
                  value={formData.trainNumber}
                  onChange={handleInputChange}
                  className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                />
              </td>
            </tr>
          </>
        )}

        {/* Local city / Outstation Area */}
        {(pickupPoint === "Local city use" || pickupPoint === "Outstation") && (
          <tr>
            <td className="py-1 pr-2 text-[13px] font-medium text-green-700 align-top">Area</td>
            <td className="py-1">
              <div className="border border-gray-300 rounded p-2">
                <div className="flex items-center mb-1">
                  <input
                    type="radio"
                    id="pickupArea"
                    name="areaType"
                    value="pickupArea"
                    checked={areaType === "pickupArea"}
                    onChange={() => handleAreaTypeChange("pickupArea")}
                    className="mr-1"
                  />
                  <label htmlFor="pickupArea" className="text-[13px]">Pick Up Area</label>
                </div>
                {areaType === "pickupArea" ? (
                  <textarea
                    name="pickupArea"
                    value={formData.pickupArea}
                    onChange={handleInputChange}
                    placeholder="Please enter pick up area with land mark."
                    rows={3}
                    className="w-full px-2 py-1 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                  />
                ) : (
                  <select
                    name="pickupArea"
                    value={formData.pickupArea}
                    onChange={handleInputChange}
                    className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Select Pre-defined Area</option>
                    {predefinedAreas.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                )}
                <div className="flex items-center mt-1">
                  <input
                    type="radio"
                    id="preDefinedArea"
                    name="areaType"
                    value="preDefinedArea"
                    checked={areaType === "preDefinedArea"}
                    onChange={() => handleAreaTypeChange("preDefinedArea")}
                    className="mr-1"
                  />
                  <label htmlFor="preDefinedArea" className="text-[13px]">Pre-defined Area</label>
                </div>
              </div>
            </td>
          </tr>
        )}

        {/* Drop Area */}
        {pickupPoint === "Local city use" && (
          <tr>
            <td className="py-1 pr-2 text-[13px] font-medium text-green-700 align-top">Drop Area</td>
            <td className="py-1">
              <textarea
                name="dropArea"
                value={formData.dropArea}
                onChange={handleInputChange}
                placeholder="Please enter drop area with land mark."
                rows={3}
                className="w-full px-2 py-1 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
              />
            </td>
          </tr>
        )}

        {/* Destination City */}
        {pickupPoint === "Outstation" && (
          <tr>
            <td className="py-1 pr-2 text-[13px] font-medium text-green-700">Destination City</td>
            <td className="py-1">
              <select
                name="destinationCity"
                className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                value={formData.destinationCity}
                onChange={handleInputChange}
              >
                <option value="">Select Destination City</option>
                {destinationCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </td>
          </tr>
        )}

        {/* Car Type */}
        <tr>
          <td className="py-1 pr-2 text-[13px] font-medium text-green-700">Car Type</td>
          <td className="py-1">
            <select
              name="carType"
              className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-200"
              value={formData.carType}
              onChange={handleInputChange}
              disabled={loadingCars}
            >
              <option value="">-- Select Car Type --</option>
              {carTypes.map((car) => (
                <option key={car.vehicleTypeId} value={car.vehicleTypeId}>
                  {car.vehicleType}
                </option>
              ))}
            </select>
          </td>
        </tr>

        {/* Vehicle Model */}
        <tr>
          <td className="py-1 pr-2 text-[13px] font-medium text-green-700">Vehicle</td>
          <td className="py-1">
            <select
              className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-200"
              value={selectedVehicleId}
              onChange={(e) => handleVehicleSelect(e.target.value)}
              disabled={!formData.carType || loadingVehicleItems}
            >
              <option value="">
                {loadingVehicleItems
                  ? "Loading vehicles..."
                  : "-- Select Vehicle Model - Vehicle Number --"}
              </option>
              {vehicleOptions.map((v) => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  {v.vehicleModelName} - {v.vehicleNumber}
                </option>
              ))}
            </select>
          </td>
        </tr>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white p-2">
      <AlertContainer />
      <div>
        <div className="bg-[#48647c] text-white px-3 py-2 text-sm font-semibold flex items-center">
          <span className="mr-2" /> Order details
        </div>
        <div className="p-3 text-[13px]">
          <table className="w-full table-fixed">
            <tbody>
              <tr>
                <td className="w-[150px] py-1 pr-2 font-medium text-green-700">Order Number</td>
                <td className="py-1 relative">
                  <input
                    type="text"
                    name="bookingCode"
                    value={formData.bookingCode}
                    disabled
                    className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-200"
                  />
                </td>
              </tr>
              <tr>
                <td className="w-[150px] py-1 pr-2 font-medium text-green-700">Pickup Date</td>
                <td className="py-1 relative">
                  <div className="relative">
                    <DatePicker
                      selected={formData.pickupDate}
                      onChange={(date: Date | null) => handleDateChange(date)}
                      showTimeSelect
                      dateFormat="dd/MM/yyyy h:mm aa"
                      placeholderText="Select Pickup Date & Time"
                      className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-medium text-green-700">Pickup Point</td>
                <td className="py-1 relative">
                  <select
                    name="pickupPoint"
                    className="w-full h-8 px-2 text-[13px] border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-green-500"
                    value={pickupPoint}
                    onChange={handlePickupPointChange}
                  >
                    {pickupPointsList.map((point) => (
                      <option key={point} value={point}>{point}</option>
                    ))}
                  </select>
                </td>
              </tr>
              {renderDynamicFields()}
            </tbody>
          </table>
          <div className="text-center mt-3">
            <button
              onClick={handleEditOrder}
              className="bg-green-600 text-white text-sm font-semibold px-6 py-1.5 rounded-md shadow-md hover:bg-green-700 transition-colors"
            >
              Edit Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClosePendingOrder;
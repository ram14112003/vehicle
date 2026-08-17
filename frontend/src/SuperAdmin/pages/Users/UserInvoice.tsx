import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { AlertContainer, showToast } from "../../../components/AlertBox";
import config from "../../../config/config";
import TravelHeader from "./header";
import Footer from "./Footer";

interface BookingResponse {
  success: boolean;
  message?: string;
  data?: {
    bookingId: string;
    [key: string]: any;
  };
}

interface ManagerUser {
  userId: string;
  username: string;
  email?: string;
}

interface BookingForm {
  pickupDate: string;
  bookingFor: string;
  behalfOfPerson: string;
    behalfOfPhone: string;

  pickupPoint: string;
  pickupCity: string;
  pickupStation: string;
  pickupAirport: string;
  trainNumber: string;
  areaType?: string;
  area: string;
  dropArea: string;
  carType: string;
}

interface CompanyUser {
  userId: string;
  username: string;
  danfossuserId: string;
  email?: string;
  mobile?: string;
}

interface CompanyUsersResponse {
  data: CompanyUser[];
  message?: string;
  status?: string;
}

interface VehiclesResponse {
  message: string;
  count: number;
  vehicles: VehicleDetails[];
}

interface VehicleDetails {
  vehicleId: string;
  vehicleName: string;
  localPerHour: number;
  localPerKm: number;
  OutstationPerKm: number;
  OSDriverBata: number;
  vehicleImg: string[];
}

interface City {
  cityId: string;
  pickupCity: string;
}

interface VehicleType {
  vehicleTypeId: string;
  vehicleType: string;
}

interface PackageData {
  packageId: string;
  packageName: string;
  amount: number;
}

interface PackageDataResponse {
  data: PackageData[];
  message?: string;
  status?: string;
}

type LocalCityPkgRow = {
  packageId: string;
  title: string;
  hours: number;
  km: number;
  amount: number;
};

interface PackageDetailsResponse {
  success: boolean;
  vehicleType: {
    vehicleTypeId: string;
    vehicleType: string;
  };
  packages: Array<{
    packageDataId: string;
    packageType: string;
    companyId: string;
    vehicleType: string;
    outstation?: {
      perKm: number;
      driverBattaPerDay: number;
      minimumKmPerDay: number;
    };
    localCity?: {
      packageDefinitions: Record<string, { hours: number; km: number }>;
      packages: LocalCityPkgRow[];
      extraKm: number;
      extraHour: number;
    };
  }>;
  tax: Array<{ taxId: string; taxName: string; taxPercent: number }> | null;
}

interface VehicleSchedule {
  vehicleTypeId: string;
  vehicleType: string;
  priorMinutes: number;
}

const UserInvoice: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: userId } = useParams<{ id: string }>();
  const queryParams = new URLSearchParams(location.search);
  const companyId = queryParams.get("companyId");

  const isCopyMode = location.state?.copyFromBooking;
  const copiedBookingData = location.state?.bookingData;

  const [packageDetails, setPackageDetails] = useState<PackageDetailsResponse | null>(null);
  const [loadingPackageDetails, setLoadingPackageDetails] = useState(false);
  const [vehicleSchedules, setVehicleSchedules] = useState<VehicleSchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
const [costCenter, setCostCenter] = useState("");
const [managerEmail, setManagerEmail] = useState("");
const [managerUserId, setManagerUserId] = useState("");
const [managers, setManagers] = useState<ManagerUser[]>([]);
const [loadingManagers, setLoadingManagers] = useState(false);
  const [formData, setFormData] = useState<BookingForm>({
    pickupDate: "",
    bookingFor: "Self",
    behalfOfPerson: "",
    behalfOfPhone: "",

    pickupPoint: "",
    pickupCity: "",
    pickupStation: "",
    pickupAirport: "",
    trainNumber: "",
    areaType: "pickupArea",
    area: "",
    dropArea: "",
    carType: "",
  });

  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(true);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [behalfOfUsers, setBehalfOfUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pickupCities, setPickupCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [carTypes, setCarTypes] = useState<VehicleType[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleDetails[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const pickupPoints = ["Local city use", "Outstation"];

const [showDanfossFields, setShowDanfossFields] = useState(false);
const [managerSearch, setManagerSearch] = useState("");
const [showManagerDropdown, setShowManagerDropdown] = useState(false);
const managerBoxRef = React.useRef<HTMLDivElement | null>(null);
const datePickerRef = useRef<any>(null);
const [requireManagerApproval, setRequireManagerApproval] = useState(false);
const [behalfSearch, setBehalfSearch] = useState("");
const [showBehalfDropdown, setShowBehalfDropdown] = useState(false);
const behalfBoxRef = useRef<HTMLDivElement | null>(null);
const [notes, setNotes] = useState("");

// const roundUpToNextInterval = (date: Date, intervalMinutes: number) => {
//   const d = new Date(date);
//   d.setSeconds(0, 0);

//   const minutes = d.getMinutes();
//   const remainder = minutes % intervalMinutes;

//   if (remainder !== 0) d.setMinutes(minutes + (intervalMinutes - remainder));
//   return d;
// };
const getCurrentTimeSlot = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;

  const hour = now.getHours();
  const min = roundedMinutes === 60 ? 0 : roundedMinutes;
  const hr = roundedMinutes === 60 ? hour + 1 : hour;

  return `${String(hr).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};
const getMinSelectableTime = (selected: Date | null) => {
  if (!selected) return undefined;

  // 👉 only for Danfoss
  if (!showDanfossFields) return undefined;

  const now = new Date();

  const isToday =
    selected.getFullYear() === now.getFullYear() &&
    selected.getMonth() === now.getMonth() &&
    selected.getDate() === now.getDate();

 if (isToday) {
    // add exact 30 mins
    const plus30 = new Date(now.getTime() + 30 * 60 * 1000);
    plus30.setSeconds(0, 0); // optional clean seconds
    return plus30;
  }

  // future date → allow from midnight
  const startOfDay = new Date(selected);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

const getMaxSelectableTime = (selected: Date | null) => {
  if (!selected) return undefined;
  // ✅ only for Danfoss
  if (!showDanfossFields) return undefined;

  const end = new Date(selected);
  end.setHours(23, 45, 0, 0);
  return end;
};
const toNum = (v: any) => {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const visibleOutstationPackages =
  packageDetails?.packages?.filter((p) => {
    const perKm = toNum(p.outstation?.perKm);
    const bata = toNum(p.outstation?.driverBattaPerDay);
    const minKm = toNum(p.outstation?.minimumKmPerDay);
    return !(perKm === 0 && bata === 0 && minKm === 0);
  }) ?? [];

const visibleLocalPackages =
  packageDetails?.packages
    ?.map((p) => {
      const validRows = (p.localCity?.packages || []).filter((d) => toNum(d.amount) > 0);
      if (validRows.length === 0) return null;
      return { ...p, __validRows: validRows };
    })
    .filter(Boolean) ?? [];

const fetchManagerByUserId = async (userId: string) => {
  try {
    const res = await axiosInstance.get(
      `/user/getManagerByUserId/${userId}`
    );

    const data = res.data?.data;

    if (data) {
      setManagerUserId(data.managerId || "");
      setManagerEmail(data.managerEmail || "");
      setCostCenter(data.costCenter || "");
    }
  } catch (err) {
    console.error("Error fetching manager details", err);
  }
};
useEffect(() => {
  const onClick = (e: MouseEvent) => {
    if (!behalfBoxRef.current) return;

    if (!behalfBoxRef.current.contains(e.target as Node)) {
      setShowBehalfDropdown(false);
    }
  };

  document.addEventListener("mousedown", onClick);
  return () => document.removeEventListener("mousedown", onClick);
}, []);
useEffect(() => {
  const onClick = (e: MouseEvent) => {
    if (!managerBoxRef.current) return;
    if (!managerBoxRef.current.contains(e.target as Node)) {
      setShowManagerDropdown(false);
    }
  };
  document.addEventListener("mousedown", onClick);
  return () => document.removeEventListener("mousedown", onClick);
}, []);
const filteredBehalfUsers = behalfOfUsers.filter((u) => {
  const q = behalfSearch.trim().toLowerCase();
  if (!q) return true;

  return (
    (u.username || "").toLowerCase().includes(q) ||
       (u.danfossuserId || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) 
  );
});
const filteredManagers = managers.filter((m) => {
  const q = managerSearch.trim().toLowerCase();
  if (!q) return true;
  return (
    (m.username || "").toLowerCase().includes(q) ||
    (m.email || "").toLowerCase().includes(q)
  );
});

const selectedManager = managers.find((m) => m.userId === managerUserId);


  const fetchVehicleSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const res = await axiosInstance.get<{ data: any[] }>(
        "/vehicleType/getAllVehicleType"
      );

      if (Array.isArray(res.data.data)) {
        const mapped = res.data.data.map((item) => ({
          vehicleTypeId: item.vehicleTypeId,
          vehicleType: item.vehicleType,
          priorMinutes: item.priorMinutes ?? 0,
        }));

        setVehicleSchedules(mapped);
      } else {
        setVehicleSchedules([]);
      }
    } catch (err) {
      console.error("Error fetching booking schedule", err);
      setVehicleSchedules([]);
    } finally {
      setLoadingSchedule(false);
    }
  };
useEffect(() => {
  if (!companyId) return;

  const checkCompany = async () => {
    try {
      const res = await axiosInstance.get(`/company/getCompanyById/${companyId}`);
      const company = res?.data?.data || res?.data?.company || res?.data;

      const name = String(company?.companyName || "").toLowerCase();
      const code = String(company?.companyCode || "").toLowerCase();
      const seoUrl = String(company?.seoUrl || "").toLowerCase();

      const isDanfoss =
        name.includes("danfoss") ||
        code.includes("danfoss") ||
        seoUrl.includes("danfoss") ||
        code === "dan";

      setShowDanfossFields(isDanfoss);

      // ✅ ADD THIS BLOCK 👇
      if (isDanfoss) {
        setFormData((prev) => ({
          ...prev,
          pickupCity: "Chennai",
        }));
      }

    } catch (e) {
      setShowDanfossFields(false);
    }
  };

  checkCompany();
}, [companyId]);
  useEffect(() => {
    fetchVehicleSchedule();
  }, []);
useEffect(() => {
  if (userId) {
    fetchManagerByUserId(userId);
  }
}, [userId]);
useEffect(() => {
  if (!companyId) return;

  const checkCompany = async () => {
    try {
      const res = await axiosInstance.get(`/company/getCompanyById/${companyId}`);
      const company = res?.data?.data || res?.data?.company || res?.data;

      const name = String(company?.companyName || "").toLowerCase();
      const code = String(company?.companyCode || "").toLowerCase();
      const seoUrl = String(company?.seoUrl || "").toLowerCase();

      // ✅ Danfoss only
      const isDanfoss =
        name.includes("danfoss") ||
        code.includes("danfoss") ||
        seoUrl.includes("danfoss") ||
        code === "dan"; // if you use short code

      setShowDanfossFields(isDanfoss);

      // ✅ managerApproval flag (true/1)
      const managerApproval =
        company?.managerApproval === true || company?.managerApproval === 1;

      // ✅ FINAL CONDITION: Danfoss + managerApproval
      const shouldShow = isDanfoss && managerApproval;
      setRequireManagerApproval(shouldShow);

      // reset when not required
      if (!shouldShow) {
        setCostCenter("");
        setManagerUserId("");
        setManagers([]);
        setManagerSearch("");
        setShowManagerDropdown(false);
      }
    } catch (e) {
      setShowDanfossFields(false);
      setRequireManagerApproval(false);
      setCostCenter("");
      setManagerUserId("");
      setManagers([]);
      setManagerSearch("");
      setShowManagerDropdown(false);
    }
  };

  checkCompany();
}, [companyId]);


useEffect(() => {
  if (!companyId || !requireManagerApproval) return;

  const fetchManagers = async () => {
    setLoadingManagers(true);
    try {
      const res = await axiosInstance.get(`/user/company/${companyId}/managers`);
      setManagers(res.data?.data || []);
    } catch (e) {
      setManagers([]);
      showToast("Failed to load managers", "error");
    } finally {
      setLoadingManagers(false);
    }
  };

  fetchManagers();
}, [companyId, requireManagerApproval]);

  const prefillFormWithBookingData = () => {
    if (isCopyMode && copiedBookingData?.booking) {
      const booking = copiedBookingData.booking;
      
      let bookingDateTime = null;
      if (booking.bookingDate) {
        bookingDateTime = new Date(booking.bookingDate);
        setPickupDate(bookingDateTime);
      }

      let bookingForValue = "Self";
      let behalfOfPersonValue = "";
      
      if (booking.userId !== userId) {
        bookingForValue = "On behalf of";
        behalfOfPersonValue = booking.userId;
      }

      let areaTypeValue = "pickupArea";
      if (booking.pickupPoint === "Outstation" && booking.predefinedArea) {
        areaTypeValue = "predefinedArea";
      }

      let trainNumberValue = "";
      if (booking.flightNo) {
        trainNumberValue = booking.flightNo;
      } else if (booking.trainNo) {
        trainNumberValue = booking.trainNo;
      }

      const newFormData = {
        pickupDate: bookingDateTime ? bookingDateTime.toISOString() : "",
        bookingFor: bookingForValue,
        behalfOfPerson: behalfOfPersonValue,
        behalfOfPhone: booking.behalfOfPhone || "",
        pickupPoint: booking.pickupPoint || "",
        pickupCity: booking.pickupCity || "",
        pickupStation: booking.pickupStation || "",
        pickupAirport: booking.pickupAirport || "",
        trainNumber: trainNumberValue,
        areaType: areaTypeValue,
        area: booking.predefinedArea || booking.pickupArea || "",
        dropArea: booking.dropPoint || "",
        carType: booking.preferredType || copiedBookingData.vehicleType?.vehicleType || "",
      };

      setFormData(newFormData);

      if (booking.vehicleId) {
        setSelectedVehicleId(booking.vehicleId);
      }

      

      validateForm(newFormData);

      showToast("Booking data copied successfully! You can modify the details as needed.", "success");
    }
  };

  useEffect(() => {
  validateForm(formData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [costCenter, managerUserId, requireManagerApproval, pickupDate]);

  useEffect(() => {
    if (isCopyMode && copiedBookingData && carTypes.length > 0 && pickupCities.length > 0) {
      prefillFormWithBookingData();
    }
  }, [isCopyMode, copiedBookingData, carTypes, pickupCities]);

  useEffect(() => {
    if (formData.carType) {
      const selectedCarType = carTypes.find(
        (car) => car.vehicleType === formData.carType
      );
      if (selectedCarType) {
        fetchVehiclesByCarType(selectedCarType.vehicleTypeId);
      }
    }
  }, [formData.carType, carTypes]);

  useEffect(() => {
    if (formData.pickupPoint && companyId) {
      let type = "";
      if (formData.pickupPoint === "Local city use" || formData.pickupPoint === "Airport" || formData.pickupPoint === "Railway station") {
        type = "Airport, Railway Station and Local City Use";
      } else if (formData.pickupPoint === "Outstation") {
        type = "Out Station";
      }

      if (type) {
        fetchPackages(type);
      }
    }
  }, [formData.pickupPoint, companyId]);

  const fetchVehiclesByCarType = async (vehicleTypeId: string) => {
    setLoadingVehicles(true);
    try {
      const res = await axiosInstance.get<VehiclesResponse>(
        `/vehicle/${vehicleTypeId}/getVehiclesByVehicleTypeForWeb`
      );

      if (res.data && Array.isArray(res.data.vehicles)) {
        const normalizedVehicles = res.data.vehicles.map((v) => {
          let images: string[] = [];

          if (Array.isArray(v.vehicleImg)) {
            images = v.vehicleImg;
          } else if (typeof v.vehicleImg === "string") {
            try {
              const parsed = JSON.parse(v.vehicleImg);
              images = Array.isArray(parsed) ? parsed : [v.vehicleImg];
            } catch {
              images = [v.vehicleImg];
            }
          }

          return { ...v, vehicleImg: images };
        });

        setVehicles(normalizedVehicles);
        
        if (formData.pickupPoint && companyId) {
          await fetchPackageDetails(vehicleTypeId, formData.pickupPoint, companyId);
        }
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error("Error fetching vehicles by type:", err);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchPackageDetails = async (vehicleTypeId: string, pickupPoint: string, companyId: string) => {
    setLoadingPackageDetails(true);
    try {
      let mappedPickupPoint = pickupPoint;
      if (pickupPoint === "Local city use") {
        mappedPickupPoint = "local";
      } else if (pickupPoint === "Outstation") {
        mappedPickupPoint = "outstation";
      }

      const res = await axiosInstance.get<PackageDetailsResponse>(
        `/vehicle/getPackagesByVehicleType`,
        {
          params: {
            vehicleTypeId,
            pickupPoint: mappedPickupPoint,
            companyId
          }
        }
      );

      setPackageDetails(res.data);
    } catch (err) {
      console.error("Error fetching package details:", err);
      setPackageDetails(null);
    } finally {
      setLoadingPackageDetails(false);
    }
  };

  useEffect(() => {
    if (formData.carType) {
      const selectedCarType = carTypes.find(
        (car) => car.vehicleType === formData.carType
      );
      if (selectedCarType && formData.pickupPoint && companyId) {
        fetchVehiclesByCarType(selectedCarType.vehicleTypeId);
      }
    }
  }, [formData.carType, formData.pickupPoint, carTypes, companyId]);

  useEffect(() => {
    const fetchPickupCities = async () => {
      setLoadingCities(true);
      try {
        const res = await axiosInstance.get<{ data: City[] }>(
          "/city/listCity?status=0"
        );
        if (Array.isArray(res.data.data)) {
          setPickupCities(res.data.data);
        } else {
          setPickupCities([]);
        }
      } catch (err) {
        console.error("Error fetching pickup cities:", err);
        setPickupCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchPickupCities();
  }, []);

  useEffect(() => {
    const fetchCarTypes = async () => {
      setLoadingCars(true);
      try {
        const res = await axiosInstance.get<{ data: VehicleType[] }>(
          "/vehicleType/getAllVehicleType"
        );
        if (Array.isArray(res.data.data)) {
          setCarTypes(res.data.data);
        } else {
          setCarTypes([]);
        }
      } catch (err) {
        console.error("Error fetching vehicle types:", err);
        setCarTypes([]);
      } finally {
        setLoadingCars(false);
      }
    };
    fetchCarTypes();
  }, []);

  useEffect(() => {
    if (!companyId) return;
    const fetchCompanyUsers = async () => {
      try {
        const res = await axiosInstance.get<CompanyUsersResponse>(
          `/user/getAllUserByCompany/${companyId}`
        );

        setBehalfOfUsers(res.data.data || []);
      } catch (err) {
        console.error("Error fetching company users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyUsers();
  }, [companyId]);

 const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  let finalValue = value;

  if (name === "behalfOfPhone") {
    finalValue = value.replace(/\D/g, "").slice(0, 10);
  }

  let updatedForm = { ...formData, [name]: finalValue };

  if (name === "carType") {
    const selectedCarType = carTypes.find((car) => car.vehicleType === finalValue);
    if (selectedCarType) {
      fetchVehiclesByCarType(selectedCarType.vehicleTypeId);
    } else {
      setVehicles([]);
    }
  }

  if (name === "pickupPoint") {
    let type = "";
    if (finalValue === "Local city use" || finalValue === "Airport" || finalValue === "Railway station") {
      type = "Local City Use";
    } else if (finalValue === "Outstation") {
      type = "Out Station";
    }

    if (type) {
      fetchPackages(type);
    }

    updatedForm = {
      ...updatedForm,
      area: "",
      dropArea: "",
      pickupAirport: "",
      pickupStation: "",
      trainNumber: "",
    };
  }

 if (name === "bookingFor" && finalValue === "Self") {
  updatedForm = {
    ...updatedForm,
    behalfOfPerson: "",
    behalfOfPhone: "",
  };

  setBehalfSearch(""); // clear search box

  if (userId) {
    fetchManagerByUserId(userId); // 🔥 reload SELF manager
  }
}

  setFormData(updatedForm);
  validateForm(updatedForm);
};

  const fetchPackages = async (type: string) => {
    setLoadingPackages(true);
    try {
      const res = await axiosInstance.get<PackageDataResponse>(
        "/packageData/getAllPackageData",
        { params: { companyId: companyId, packageType: type } }
      );
      if (Array.isArray(res.data.data)) {
        setPackages(res.data.data);
      } else {
        setPackages([]);
      }
    } catch (err) {
      console.error("Error fetching packages:", err);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

const validateForm = (data: BookingForm, dateOverride?: Date | null) => {
  const dateToCheck = dateOverride ?? pickupDate;

  let requiredFields: string[] = ["pickupPoint", "pickupCity", "carType"];

  if (data.pickupPoint === "Airport")
    requiredFields.push("pickupAirport", "trainNumber");
  else if (data.pickupPoint === "Railway station")
    requiredFields.push("pickupStation", "trainNumber");
  else if (data.pickupPoint === "Local city use") {
    requiredFields.push("area", "dropArea");
  } else if (data.pickupPoint === "Outstation") {
    requiredFields.push("area");
  }

  if (data.bookingFor === "On behalf of") {
    requiredFields.push("behalfOfPerson");
  }

  requiredFields.push("area");

  const allFilled = requiredFields.every(
    (field) => (data[field as keyof BookingForm] || "").toString().trim() !== ""
  );

const validBehalfPhone =
  data.bookingFor !== "On behalf of" ||
  !data.behalfOfPhone ||
  /^[0-9]{10}$/.test((data.behalfOfPhone || "").trim());

  setIsFormComplete(!!dateToCheck && allFilled && validBehalfPhone);
};

// const isValidDanfossEmail = (email: string) => {
//   return email.toLowerCase().endsWith("@danfoss.com");
// };
const isValidManagerEmail = (email: string) => {
  //const regex = /^[a-zA-Z0-9._%+-]+@danfoss\.com$/i;
//    const regex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|gracecabs\.com|danfoss\.com)$/i;
  const regex = /^[a-zA-Z0-9._%+-]+@(danfoss\.com)$/i;
  return regex.test(email.trim());
};
  const handleBooking = async () => {
    try {
      if (isBooking) return;
      setIsBooking(true);
   // ✅ HERE (paste this createdBy block)
    const backupKey = "auth_backup_user_context";
    const backupStr = localStorage.getItem(backupKey);

    // default: current localStorage userId
    let createdBy = localStorage.getItem("userId") || "";

    try {
      if (backupStr) {
        const backup = JSON.parse(backupStr);
        createdBy = backup?.userId || createdBy; // original login userId
      }
    } catch {}



    // ✅ now use createdBy in payload
    if (!pickupDate) {
      showToast("Please select a pickup date and time.", "error");
      setIsBooking(false);
      return;
    }

      if (!pickupDate) {
        showToast("Please select a pickup date and time.", "error");
        return;
      }
if (requireManagerApproval) {
  if (!costCenter.trim()) {
    showToast("Cost Center is required", "error");
    setIsBooking(false);
    return;
  }
  if (!managerEmail) {
    showToast("Manager email is required", "error");
    setIsBooking(false);
    return;
  }

  // if (!managerEmail.toLowerCase().endsWith("@danfoss.com")) {
  //   showToast("Only Danfoss email (name@danfoss.com) is allowed", "error");
  //   setIsBooking(false);
  //   return;
  // }

//   if (!managerEmail.toLowerCase().endsWith("@gmail.com")) {
//   showToast("Only Gmail (name@gmail.com) is allowed", "error");
//   setIsBooking(false);
//   return;
// }
if (!isValidManagerEmail(managerEmail)) {
  showToast("Enter valid mail (eg: name@danfoss.com)", "error");
  setIsBooking(false);
  return;
}

if (formData.bookingFor === "On behalf of") {
  if (!formData.behalfOfPerson.trim()) {
    showToast("Please enter booking on behalf person name.", "error");
    setIsBooking(false);
    return;
  }

  // if (!/^[0-9]{10}$/.test(formData.behalfOfPhone.trim())) {
  //   showToast("Please enter valid on behalf phone number.", "error");
  //   setIsBooking(false);
  //   return;
  // }

  if (formData.behalfOfPhone && !/^[0-9]{10}$/.test(formData.behalfOfPhone.trim())) {
  showToast("Phone number must be 10 digits.", "error");
  setIsBooking(false);
  return;
}
}

}
//   if (!managerEmail.toLowerCase().endsWith("@gmail.com")) {
//   showToast("Only Gmail (name@gmail.com) is allowed", "error");
//   setIsBooking(false);
//   return;
// }

      const istOffsetMinutes = 330;
      const istOffsetHours = Math.floor(istOffsetMinutes / 60);
      const istOffsetRemainingMinutes = istOffsetMinutes % 60;
      const sign = istOffsetHours >= 0 ? "+" : "-";
      const formattedOffset = `${sign}${Math.abs(istOffsetHours)
        .toString()
        .padStart(2, "0")}:${istOffsetRemainingMinutes
          .toString()
          .padStart(2, "0")}`;

      const dateInIST = new Date(
        pickupDate.getFullYear(),
        pickupDate.getMonth(),
        pickupDate.getDate(),
        pickupDate.getHours(),
        pickupDate.getMinutes(),
        pickupDate.getSeconds()
      );

      const year = dateInIST.getFullYear();
      const month = (dateInIST.getMonth() + 1).toString().padStart(2, "0");
      const day = dateInIST.getDate().toString().padStart(2, "0");
      const hours = dateInIST.getHours().toString().padStart(2, "0");
      const minutes = dateInIST.getMinutes().toString().padStart(2, "0");
      const seconds = dateInIST.getSeconds().toString().padStart(2, "0");

      const bookingDateWithTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formattedOffset}`;

       const bookingForUserId = userId; // booking always belongs to main user

const behalfOfName =
  formData.bookingFor === "On behalf of"
    ? formData.behalfOfPerson
    : null;
    const behalfOfPhone =
  formData.bookingFor === "On behalf of"
    ? formData.behalfOfPhone.trim()
    : null;
   const selectedCar = carTypes.find((car) => car.vehicleType === formData.carType);
const vehicleTypeId = selectedCar?.vehicleTypeId || "";

if (!vehicleTypeId) {
  showToast("Please select a valid car type.", "error");
  setIsBooking(false);
  return;
}

      let pickupArea = "";
      let predefinedArea = "";
      let pickupAirport = "";
      let pickupStation = "";

      if (formData.pickupPoint === "Outstation" || formData.pickupPoint === "Local city use") {
        pickupArea = formData.area;
      } else if (formData.pickupPoint === "Airport") {
        pickupAirport = formData.pickupAirport;
      } else if (formData.pickupPoint === "Railway station") {
        pickupStation = formData.pickupStation;
      }
   const finalNotes = notes.startsWith("__other__")
  ? notes.replace("__other__", "").trim()
  : notes.trim();   
const payload: any = {
  bookingDate: bookingDateWithTime,
  pickupPoint: formData.pickupPoint,
  pickupCity: formData.pickupCity,
  pickupArea,
  predefinedArea,
  dropPoint: formData.dropArea?.trim() || null,
  pickupLongitude: "",
  pickupLatitude: "",
  dropLatitude: "",
  dropLongitude: "",
  travellersCount: 1,
  femaleCount: 0,
  maleCount: 1,
  pickupAirport: formData.pickupPoint === "Airport" ? formData.pickupAirport : null,
  pickupStation: formData.pickupPoint === "Railway station" ? formData.pickupStation : null,
  flightNo: formData.pickupPoint === "Airport" ? formData.trainNumber : null,
  trainNo: formData.pickupPoint === "Railway station" ? formData.trainNumber : null,
  remarks: "",
  purpose: "",
  confirmStatus: "Pending",
  bookingStatus: "Pending",
  preferredType: formData.carType,
  roundTrip: "No",
    notes: finalNotes || null,
  userId: bookingForUserId,
  bookingCreatedBy: createdBy,
  behalfOfName,
    behalfOfPhone,

  vehicleId: selectedVehicleId || null,
  vehicleTypeId,
    // ✅ DANFOSS FIELDS
costCenter: requireManagerApproval ? costCenter.trim() : null,
// managerUserId: requireManagerApproval ? managerUserId : null,
managerEmail: managerEmail ? managerEmail.trim() : null,
};

// if (requireManagerApproval) {
//   payload.costCenter = costCenter.trim();
//   payload.managerUserId = managerUserId;
// }
      const res = await axiosInstance.post<BookingResponse>(
        `emp/createBookingForWeb`,
        payload
      );

     if (res.data.success) {
  const successMessage = isCopyMode
    ? "New booking created successfully from copied data!"
    : "Booking created successfully!";
  showToast(successMessage, "success");

  // ✅ ROLE CHECK + REDIRECT (superadmin only)
  const backupKey = "auth_backup_user_context";
  const backupStr = localStorage.getItem(backupKey);

  // default role from current session
  let role = (localStorage.getItem("role") || localStorage.getItem("userRole") || "").toLowerCase();

  // if backup exists, take original login role (impersonation case)
  try {
    if (backupStr) {
      const backup = JSON.parse(backupStr);
      role = String(backup?.role || backup?.userRole || role).toLowerCase();
    }
  } catch {}

  if (role === "superadmin") {
    setIsBooking(false);
    navigate("/orders/confirmpending", { replace: true });
    return; // ✅ stop reset (because page is changing)
  }

  // ✅ normal flow (non-superadmin)
  setIsBooking(false);

  setFormData({
    pickupDate: "",
    bookingFor: "Self",
    behalfOfPerson: "",
    behalfOfPhone: "",
    pickupPoint: "",
    pickupCity: "",
    pickupStation: "",
    pickupAirport: "",
    trainNumber: "",
    areaType: "pickupArea",
    area: "",
    dropArea: "",
    carType: "",
  });
  setPickupDate(null);
  setSelectedVehicleId("");
  setVehicles([]);
  setPackages([]);
  setIsFormComplete(false);
} else {
        showToast(res.data.message || "Booking failed.", "error");
        setIsBooking(false);
      }
    } catch (error) {
      console.error("Booking error:", error);
      showToast("Something went wrong while creating the booking.", "error");
      setIsBooking(false);
    }
  };

  const BASE_URL = config.baseurl.apibaseurl;

  return (
    <>
      <TravelHeader />
      <div className="bg-gray-100 min-h-screen flex flex-col items-center">
        {isCopyMode && (
          <div className="w-full max-w-6xl mt-4 p-3 bg-blue-100 border border-blue-300 rounded">
            <p className="text-blue-800">
              📋 <strong>Copy Mode:</strong> Booking data has been pre-filled from the selected order. 
              You can modify any details and create a new booking.
            </p>
          </div>
        )}

        <div className="max-w-6xl w-full p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6  items-start">
          {/* Booking Details */}
        <div className="bg-white border border-[#275981] rounded shadow-sm self-start h-fit">
            <div className="bg-[#275981] text-white px-4 py-2 font-semibold">
              {isCopyMode ? "Copy Booking Details" : "Booking Details"}
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Pickup Date<span className=" ml-1 text-red-500">*</span></label>
          
<DatePicker
  ref={datePickerRef}
  selected={pickupDate}
  shouldCloseOnSelect={false}

onCalendarOpen={() => {
  setTimeout(() => {
    const selected = pickupDate || new Date();
    const today = new Date();

    const isToday =
      selected.getDate() === today.getDate() &&
      selected.getMonth() === today.getMonth() &&
      selected.getFullYear() === today.getFullYear();

    let target;

    if (showDanfossFields) {
      if (isToday) {
        target = document.querySelector(
          ".react-datepicker__time-list-item:not(.react-datepicker__time-list-item--disabled)"
        );
      } else {
        target = Array.from(
          document.querySelectorAll(".react-datepicker__time-list-item")
        ).find((el) => el.textContent?.trim() === "00:00");
      }
    } else {
      const currentSlot = getCurrentTimeSlot();

      target = Array.from(
        document.querySelectorAll(".react-datepicker__time-list-item")
      ).find((el) => el.textContent?.trim() === currentSlot);
    }

    if (target) {
      target.scrollIntoView({ block: "center" });
    }
  }, 300);
}}

onChange={(date) => {
  if (!date) {
    setPickupDate(null);
    const updated = { ...formData, pickupDate: "" };
    setFormData(updated);
    validateForm(updated, null);
    return;
  }

  const today = new Date();

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const minT = getMinSelectableTime(date);
  const fixedDate = minT && date < minT ? minT : date;

  setPickupDate(fixedDate);

  // 🔥 scroll logic when date changes
setTimeout(() => {
  let target;

  if (showDanfossFields) {
    if (isToday) {
      target = document.querySelector(
        ".react-datepicker__time-list-item:not(.react-datepicker__time-list-item--disabled)"
      );
    } else {
      target = Array.from(
        document.querySelectorAll(".react-datepicker__time-list-item")
      ).find((el) => el.textContent?.trim() === "00:00");
    }
  } else {
    const currentSlot = getCurrentTimeSlot();

    target = Array.from(
      document.querySelectorAll(".react-datepicker__time-list-item")
    ).find((el) => el.textContent?.trim() === currentSlot);
  }

  if (target) {
    target.scrollIntoView({ block: "center" });
  }
}, 300);

  const updated = { ...formData, pickupDate: fixedDate.toISOString() };
  setFormData(updated);
  validateForm(updated, fixedDate);
}}

  showTimeSelect
  timeFormat="HH:mm"
  timeIntervals={showDanfossFields ? 1 : 15}
  dateFormat="dd/MM/yyyy HH:mm"
  timeCaption="Time"
  className="border rounded w-full px-2 py-1"
  placeholderText="Select Date & Time"
  minTime={getMinSelectableTime(pickupDate || new Date())}
  maxTime={getMaxSelectableTime(pickupDate || new Date())}
/>
              </div>

              <div>
                <label className="block text-sm font-medium">Booking For</label>
                <div className="flex gap-4 mt-1">
                  <label>
                    <input
                      type="radio"
                      name="bookingFor"
                      value="Self"
                      checked={formData.bookingFor === "Self"}
                      onChange={handleChange}
                    />{" "}
                    Self
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="bookingFor"
                      value="On behalf of"
                      checked={formData.bookingFor === "On behalf of"}
                      onChange={handleChange}
                    />{" "}
                    On behalf of
                  </label>
                </div>

{formData.bookingFor === "On behalf of" && (
  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
 <div ref={behalfBoxRef} className="relative">
  <label className="block text-sm font-medium">
    Booking On Behalf Of<span className="ml-1 text-red-500">*</span>
  </label>

  <input
    type="text"
    className="border rounded w-full px-2 py-1"
    placeholder="Search user..."
    value={behalfSearch}
    onFocus={() => setShowBehalfDropdown(true)}
    onChange={(e) => {
      setBehalfSearch(e.target.value);
      setShowBehalfDropdown(true);

      setFormData({
        ...formData,
        behalfOfPerson: e.target.value,
      });
    }}
  />

  {showBehalfDropdown && (
    <div className="absolute z-20 bg-white border w-full max-h-40 overflow-y-auto shadow">
      {filteredBehalfUsers.length > 0 ? (
        filteredBehalfUsers.map((user) => (
      <div
  key={user.userId}
  className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
  onClick={() => {
    setBehalfSearch(`${user.username} (${user.danfossuserId})`);

    setFormData({
      ...formData,
      behalfOfPerson: user.username,
      behalfOfPhone: user.mobile || "", 
    });

    fetchManagerByUserId(user.userId);
    setShowBehalfDropdown(false);
  }}
>
  <div className="text-sm font-medium">
    {user.username} ({user.danfossuserId})
  </div>
  {user.email && (
    <div className="text-xs text-gray-500">
      {user.email}
    </div>
  )}
</div>
        ))
      ) : (
        <div className="px-3 py-2 text-gray-500 text-sm">
          No users found
        </div>
      )}
    </div>
  )}
</div>

    <div>
      <label className="block text-sm font-medium">
        Guest Phone Number
      </label>
      <input
        type="text"
        name="behalfOfPhone"
        className="border rounded w-full px-2 py-1"
        placeholder="Enter phone number"
        value={formData.behalfOfPhone}
        onChange={handleChange}
        maxLength={10}
      />
   {formData.behalfOfPhone && !/^[0-9]{10}$/.test(formData.behalfOfPhone) && (
  <p className="text-red-500 text-xs mt-1">
    Phone number must be 10 digits (optional)
  </p>
)}
    </div>
  </div>
)}
              </div>

<div>
  <label className="block text-sm font-medium">
    Notes (Optional)
  </label>

  <select
    className="border rounded w-full px-2 py-1"
    value={notes.startsWith("__other__") ? "Others" : notes}
    onChange={(e) => {
      if (e.target.value === "Others") {
        setNotes("__other__"); // marker to show textbox
      } else {
        setNotes(e.target.value);
      }
    }}
  >
    <option value="">Select Notes</option>
    <option value="Client Visit">Client Visit</option>
    <option value="Team Outing">Team Outing</option>
    <option value="Official Work">Official Work</option>
    <option value="Sales / Marketing">Sales / Marketing</option>
    <option value="Personal">Personal</option>
    <option value="Others">Others</option>
  </select>

  {/* Show text box only when "Others" is selected */}
  {notes === "__other__" || notes.startsWith("__other__") ? (
    <input
      type="text"
      className="border rounded w-full px-2 py-1 mt-2"
      placeholder="Please specify..."
      value={notes.replace("__other__", "")}
      onChange={(e) => setNotes("__other__" + e.target.value)}
    />
  ) : null}
</div>
              {requireManagerApproval && (
  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">

       {/* Manager Dropdown */}
   <div ref={managerBoxRef} className="relative">
  <label className="block text-sm font-medium mb-1">Approver Manager<span className=" ml-1 text-red-500">*</span></label>

 
  <input
    type="email"
    className="border rounded w-full px-2 py-1"
    placeholder="Enter Manager Email"
    value={managerEmail}
 
onChange={(e) => {
  setManagerEmail(e.target.value);
}}
/>

</div>

    {/* Cost Center */}
    <div>
      <label className="block text-sm font-medium mb-1">Cost Center<span className=" ml-1 text-red-500">*</span></label>
      <input
        type="text"
        className="border rounded w-full px-2 py-1"
        placeholder="Enter cost center"
        value={costCenter}
        onChange={(e) => setCostCenter(e.target.value)}
      />
    </div>

 

  </div>
)}


              <div>
                <label className="block text-sm font-medium">Travel Package<span className=" ml-1 text-red-500">*</span></label>
                <select
                  name="pickupPoint"
                  className="border rounded w-full px-2 py-1"
                  value={formData.pickupPoint}
                  onChange={handleChange}
                >
                  <option value="">Select Pickup Point</option>
                  {pickupPoints.map((point) => (
                    <option key={point} value={point}>
                      {point}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Pickup City<span className=" ml-1 text-red-500">*</span></label>
                <select
                  name="pickupCity"
                  className="border rounded w-full px-2 py-1"
                  value={formData.pickupCity}
                  onChange={handleChange}
                >
                  <option value="">Select City</option>
                  {loadingCities ? (
                    <option disabled>Loading...</option>
                  ) : pickupCities.length > 0 ? (
                    pickupCities.map((city) => (
                      <option key={city.cityId} value={city.pickupCity}>
                        {city.pickupCity}
                      </option>
                    ))
                  ) : (
                    <option disabled>No cities found</option>
                  )}
                </select>
              </div>

              {formData.pickupPoint === "Local city use" && (
                <>
                  <div>
                   <label className="block text-sm font-medium">
                    Pickup Point<span className="ml-1 text-red-500">*</span>
                  </label>
                    <textarea
                      name="area"
                      className="border rounded w-full px-2 py-1"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder="Enter pickup area with landmark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
  Drop Point<span className="ml-1 text-red-500">*</span>
</label>
                    <textarea
                      name="dropArea"
                      className="border rounded w-full px-2 py-1"
                      value={formData.dropArea}
                      onChange={handleChange}
                      placeholder="Enter drop area with landmark"
                    />
                  </div>
                </>
              )}

              {formData.pickupPoint === "Outstation" && (
                <>
                  <div>
                   <label className="block text-sm font-medium">
                    Area<span className="ml-1 text-red-500">*</span>
                  </label>
                    <textarea
                      name="area"
                      className="border rounded w-full px-2 py-1 mt-2"
                      placeholder="Please enter pick up area with landmark"
                      value={formData.area}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium">
                      Destination City
                    </label>
                    <select
                      name="dropArea"
                      className="border rounded w-full px-2 py-1"
                      value={formData.dropArea}
                      onChange={handleChange}
                    >
                      <option value="">Select Destination City</option>
                      {loadingCities ? (
                        <option disabled>Loading...</option>
                      ) : pickupCities.length > 0 ? (
                        pickupCities.map((city) => (
                          <option key={city.cityId} value={city.pickupCity}>
                            {city.pickupCity}
                          </option>
                        ))
                      ) : (
                        <option disabled>No cities found</option>
                      )}
                    </select>
                  </div>
                </>
              )}
              
              {(formData.pickupPoint === "Airport") && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Airport</label>
                    <input
                      type="text"
                      name="pickupAirport"
                      className="border rounded w-full px-2 py-1"
                      value={formData.pickupAirport}
                      onChange={handleChange}
                      placeholder="Enter Airport Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Flight Number</label>
                    <input
                      type="text"
                      name="trainNumber"
                      className="border rounded w-full px-2 py-1"
                      value={formData.trainNumber}
                      onChange={handleChange}
                      placeholder="Enter Flight Number"
                    />
                  </div>
                </>
              )}

              {(formData.pickupPoint === "Railway station") && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Railway Station</label>
                    <input
                      type="text"
                      name="pickupStation"
                      className="border rounded w-full px-2 py-1"
                      value={formData.pickupStation}
                      onChange={handleChange}
                      placeholder="Enter Railway Station Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Train Number</label>
                    <input
                      type="text"
                      name="trainNumber"
                      className="border rounded w-full px-2 py-1"
                      value={formData.trainNumber}
                      onChange={handleChange}
                      placeholder="Enter Train Number"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium">Car Type<span className=" ml-1 text-red-500">*</span></label>
                <select
                  name="carType"
                  className="border rounded w-full px-2 py-1"
                  value={formData.carType}
                  onChange={handleChange}
                >
                  <option value="">Select Car Type</option>
                  {loadingCars ? (
                    <option disabled>Loading...</option>
                  ) : carTypes.length > 0 ? (
                    carTypes.map((car) => (
                      <option key={car.vehicleTypeId} value={car.vehicleType}>
                        {car.vehicleType}
                      </option>
                    ))
                  ) : (
                    <option disabled>No cars found</option>
                  )}
                </select>
              </div>
            </div>
               {/* Submit Button */}
          <div className="p-4">
            <button
              className={`px-4 py-2 rounded text-white ${
                isFormComplete && !isBooking
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-[#275981] cursor-not-allowed"
              }`}
              onClick={handleBooking}
              disabled={!isFormComplete || isBooking}
            >
              {isBooking
                ? "Booking..."
                : isCopyMode
                ? "Create New Booking"
                : "Book a cab"}
            </button>
          </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Vehicle Details */}
            <div className="bg-white border border-[#275981] rounded shadow-sm">
              <div className="bg-[#275981] text-white px-4 py-2 font-semibold">
                Vehicle Details
              </div>
              <div className="p-4 space-y-4">
                {loadingVehicles ? (
                  <p>Loading vehicle details...</p>
                ) : vehicles.length > 0 ? (
                  <>
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.vehicleId}
                        className="flex items-center gap-4 border-b pb-4 last:border-b-0 cursor-pointer p-2 rounded"
                        onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
                        style={{
                          border:
                            selectedVehicleId === vehicle.vehicleId
                              ? "2px solid #f97316"
                              : "1px solid #e5e7eb",
                        }}
                      >
                        <div className="flex flex-wrap gap-2 mt-2">
                          {vehicle.vehicleImg.length > 0 && (
                            <img
                              src={`${BASE_URL}/uploads/vehicleImg/${vehicle.vehicleImg[0]}`}
                              alt={vehicle.vehicleName}
                              className="rounded shadow w-[150px] h-[100px] object-cover"
                            />
                          )}
                        </div>

                        <div>
                          <span className="font-semibold block">
                            {vehicle.vehicleName}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Package Details Section - Same as CreateInvoice */}
                    {loadingPackageDetails ? (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Loading package details...</p>
                      </div>
                  ) : (
  (() => {
    const hasVisible =
      formData.pickupPoint === "Outstation"
        ? visibleOutstationPackages.length > 0
        : visibleLocalPackages.length > 0;

    if (!hasVisible) return null;

    return (
      <div className="mt-4 border-t pt-4">
        <h3 className="font-semibold text-md mb-3">Available Packages</h3>

        {formData.pickupPoint === "Outstation" ? (
          visibleOutstationPackages.map((p) => (
            <div key={p.packageDataId} className="mb-3 p-3 bg-gray-50 rounded border">
              <div className="text-sm font-semibold text-[#275981] mb-2">
                {p.packageType}
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="text-sm text-blue-600 font-medium">
                  Per KM: ₹{toNum(p.outstation?.perKm)}
                </div>

                <div className="text-sm text-purple-600 font-medium">
                  Driver Batta / Day: ₹{toNum(p.outstation?.driverBattaPerDay)}
                </div>

                <div className="text-sm text-green-700 font-medium">
                  Minimum KM / Day: {toNum(p.outstation?.minimumKmPerDay)} km
                </div>
              </div>
            </div>
          ))
        ) : (
          visibleLocalPackages.map((p: any) => (
            <div key={p.packageDataId} className="mb-4 p-3 bg-gray-50 rounded border">
              <div className="text-sm font-semibold text-[#275981] mb-3">
                {p.packageType}
              </div>

              <div className="space-y-2">
                {p.__validRows.map((d: any) => (
                  <div
                    key={d.packageId}
                    className="flex items-center justify-between bg-white border rounded px-3 py-2"
                  >
                    <div className="text-sm font-medium">
                      {d.title} ({d.hours} hrs / {d.km} km)
                    </div>
                    <div className="text-sm font-bold text-green-700">₹{toNum(d.amount)}</div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="text-sm text-gray-700">
                    Extra KM: ₹{toNum(p.localCity?.extraKm)}
                  </div>
                  <div className="text-sm text-gray-700">
                    Extra Hour: ₹{toNum(p.localCity?.extraHour)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  })()
)}
                  </>
                ) : (
                  <p>No vehicles found for this type.</p>
                )}
              </div>
            </div>

            {/* Booking Schedule */}
            <div className="bg-white border border-[#275981] rounded shadow-sm">
              <div
                className="bg-[#275981] text-white px-4 py-2 font-semibold flex justify-between items-center cursor-pointer"
                onClick={() => setIsScheduleOpen(!isScheduleOpen)}
              >
                Booking Schedule
                <span>{isScheduleOpen ? "▲" : "▼"}</span>
              </div>

              {isScheduleOpen && (
                <div className="p-0">
                  <div className="max-h-[260px] overflow-y-auto">
                    <table className="w-full text-sm border border-collapse">
                      <thead className="sticky top-0 bg-gray-200 z-10">
                        <tr>
                          <th className="border px-3 py-2 text-left">
                            Vehicle Type
                          </th>
                          <th className="border px-3 py-2 text-center">
                            Advance Booking Hours
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {loadingSchedule ? (
                          <tr>
                            <td colSpan={2} className="text-center py-4">
                              Loading schedule...
                            </td>
                          </tr>
                        ) : vehicleSchedules.length > 0 ? (
                          vehicleSchedules.map((item) => (
                            <tr key={item.vehicleTypeId} className="hover:bg-gray-50">
                              <td className="border px-3 py-2">
                                {item.vehicleType}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {item.priorMinutes}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="text-center py-4 text-gray-500">
                              No schedule found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

       
        </div>
      </div>
      <Footer />
      <AlertContainer/>
    </>
  );
};

export default UserInvoice;
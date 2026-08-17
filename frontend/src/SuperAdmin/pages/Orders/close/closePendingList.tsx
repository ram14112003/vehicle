import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import InputBox from "../../../../components/InputBox";
import { showToast, ActionModal } from "../../../../components/AlertBox";
import CommonButton from "../../../../components/CommonButton";
import axios from "axios";
import PageLayout from "../../../../components/PageLayout";
import config from "../../../../config/config"; 

interface CalendarProps {
  show: boolean;
  onClose: () => void;
  fromDate: Date | null;
  toDate: Date | null;
  selectingDateType?: "from" | "to";
  onDateSelect: (date: Date) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  calendarRef: React.RefObject<HTMLDivElement | null>;
}
const Calendar: React.FC<CalendarProps> = ({
  show,
  onClose,
  fromDate,
  toDate,
  onDateSelect,
  currentMonth,
  setCurrentMonth,
  calendarRef,
}) => {
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({ length: 41 }, (_, i) => 2000 + i);
  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelectedFrom = fromDate && date.toDateString() === fromDate.toDateString();
      const isSelectedTo = toDate && date.toDateString() === toDate.toDateString();
      const isInRange = fromDate && toDate && date > fromDate && date < toDate && !isSelectedFrom && !isSelectedTo;
      let classes = "p-2 text-center rounded-full cursor-pointer transition-colors duration-200 text-sm";
      if (isSelectedFrom || isSelectedTo) {
        classes += " bg-blue-600 text-white font-bold ";
      } else if (isInRange) {
        classes += " bg-blue-100 text-blue-800";
      } else if (isToday) {
        classes += " border-2 border-blue-500 bg-blue-50 text-blue-700 font-semibold";
      } else {
        classes += " hover:bg-gray-200";
      }
      days.push(
        <div key={i} className={classes} onClick={() => onDateSelect(date)}>
          {i}
        </div>
      );
    }
    return days;
  };
  const goToPreviousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const selectMonth = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
    setShowMonthDropdown(false);
  };
  const selectYear = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setShowYearDropdown(false);
  };
  if (!show) return null;
  return (
    <div ref={calendarRef} className="absolute z-30 bg-white border border-gray-300 p-4 rounded-lg mt-2 w-[290px] shadow-lg">
      <div className="flex justify-between items-center mb-4 relative">
        <span onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-200 text-gray-700">&#8592;</span>
        <div className="flex flex-col text-center">
          <button onClick={() => setShowMonthDropdown(!showMonthDropdown)} className="font-semibold text-gray-800 hover:text-blue-600">
            {months[currentMonth.getMonth()]}
          </button>
          <button onClick={() => setShowYearDropdown(!showYearDropdown)} className="text-sm text-gray-500 hover:text-blue-600">
            {currentMonth.getFullYear()}
          </button>
        </div>
        <span onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-200 text-gray-700">&#8594;</span>
        {showMonthDropdown && (
          <div className="absolute top-full mt-2 right-4 w-64 bg-white border rounded shadow-md z-40 grid grid-cols-3 gap-2 p-3">
            {months.map((month, index) => (<button key={month} className="text-sm px-2 py-1 rounded hover:bg-blue-100" onClick={() => selectMonth(index)}>{month}</button>))}
          </div>
        )}
        {showYearDropdown && (
          <div className="absolute top-full mt-2 right-1/4 bg-white border rounded shadow-md z-40 max-h-60 overflow-y-auto">
            {years.map((year) => (<button key={year} className="block w-full text-left px-4 py-1 text-sm hover:bg-blue-100" onClick={() => selectYear(year)}>{year}</button>))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs font-bold text-gray-500 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (<div className="text-center" key={d}>{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
      <CommonButton onClick={onClose} variant="danger" className="mt-4 w-full text-sm font-semibold">Close Calendar</CommonButton>
    </div>
  );
};

interface DateAndTimePickerProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error: string | undefined;
}
const DateAndTimePicker: React.FC<DateAndTimePickerProps> = ({ label, name, value, onChange, error }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [currentMonth, setCurrentMonth] = useState<Date>(value ? new Date(value) : new Date());


  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node) && inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarRef, inputRef]);

  const [selectedTime, setSelectedTime] = useState(
    value && value.includes("T") ? value.split("T")[1] : ""
  );

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelectedDate(d);
      const localTime = d.toTimeString().slice(0, 5);
      setSelectedTime(localTime);
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (selectedTime) {
      const [hour, minute] = selectedTime.split(":").map(Number);
      date.setHours(hour, minute, 0, 0);
    }
    const isoDate = date.toISOString();
    onChange(name, isoDate);
    setShowCalendar(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    if (selectedDate) {
      const [hour, minute] = newTime.split(":").map(Number);
      const updatedDate = new Date(selectedDate);
      updatedDate.setHours(hour, minute, 0, 0);
      const isoDate = updatedDate.toISOString();
      onChange(name, isoDate);
    }
  };

  

  const formattedValue = useMemo(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
      return `${dateStr}, ${selectedTime || "Time not set"}`;
    }
    return "";
  }, [selectedDate, selectedTime]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} <span className="text-red-500">*</span></label>
      <div className="flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={formattedValue}
          readOnly
          placeholder="Select Date & Time"
          className="w-full p-2 border rounded-lg bg-gray-50 cursor-pointer"
          onClick={() => setShowCalendar(!showCalendar)}
        />
        <input
          type="time"
          value={selectedTime}
          onChange={handleTimeChange}
          className="p-2 border rounded-lg bg-white"
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      <Calendar
        show={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={handleDateSelect}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        calendarRef={calendarRef}
        fromDate={null}
        toDate={null}
      />
    </div>
  );
};

interface BookingResponse {
  booking: {
    bookingId: string;
    bookingCode: string;
    bookingDate: string;
    pickupPoint: string;
    dropPoint: string;
    companyId:string;
    user: {
      username: string;
      email: string;
      mobile: string;
      companyId: string;
    };
  };
vehicle: {
  vehicleId?: string;
  vehicleName: string;
  vehicleTypeId?: string;
};

  vehicleType: {
    vehicleType: string;
  };
  packages: {
    packageDataId: string;
    packageType: string;
    packages: {
      localPerKm?: number;
      localPerHour?: number;
      outstationPerKm?: number;
      osDriverBata?: number;
      amount?: number | { amt: number; OSDriverBata: number }; 
     [key: string]: any; 
    }[];
  }[];
  paymentMode?: {
    paymentmodeId: string;
    modelname: string;
  };
  tax:{
    taxId : string;
    taxName: string;
    taxPercent:number;
  }[];
}

interface PackageOption {
  optionId: string;           // ✅ unique (packageDataId + packageId)
  label: string;
  hours: number;
  kms: number;
  amount: number;             // local = fixed amount, outstation = perKm rate
  packageDataId: string;
  packageType?: string;

  extraKmRate?: number;       // ✅ from packageData localcity.extraKm
  extraHourRate?: number;     // ✅ from packageData localcity.extraHour

  driverBattaPerDay?: number; // ✅ from packageData outstation.driverBattaPerDay
  minimumKmPerDay?: number;
}


interface ExtraCharge {
  title: string;
  amount: string;
  remarks: string;
}

interface SuggestedPackage {
  hours: number;
  kms: number;
  label: string;
  perKm?: number;
}

const ClosePendingOrderDetails: React.FC = () => {
  const [hideGuest, setHideGuest] = useState(true);
  const { bookingCode } = useParams();
  const navigate = useNavigate();
  const [guestOpeningKm, setGuestOpeningKm] = useState("");
  const [guestClosingKm, setGuestClosingKm] = useState("");
  const [guestOpenDate, setGuestOpenDate] = useState("");
  const [guestCloseDate, setGuestCloseDate] = useState("");
  const [garageOpenKm, setGarageOpenKm] = useState("");
  const [garageCloseKm, setGarageCloseKm] = useState("");
  const [garageOpenDate, setGarageOpenDate] = useState("");
  const [garageCloseDate, setGarageCloseDate] = useState("");
  const [showExtraCharges, setShowExtraCharges] = useState(false);
  const [discount, setDiscount] = useState<string>("");
  const [advanceAmount, setAdvanceAmount] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [extraDriverBeta, setExtraDriverBeta] = useState<string>("");
  const [charges, setCharges] = useState<ExtraCharge[]>([{ title: "Others", amount: "", remarks: "" }]);
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<BookingResponse | null>(null);
  const [ratePerKm, setRatePerKm] = useState<number>(0);
  const [ratePerHour, setRatePerHour] = useState<number>(0);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [selectedTaxes, setSelectedTaxes] = useState<string[]>([]);
const [manualDriverDays, setManualDriverDays] = useState<number | null>(null);
const [isEditingDriverDays, setIsEditingDriverDays] = useState(false);
const [isClosing, setIsClosing] = useState(false);
const [tripSheetNumber, setTripSheetNumber] = useState<string>("");
const [manualPackageDays, setManualPackageDays] = useState<number | null>(null);
const [isEditingPackageDays, setIsEditingPackageDays] = useState(false);

const getDurationParts = (start?: string, end?: string) => {
  if (!start || !end) return { totalMinutes: 0, hours: 0, minutes: 0 };

  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs <= 0) return { totalMinutes: 0, hours: 0, minutes: 0 };

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);   // ✅ total hours (includes days)
  const minutes = totalMinutes % 60;

  return { totalMinutes, hours, minutes };
};

const getRoundedHours = (start?: string, end?: string) => {
  const { hours, minutes } = getDurationParts(start, end);
  if (hours === 0 && minutes === 0) return 0;

  // ✅ rule: mins >= 30 => +1
  return minutes >= 30 ? hours + 1 : hours;
};


const garageRoundedHours = useMemo(() => {
  if (!garageOpenDate || !garageCloseDate) return 0;
  return getRoundedHours(garageOpenDate, garageCloseDate);
}, [garageOpenDate, garageCloseDate]);

const guestRoundedHours = useMemo(() => {
  if (!guestOpenDate || !guestCloseDate) return 0;
  return getRoundedHours(guestOpenDate, guestCloseDate);
}, [guestOpenDate, guestCloseDate]);


  const hasGarageDetails = useMemo(() => {
    return garageOpenKm && garageCloseKm && garageOpenDate && garageCloseDate;
  }, [garageOpenKm, garageCloseKm, garageOpenDate, garageCloseDate]);

  const hasGuestDetails = useMemo(() => {
    return !hideGuest && guestOpeningKm && guestClosingKm && guestOpenDate && guestCloseDate;
  }, [hideGuest, guestOpeningKm, guestClosingKm, guestOpenDate, guestCloseDate]);

  const num = (v: any) => {
  const x = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(x) ? x : 0;
};

const r = (v: any) => Math.round(num(v)); // ✅ round to nearest rupee

  
  const handleTaxToggle = (taxId: string) => {
    setSelectedTaxes((prev) =>
      prev.includes(taxId)
        ? prev.filter((id) => id !== taxId)
        : [...prev, taxId]
    );
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const time = `${hours}:${minutes} ${ampm}`;
    return `${day}/${month}/${year} ${time}`;
  };

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const BASE_URL = config.baseurl.apibaseurl;
        const res = await axios.get<BookingResponse>(
          `${BASE_URL}/api/order/details/${bookingCode}`
        );
        setData(res.data);
        const bookingData = res.data;
        const pickupDateTime = `${bookingData.booking.bookingDate}`;
        setGarageOpenDate(pickupDateTime);
        setGuestOpenDate(pickupDateTime);

      // Around line 270-310 in useEffect - Replace the package fetching logic
// Replace the package fetching logic in your useEffect (around line 270-310)
// with this updated version that filters out packages with amount: 0

if (bookingData.packages?.length > 0) {
  const fetchedPackages: PackageOption[] = bookingData.packages
    .flatMap((grp) =>
      (grp.packages || []).map((p: any, idx: number): PackageOption | null => {
        const normalizedType = String(grp.packageType || "").toLowerCase().replace(/\s+/g, "");
        const isOutstation = normalizedType.includes("outstation") || normalizedType.includes("outst");

        if (isOutstation) {
          const perKm = Number(p.outstationPerKm ?? 0);
          const driverBattaPerDay = Number(p.driverBattaPerDay ?? 0);
          const minKmDay = Number(p.minimumKmPerDay ?? 0);

          // ✅ Filter out if perKm is 0
          if (perKm === 0) return null;

          return {
            optionId: `${grp.packageDataId}::outstation`,
            label: `₹${perKm}/Km (Bata/Day: ₹${driverBattaPerDay}${minKmDay ? `, MinKm/Day: ${minKmDay}` : ""})`,
            hours: 0,
            kms: perKm,
            amount: perKm,
            packageDataId: grp.packageDataId,
            packageType: grp.packageType || "",
            driverBattaPerDay,
            minimumKmPerDay: minKmDay,
          };
        }

        // localcity
        const hours = Number(p.localPerHour ?? 0);
        const kms = Number(p.localPerKm ?? 0);
        const amount = Number(typeof p.amount === "number" ? p.amount : (p.amount?.amt ?? 0));

        // ✅ Filter out if amount is 0
        if (amount === 0) return null;

        return {
          optionId: `${grp.packageDataId}::${p.packageId || idx}`,
          label: `${hours}hrs/${kms}km - ₹${amount}`,
          hours,
          kms,
          amount,
          packageDataId: grp.packageDataId,
          packageType: grp.packageType || "",
          extraKmRate: Number(p.extraKm ?? 0),
          extraHourRate: Number(p.extraHour ?? 0),
        };
      })
    )
    .filter((pkg): pkg is PackageOption => pkg !== null); // ✅ Remove null values

  setPackages(fetchedPackages);
}

      } catch (error) {
        console.error("Error fetching booking", error);
        showToast("Error fetching booking details.", "error");
      }
    };

    if (bookingCode) {
      fetchBooking();
    }
  }, [bookingCode]);

  const guestKmUsage = useMemo(() => {
    if (guestOpeningKm && guestClosingKm) {
      const diff = parseFloat(guestClosingKm) - parseFloat(guestOpeningKm);
      return diff >= 0 ? diff : 0;
    }
    return 0;
  }, [guestOpeningKm, guestClosingKm]);

  const garageKmUsed = useMemo(() => {
    if (garageOpenKm && garageCloseKm) {
      const diff = parseFloat(garageCloseKm) - parseFloat(garageOpenKm);
      return diff >= 0 ? diff : 0;
    }
    return 0;
  }, [garageOpenKm, garageCloseKm]);

  const calculationKmUsed = useMemo(() => {
    if (hasGarageDetails) {
      return garageKmUsed;
    } else if (hasGuestDetails) {
      return guestKmUsage;
    }
    return 0;
  }, [hasGarageDetails, hasGuestDetails, garageKmUsed, guestKmUsage]);

  const formatDateDiff = (start: string, end: string) => {
    if (!start || !end) return "";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs < 0) return "";
    const diffMins = Math.floor(diffMs / 60000);
    const days = Math.floor(diffMins / (60 * 24));
    const hours = Math.floor((diffMins % (60 * 24)) / 60);
    const mins = diffMins % 60;
    return `${days}d ${hours}h ${mins}m`;
  };

  const getTotalHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60));
  };

  const getDateDifferenceInDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs < 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const calculationHoursUsed = useMemo(() => {
    if (hasGarageDetails) {
      return getTotalHours(garageOpenDate, garageCloseDate);
    } else if (hasGuestDetails) {
      return getTotalHours(guestOpenDate, guestCloseDate);
    }
    return 0;
  }, [hasGarageDetails, hasGuestDetails, garageOpenDate, garageCloseDate, guestOpenDate, guestCloseDate]);

  const calculationDaysUsed = useMemo(() => {
    if (hasGarageDetails) {
      return getDateDifferenceInDays(garageOpenDate, garageCloseDate);
    } else if (hasGuestDetails) {
      return getDateDifferenceInDays(guestOpenDate, guestCloseDate);
    }
    return 0;
  }, [hasGarageDetails, hasGuestDetails, garageOpenDate, garageCloseDate, guestOpenDate, guestCloseDate]);

const effectivePackageDays = useMemo(() => {
  return manualPackageDays !== null ? manualPackageDays : calculationDaysUsed;
}, [manualPackageDays, calculationDaysUsed]);

const effectiveDriverDays = useMemo(() => {
  return manualDriverDays !== null ? manualDriverDays : calculationDaysUsed;
}, [manualDriverDays, calculationDaysUsed]);

  const guestTimeUsage = useMemo(() => formatDateDiff(guestOpenDate, guestCloseDate), [guestOpenDate, guestCloseDate]);
  const garageTimeUsage = useMemo(() => formatDateDiff(garageOpenDate, garageCloseDate), [garageOpenDate, garageCloseDate]);

  // const selectedPkg = packages.find((p) => p.packageDataId === selectedPackage);
const selectedPkg = packages.find((p) => p.optionId === selectedPackage);

  const isSelectedPackageOutstation = useMemo(() => {
    if (!selectedPkg) return false;
    const normalizedPackageType = selectedPkg.packageType?.toLowerCase().replace(/\s+/g, '') || '';
    return normalizedPackageType.includes('outstation') || normalizedPackageType.includes('outst');
  }, [selectedPkg]);

  const getSuggestedPackages = useMemo((): SuggestedPackage[] => {
    if (!selectedPkg) return [];
    
    if (isSelectedPackageOutstation) {
      return [{
        hours: 0,
        kms: 0,
        label: "₹19.00/Km (Outstation)",
        perKm: 19.00
      }];
    } else {
      const usageKm = calculationKmUsed;
      
      if (usageKm < 300) {
        return [{
          hours: 15,
          kms: 150,
          label: "15hrs/150km"
        }];
      } else if (usageKm >= 300 && usageKm < 1000) {
        return [{
          hours: 48,
          kms: 500,
          label: "48hrs/500km"
        }];
      } else if (usageKm >= 1000) {
        return [{
          hours: 96,
          kms: 2000,
          label: "96hrs/2000km"
        }];
      }
    }
    
    return [];
  }, [selectedPkg, isSelectedPackageOutstation, calculationKmUsed]);

 useEffect(() => {
  if (isSelectedPackageOutstation && effectiveDriverDays > 0) {
    const selectedPackageData = data?.packages.find(pkg => pkg.packageDataId === selectedPkg?.packageDataId);
    if (selectedPackageData) {
      const defaultDriverBeta = selectedPackageData.packages[0]?.OSDriverBata || 0;
      const totalDriverBeta = defaultDriverBeta * effectiveDriverDays;
      setExtraDriverBeta(totalDriverBeta.toString());
    }
  } else {
    setExtraDriverBeta("");
  }
}, [isSelectedPackageOutstation, effectiveDriverDays, selectedPackage, data]);

  useEffect(() => {
  if (!selectedPkg) return;

  const t = (selectedPkg.packageType || "").toLowerCase().replace(/\s+/g, "");
  const isOut = t.includes("outstation") || t.includes("outst");

  if (isOut) {
    setRatePerKm(0);
    setRatePerHour(0);
  } else {
    setRatePerKm(Number(selectedPkg.extraKmRate ?? 0));
    setRatePerHour(Number(selectedPkg.extraHourRate ?? 0));
  }
}, [selectedPkg]);
  const additionalKm = useMemo(() => (selectedPkg && !isSelectedPackageOutstation ? Math.max(0, calculationKmUsed - selectedPkg.kms) : 0), [calculationKmUsed, selectedPkg, isSelectedPackageOutstation]);
  const extraChargesTotal = charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  const additionalHours = useMemo(() => {
    if (!selectedPkg) return 0;

    let start = hasGarageDetails ? garageOpenDate : guestOpenDate;
    let end = hasGarageDetails ? garageCloseDate : guestCloseDate;

    if (!start || !end) return 0;

    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs <= 0) return 0;

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const packageMinutes = (selectedPkg.hours || 0) * 60;
    const extraMinutes = Math.max(0, totalMinutes - packageMinutes);

    const hours = Math.floor(extraMinutes / 60);
    const minutes = extraMinutes % 60;

    // If minutes <= 30, return hours only. If minutes > 30, round up to next hour
    if (minutes < 30) {
      return hours;
    } else {
      return hours + 1;
    }
  }, [selectedPkg, garageOpenDate, garageCloseDate, guestOpenDate, guestCloseDate, hasGarageDetails]);

  const extraDriverBetaAmount = useMemo(() => {
    if (!extraDriverBeta || !isSelectedPackageOutstation) return 0;
    return parseFloat(extraDriverBeta);
  }, [extraDriverBeta, isSelectedPackageOutstation]);

const driverBetaDays = useMemo(() => {
  if (!isSelectedPackageOutstation) return 0;
  return effectiveDriverDays;
}, [isSelectedPackageOutstation, effectiveDriverDays]);

const driverBattaPerDay = selectedPkg?.driverBattaPerDay || 0;

const totalDriverBeta = useMemo(() => {
  if (!isSelectedPackageOutstation) return 0;
  return driverBetaDays * driverBattaPerDay;
}, [isSelectedPackageOutstation, driverBetaDays, driverBattaPerDay]);

  const driverBetaPerDay =
    data?.packages.find(pkg => pkg.packageDataId === selectedPackage)?.packages[0]?.OSDriverBata || 0;

  
// const driverBattaPerDay = selectedPkg?.driverBattaPerDay || 0;
// const totalDriverBeta = driverBetaDays * driverBattaPerDay;

const minKmPerDay = useMemo(() => {
  if (!isSelectedPackageOutstation) return 0;
  return Number(selectedPkg?.minimumKmPerDay ?? 0);
}, [isSelectedPackageOutstation, selectedPkg]);

const minKmTotal = useMemo(() => {
  if (!isSelectedPackageOutstation) return 0;
  return minKmPerDay * effectivePackageDays;
}, [isSelectedPackageOutstation, minKmPerDay, effectivePackageDays]);

const outstationBillableKm = useMemo(() => {
  if (!isSelectedPackageOutstation) return 0;
  return Math.max(calculationKmUsed, minKmTotal);
}, [isSelectedPackageOutstation, calculationKmUsed, minKmTotal]);

const packageAmount = useMemo(() => {
  if (!selectedPkg) return 0;

  if (isSelectedPackageOutstation) {
    // ✅ perKm rate × billableKm (min/day applied)
    return selectedPkg.amount * outstationBillableKm;
  }

  return selectedPkg.amount || 0; // local fixed amount
}, [selectedPkg, isSelectedPackageOutstation, outstationBillableKm]);

  const totalAmountBeforeTax = useMemo(() => {
  const addKmAmount = isSelectedPackageOutstation ? 0 : additionalKm * ratePerKm;
  const addHrAmount = isSelectedPackageOutstation ? 0 : additionalHours * ratePerHour;
  const discountAmount = parseFloat(discount) || 0;

  return packageAmount + addKmAmount + addHrAmount + totalDriverBeta - discountAmount;
}, [packageAmount, additionalKm, additionalHours, discount, ratePerKm, ratePerHour, isSelectedPackageOutstation, totalDriverBeta]);

  interface AdditionalTime {
    hours: number;
    minutes: number;
    totalMinutes: number;
    decimalHours: number;
  }

  const additionalTime: AdditionalTime = useMemo(() => {
    if (!selectedPkg) return { hours: 0, minutes: 0, totalMinutes: 0, decimalHours: 0 };

    let start = hasGarageDetails ? garageOpenDate : guestOpenDate;
    let end = hasGarageDetails ? garageCloseDate : guestCloseDate;

    if (!start || !end) return { hours: 0, minutes: 0, totalMinutes: 0, decimalHours: 0 };

    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs <= 0) return { hours: 0, minutes: 0, totalMinutes: 0, decimalHours: 0 };

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const packageMinutes = (selectedPkg.hours || 0) * 60;

    const extraMinutes = Math.max(0, totalMinutes - packageMinutes);

    const hours = Math.floor(extraMinutes / 60);
    const minutes = extraMinutes % 60;

    // Round hours based on minutes: <=30 keep same, >30 add 1
    const roundedHours = minutes < 30 ? hours : hours + 1;

    return {
      hours: hours,
      minutes: minutes,
      totalMinutes: extraMinutes,
      decimalHours: roundedHours,
    };
  }, [selectedPkg, garageOpenDate, garageCloseDate, guestOpenDate, guestCloseDate, hasGarageDetails]);

  const additionalHoursAmount = useMemo(() => {
    if (!selectedPkg || isSelectedPackageOutstation) return 0;
    return additionalTime.decimalHours * ratePerHour;
  }, [additionalTime, ratePerHour, selectedPkg, isSelectedPackageOutstation]);

    // Amount before extra charges (for GST calculation)
  const amountBeforeExtraCharges = useMemo(() => {
    const addKmAmount = isSelectedPackageOutstation ? 0 : additionalKm * ratePerKm;
    const discountAmount = parseFloat(discount) || 0;
    return packageAmount + addKmAmount + additionalHoursAmount + totalDriverBeta;
  }, [packageAmount, additionalKm, additionalHoursAmount, totalDriverBeta, discount, ratePerKm, isSelectedPackageOutstation]);

  const totalAmount = useMemo(() => {
    return amountBeforeExtraCharges;
  }, [amountBeforeExtraCharges, extraChargesTotal]);
  // const totalAmount = useMemo(() => {
  //   const addKmAmount = isSelectedPackageOutstation ? 0 : additionalKm * ratePerKm;
  //   const discountAmount = parseFloat(discount) || 0;
  //   return packageAmount + addKmAmount + additionalHoursAmount + extraChargesTotal + totalDriverBeta - discountAmount;
  // }, [packageAmount, additionalKm, additionalHoursAmount, extraChargesTotal, extraDriverBetaAmount, discount, ratePerKm, isSelectedPackageOutstation]);

  const handleAdd = () => setCharges([...charges, { title: "Others", amount: "", remarks: "" }]);
  const handleRemove = () => {
    if (charges.length > 1) {
      setCharges(charges.slice(0, -1));
    }
  };
  const handleChangeCharge = (index: number, field: keyof ExtraCharge, value: string) => {
    const updated = [...charges];
    updated[index][field] = value;
    setCharges(updated);
  };
  
  const resetAllFields = () => {
    setGarageOpenKm("");
    setGarageCloseKm("");
    setGarageOpenDate(data?.booking ? `${data.booking.bookingDate}` : "");
    setGarageCloseDate("");
    setGuestOpeningKm("");
    setGuestClosingKm("");
    setGuestOpenDate(data?.booking ? `${data.booking.bookingDate}` : "");
    setGuestCloseDate("");
    setSelectedPackage("");
    setExtraDriverBeta("");
    setDiscount("");
    setAdvanceAmount("");
    setCharges([{ title: "Others", amount: "", remarks: "" }]);
    setShowExtraCharges(false);
    setHideGuest(false);
    setTripSheetNumber("");
  };

  const totalWithTax = useMemo(() => {
    if (!data?.tax || !selectedPkg) return totalAmount;
    const selectedTaxPercent = data.tax
      .filter((t: any) => selectedTaxes.includes(t.taxId))
      .reduce((sum, t) => sum + (t.taxPercent || 0), 0);
    const taxAmount = (totalAmount * selectedTaxPercent) / 100;
    return totalAmount + taxAmount;
  }, [totalAmount, selectedTaxes, data]);

  // const finalTotal = useMemo(() => {
  //   if (!data?.tax || !selectedPkg) return totalAmount;
  //   const selectedTaxPercent = data.tax
  //     .filter((t: any) => selectedTaxes.includes(t.taxId))
  //     .reduce((sum, t) => sum + (t.taxPercent || 0), 0);
  //   const taxAmount = (totalAmountBeforeTax * selectedTaxPercent) / 100;
  //   return totalAmount + taxAmount ;
  // }, [totalAmount, selectedTaxes, data]);

  // const totalDue = useMemo(() => {
  //   const advance = parseFloat(advanceAmount) || 0;
  //   return finalTotal - advance;
  // }, [finalTotal, advanceAmount]);
//   const totalDue = useMemo(() => {
//   const advance = parseFloat(advanceAmount) || 0;
//   const rawTotal = finalTotal - advance;
  
//   // Round to nearest rupee: .50+ rounds up, below .50 rounds down
//   return Math.round(rawTotal);
// }, [finalTotal, advanceAmount]);
  
// ✅ Base amount (WITHOUT extra charges & discount)
const baseAmount = useMemo(() => {
  const addKmAmount = isSelectedPackageOutstation ? 0 : additionalKm * ratePerKm;
  const addHrAmount = isSelectedPackageOutstation ? 0 : additionalHoursAmount;

  return packageAmount + addKmAmount + addHrAmount + totalDriverBeta;
}, [
  packageAmount,
  additionalKm,
  ratePerKm,
  additionalHoursAmount,
  totalDriverBeta,
  isSelectedPackageOutstation,
]);

// ✅ Amount before tax (WITH extra charges & discount)
const taxableAmount = useMemo(() => {
  const discountAmount = parseFloat(discount) || 0;
  return baseAmount + extraChargesTotal - discountAmount;
}, [baseAmount, extraChargesTotal, discount]);

// ✅ Tax amount
const taxAmount = useMemo(() => {
  if (!data?.tax || selectedTaxes.length === 0) return 0;

  return data.tax
    .filter((t: any) => selectedTaxes.includes(t.taxId))
    .reduce((sum: number, t: any) => {
      const each = ((baseAmount * (t.taxPercent || 0)) / 100); // ✅ row-wise rounding
      return sum + each;
    }, 0);
}, [data, selectedTaxes, baseAmount]);

// ✅ Final Total (WITH extra charges & discount + tax)
const finalTotal = useMemo(() => {
  const discountAmount = num(discount);
  return baseAmount + taxAmount + extraChargesTotal - discountAmount;
}, [baseAmount, taxAmount, extraChargesTotal, discount]);


// ✅ Total Due
const totalDue = useMemo(() => {
  const advance = parseFloat(advanceAmount) || 0;
  return Math.round(finalTotal - advance);
}, [finalTotal, advanceAmount]);

  const handleCloseOrder = async () => {

     if (isClosing) return; // prevent multiple clicks
  setIsClosing(true);

    setHasAttemptedSubmit(true);
    let newErrors: { [key: string]: string | undefined } = {};

//           if (!tripSheetNumber || tripSheetNumber.trim() === "") {
//   newErrors.tripSheetNumber = "Trip Sheet Number is required";
// }

    if (!hasGarageDetails && !hasGuestDetails) {
      newErrors.general = "Please provide either Garage details or Guest details (or both)";
    }

    if (!selectedPackage) newErrors.package = "Please select a package";

    if (garageOpenKm && garageCloseKm) {
      if (parseFloat(garageCloseKm) <= parseFloat(garageOpenKm)) {
        newErrors.garageKm = "Garage Closing Km must be greater than Opening Km";
      }
    }

    if (garageOpenDate && garageCloseDate) {
      if (new Date(garageCloseDate) <= new Date(garageOpenDate)) {
        newErrors.garageDate = "Garage Closing Date must be greater than Opening Date";
      }
    }

    if (!hideGuest && (guestOpeningKm || guestClosingKm || guestOpenDate || guestCloseDate)) {
      if (!guestOpeningKm || guestOpeningKm.trim() === "")
        newErrors.guestOpeningKm = "Guest Opening Km is required when providing guest details";
      if (!guestClosingKm || guestClosingKm.trim() === "")
        newErrors.guestClosingKm = "Guest Closing Km is required when providing guest details";
      if (!guestCloseDate)
        newErrors.guestCloseDate = "Guest Closing Date & Time is required when providing guest details";
      
      if (guestOpeningKm && guestClosingKm && parseFloat(guestClosingKm) <= parseFloat(guestOpeningKm)) {
        newErrors.guestKm = "Guest Closing Km must be greater than Opening Km";
      }
      if (guestCloseDate && new Date(guestCloseDate) <= new Date(guestOpenDate)) {
        newErrors.guestDate = "Guest Closing Date must be greater than Opening Date";
      }


    }

    setErrors(newErrors);

if (Object.keys(newErrors).length === 0) {
    try {
        // Calculate tax amounts
        let totalTaxAmount = 0;
        const taxDetails: { [key: string]: { amount: number; applicable: boolean } } = {};

        if (data?.tax) {
            const selectedTaxDetails = data.tax.filter(t => selectedTaxes.includes(t.taxId));

        selectedTaxDetails.forEach(tax => {
  const taxPercent = tax.taxPercent || 0;

  const taxAmt = ((baseAmount * taxPercent) / 100); // ✅ rounded like UI

  taxDetails[tax.taxName.toLowerCase()] = {
    amount: taxAmt,
    applicable: true,
  };

  totalTaxAmount += taxAmt; // ✅ integer sum
});

        }
const payload = {
  tripSheetNumber: tripSheetNumber?.trim() ? tripSheetNumber.trim() : null,

  pickupDate: data?.booking.bookingDate,
  bookingId: data?.booking.bookingId,
  packageDataId: selectedPkg?.packageDataId || "",
  selectedPackageData: selectedPkg,
  // chargesTitle: charges[0]?.title || "",
   chargesRemarks: charges[0]?.remarks || "",
  extraChargesBreakup: charges
  .filter(c => Number(c.amount) > 0)
  .map(c => ({
    title: c.title,
    amount: r(c.amount),
    remarks: c.remarks || ""
  })),
usageHours: hasGarageDetails ? garageRoundedHours : guestRoundedHours,
  driverBetaDays: driverBetaDays,
companyId: data?.booking.companyId || data?.booking.user.companyId || "",
  garageKms: hasGarageDetails ? r(garageKmUsed) : 0,
  garageOpenKm: hasGarageDetails ? r(parseFloat(garageOpenKm) || 0) : 0,
  garageCloseKm: hasGarageDetails ? r(parseFloat(garageCloseKm) || 0) : 0,
  garageOpenDateTime: hasGarageDetails ? garageOpenDate : null,
  garageCloseDateTime: hasGarageDetails ? garageCloseDate : null,

  guestKms: hasGuestDetails ? r(guestKmUsage) : 0,
  guestOpenKm: hasGuestDetails ? r(parseFloat(guestOpeningKm) || 0) : 0,
  guestCloseKm: hasGuestDetails ? r(parseFloat(guestClosingKm) || 0) : 0,
  guestOpenDateTime: hasGuestDetails ? guestOpenDate : null,
  guestCloseDateTime: hasGuestDetails ? guestCloseDate : null,

  hideGuestDetails: hideGuest,

  additionalKms: r(additionalKm),
  additionalHours: r(additionalTime.decimalHours),

  discountAmount: r(discount),
  advanceAmount: r(advanceAmount),
  extraCharges: r(extraChargesTotal),

  packageAmount: r(packageAmount),

  additionalKmsAmount: r(isSelectedPackageOutstation ? 0 : additionalKm * ratePerKm),
  additionalHoursAmount: r(isSelectedPackageOutstation ? 0 : additionalHoursAmount),

  extraDriverBeta: r(totalDriverBeta),

  totalAmount: r(baseAmount),     // ✅ net before tax
  total: r(finalTotal),           // ✅ after tax
totalTaxAmount: totalTaxAmount,
  // ✅ Total Due should be consistent with rounded total & rounded advance
  totalDue: Math.max(0, r(finalTotal) - r(advanceAmount)),

  cgstApplicable: taxDetails.cgst?.applicable || false,
  igstApplicable: taxDetails.igst?.applicable || false,
  sgstApplicable: taxDetails.sgst?.applicable || false,

cgstAmount: taxDetails.cgst?.amount || 0,
igstAmount: taxDetails.igst?.amount || 0,
sgstAmount: taxDetails.sgst?.amount || 0,
};


        const token = localStorage.getItem("token");
        const BASE_URL = config.baseurl.apibaseurl;
        
        await axios.post(
            `${BASE_URL}/api/closePendingOrder/createClosePending`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        showToast("Order closed successfully!", "success");
        resetAllFields();
        navigate("/orders/paymentpending");
    } catch (err) {
        console.error("Error closing order", err);
        showToast("Error closing order. Please try again.", "error");
    }
}else {
        Object.values(newErrors).forEach((error) => {
            if (error) showToast(error, "error");
        });
    }
  };
const isFormValid =

  (hasGarageDetails || hasGuestDetails) &&
  selectedPackage &&
  (!hasGarageDetails ||
    (garageOpenKm?.trim() !== "" &&
     garageCloseKm?.trim() !== "" &&
     parseFloat(garageCloseKm) > parseFloat(garageOpenKm) &&
     garageOpenDate &&
     garageCloseDate &&
     new Date(garageCloseDate) > new Date(garageOpenDate)
    )
  ) &&
  (!hasGuestDetails ||
    (guestOpeningKm?.trim() !== "" &&
     guestClosingKm?.trim() !== "" &&
     parseFloat(guestClosingKm) > parseFloat(guestOpeningKm) &&
     guestOpenDate &&
     guestCloseDate &&
     new Date(guestCloseDate) > new Date(guestOpenDate)
    )
  );

  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Loading booking details...</p>
      </div>
    );
  }

const money2 = (v: any) => {
  const n = num(v);
  return n.toFixed(2); // exact 2 decimals
};


  return (
    <PageLayout>
    <div className="p-6">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Close Pending Order</h2>
          <p className="text-black text-xl">
            # {data.booking.bookingCode} - ({data.booking.user.username})
          </p>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}
<div className="mb-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
    
    <div>
      <label className="block font-medium ">Pickup Date</label>
      <input
        type="text"
        value={formatDateOnly(data?.booking?.bookingDate)}
        readOnly
        className="w-full p-2 border rounded-lg bg-gray-100"
      />
    </div>

    <div>
    <InputBox
  label="Trip Sheet Number (Optional)"
  name="tripSheetNumber"
  type="text"
  placeholder="Enter Tripsheet No (optional)"
  value={tripSheetNumber}
  onChange={(name, value) => setTripSheetNumber(value)}
/>

    </div>

  </div>
</div>


        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">Garage Details</h3>
          
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="font-medium">Km(s)</div>
            <InputBox 
              label="Garage Open" 
              name="garageOpenKm" 
              type="number" 
              placeholder="Enter opening km" 
              value={garageOpenKm}
              onChange={(name, value) => { 
                setGarageOpenKm(value); 
                if (hasAttemptedSubmit) {
                  setErrors({ ...errors, garageOpenKm: undefined, garageKm: undefined, general: undefined }); 
                }
              }}
              onWheel={(e) => e.preventDefault()}
              error={hasAttemptedSubmit ? errors.garageOpenKm : undefined}
            />
            <InputBox 
              label="Garage Close" 
              name="garageCloseKm" 
              type="number" 
              placeholder="Enter closing km" 
              value={garageCloseKm}
              onChange={(name, value) => { 
                setGarageCloseKm(value); 
                if (hasAttemptedSubmit) {
                  setErrors({ ...errors, garageCloseKm: undefined, garageKm: undefined, general: undefined }); 
                }
              }}
              onWheel={(e) => e.preventDefault()}
              error={hasAttemptedSubmit ? (errors.garageCloseKm || errors.garageKm) : undefined}
            />
            <div>
              <label className="block mb-1">Usage Garage</label>
              <input type="text" value={`${garageKmUsed} Km`} readOnly className="w-full p-2 border rounded-lg bg-gray-100" />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="font-medium">Date & Time</div>
            <DateAndTimePicker
              label="Garage Open"
              name="garageOpenDate"
              value={garageOpenDate}
              onChange={(name, value) => { 
                setGarageOpenDate(value); 
                setErrors({ ...errors, garageDate: undefined, garageOpenDate: undefined, general: undefined }); 
              }}
              error={errors.garageDate || errors.garageOpenDate}
            />
            <DateAndTimePicker
              label="Garage Close"
              name="garageCloseDate"
              value={garageCloseDate}
              onChange={(name, value) => { 
                setGarageCloseDate(value); 
                setErrors({ ...errors, garageDate: undefined, garageCloseDate: undefined, general: undefined }); 
              }}
              error={errors.garageDate || errors.garageCloseDate}
            />
            <div>
              <label className="block mb-1">Usage Garage</label>
<input
  type="text"
  value={garageCloseDate ? `${garageRoundedHours} hrs` : ""}
  readOnly
  className="w-full p-2 border rounded-lg bg-gray-100"
/>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-700">Guest Details</h3>
            <label className="flex items-center text-gray-600">
              <input 
                type="checkbox" 
                className="mr-2" 
                checked={hideGuest} 
                onChange={(e) => setHideGuest(e.target.checked)} 
              /> 
              Hide Guest Details
            </label>
          </div>
          
          {!hideGuest && (
            <>
              <div className="grid grid-cols-4 gap-6 mb-6">
                <div className="font-medium">Km(s)</div>
                <InputBox 
                  label="Guest Opening" 
                  name="guestOpeningKm" 
                  type="number" 
                  placeholder="Enter opening km" 
                  value={guestOpeningKm}
                  onChange={(name, value) => { 
                    setGuestOpeningKm(value); 
                    setErrors({ ...errors, guestOpeningKm: undefined, guestKm: undefined, general: undefined }); 
                  }}
                  error={errors.guestOpeningKm}
                />
                <InputBox 
                  label="Guest Closing" 
                  name="guestClosingKm" 
                  type="number" 
                  placeholder="Enter closing km" 
                  value={guestClosingKm}
                  onChange={(name, value) => { 
                    setGuestClosingKm(value); 
                    setErrors({ ...errors, guestClosingKm: undefined, guestKm: undefined, general: undefined }); 
                  }}
                  error={errors.guestClosingKm || errors.guestKm}
                />
                <div>
                  <label className="block mb-1">Usage Guest</label>
                  <input type="text" value={`${guestKmUsage} Km`} readOnly className="w-full p-2 border rounded-lg bg-gray-100" />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-6 mb-6">
                <div className="font-medium">Date & Time</div>
                <DateAndTimePicker
                  label="Guest Open"
                  name="guestOpenDate"
                  value={guestOpenDate}
                  onChange={(name, value) => { 
                    setGuestOpenDate(value); 
                    setErrors({ ...errors, guestDate: undefined, guestOpenDate: undefined, general: undefined }); 
                  }}
                  error={errors.guestDate || errors.guestOpenDate}
                />
                <DateAndTimePicker
                  label="Guest Close"
                  name="guestCloseDate"
                  value={guestCloseDate}
                  onChange={(name, value) => { 
                    setGuestCloseDate(value); 
                    setErrors({ ...errors, guestDate: undefined, guestCloseDate: undefined, general: undefined }); 
                  }}
                  error={errors.guestDate || errors.guestCloseDate}
                />
                <div>
                  <label className="block mb-1">Usage Guest</label>
<input
  type="text"
  value={guestCloseDate ? `${guestRoundedHours} hrs` : ""}
  readOnly
  className="w-full p-2 border rounded-lg bg-gray-100"
/>
                </div>
              </div>
            </>
          )}
        </div>

        {(hasGarageDetails || hasGuestDetails) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-700 mb-2">Calculation Details</h3>
            <p className="text-sm text-gray-600">
              Using {hasGarageDetails ? 'Garage' : 'Guest'} details for calculation: 
              <strong> {calculationKmUsed} Km</strong> and 
              <strong> {calculationHoursUsed} Hours</strong>
              {isSelectedPackageOutstation && <span> and <strong>{calculationDaysUsed} Days</strong></span>}
            </p>
          </div>
        )}

{isSelectedPackageOutstation && selectedPkg && (
  <p className="text-sm text-gray-700 mt-2">
    Actual Km: <b>{calculationKmUsed}</b> | Min/Day: <b>{minKmPerDay}</b> × Package Days: <b>{effectivePackageDays}</b> ={" "}
    <b>{minKmTotal}</b> | Billable Km: <b className="text-blue-700">{outstationBillableKm}</b>
    {" "} | Driver Days: <b>{driverBetaDays}</b>
  </p>
)}


        <div className="bg-white shadow rounded-lg mb-6 p-4">
          <InputBox
            label="Package"
            name="selectedPackage"
            type="select"
           options={packages.map(p => ({
  value: p.optionId,
  label: p.label
}))}
value={selectedPackage}

            onChange={(name, value) => {
              setSelectedPackage(value);
              setErrors({ ...errors, package: undefined });
            }}
            error={errors.package}
          />

       <div className="mb-4">
{isSelectedPackageOutstation && (
  <div className="flex flex-col gap-2">

    {/* ✅ Package Days (affects billable km only) */}
    <div className="flex items-center gap-2">
      <label className="font-medium">Package Days:</label>
      <input
        type="number"
        min="1"
        onWheel={(e) => e.currentTarget.blur()}
        className="w-20 border rounded px-1 py-0.5 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={isEditingPackageDays ? (manualPackageDays ?? "") : (manualPackageDays ?? calculationDaysUsed)}
        onFocus={() => setIsEditingPackageDays(true)}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") {
            setManualPackageDays(null);
          } else {
            const num = parseInt(val, 10);
            if (!isNaN(num) && num > 0) setManualPackageDays(num);
          }
        }}
        onBlur={() => {
          setIsEditingPackageDays(false);
          if (manualPackageDays === null) setManualPackageDays(calculationDaysUsed);
        }}
      />
      <span className="text-sm text-gray-600">
        MinKmTotal = {minKmPerDay} × {effectivePackageDays} = <b>{minKmTotal}</b>
      </span>
    </div>

    {/* ✅ Driver Days (affects driver beta only) */}
    <div className="flex items-center gap-2">
      <label className="font-medium">Driver Days:</label>
      <input
        type="number"
        min="1"
        onWheel={(e) => e.currentTarget.blur()}
        className="w-20 border rounded px-1 py-0.5 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={isEditingDriverDays ? (manualDriverDays ?? "") : (manualDriverDays ?? calculationDaysUsed)}
        onFocus={() => setIsEditingDriverDays(true)}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") {
            setManualDriverDays(null);
          } else {
            const num = parseInt(val, 10);
            if (!isNaN(num) && num > 0) setManualDriverDays(num);
          }
        }}
        onBlur={() => {
          setIsEditingDriverDays(false);
          if (manualDriverDays === null) setManualDriverDays(calculationDaysUsed);
        }}
      />
      <span className="text-sm text-gray-600">
        Beta = {driverBattaPerDay} × {driverBetaDays} = <b>₹{totalDriverBeta.toFixed(2)}</b>
      </span>
    </div>

  </div>
)}



  {/* Show days & amount only for Outstation */}
 {isSelectedPackageOutstation && driverBetaDays > 0 && (
  <p className="text-sm text-gray-600 mt-1">
    Driver Days: <span className="font-medium">{driverBetaDays}</span> | 
Bata per Day: ₹<span className="font-medium">{driverBattaPerDay}</span>
    Total Bata: ₹<span className="font-semibold text-green-700">{totalDriverBeta.toFixed(2)}</span>
  </p>
)}
</div>


          {selectedPkg && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Selected Package Details:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {selectedPkg.packageType || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Amount:</span> ₹{selectedPkg.amount || 0}
                </div>
                {!isSelectedPackageOutstation && (
                  <div>
                    <span className="font-medium">Hours:</span> {selectedPkg.hours || 0}
                  </div>
                )}
                <div>
                  <span className="font-medium">Kilometers:</span> {selectedPkg.kms || 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {!isSelectedPackageOutstation && (hasGarageDetails || hasGuestDetails) && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="border-b px-4 py-2 text-orange-600 font-semibold">Extension Charges</div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-medium mb-1">Additional Kms</label>
                  <input type="text" value={`${additionalKm} Km`} disabled className="border rounded px-3 py-2 w-full bg-gray-100" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Additional Hours</label>
                  <input type="text" value={`${additionalTime.hours}h ${additionalTime.minutes}m (Rounded: ${additionalTime.decimalHours}h)`} disabled className="border rounded px-3 py-2 w-full bg-gray-100" />
                </div>
              </div>
             
            </div>
          </div>
        )}

        {isSelectedPackageOutstation && (hasGarageDetails || hasGuestDetails) && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="border-b px-4 py-2 text-orange-600 font-semibold">Outstation Charges</div>
            <div className="p-4">
              {getSuggestedPackages.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Suggested Package:</h4>
                  {getSuggestedPackages.map((suggestedPkg, index) => (
                    <div key={index} className="text-sm text-blue-700">
                      <span className="font-medium">{suggestedPkg.label}</span>
                      <span className="ml-2 text-xs text-blue-600">(Default for Outstation)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-50 border p-4 mt-4 rounded-md shadow-sm">
          <label className="flex items-center mb-2 cursor-pointer">
            <input type="checkbox" checked={showExtraCharges} onChange={(e) => setShowExtraCharges(e.target.checked)} className="mr-2" /> Extra Charges
          </label>
          {showExtraCharges && (
            <>
              <h2 className="flex items-center text-orange-600 font-semibold mb-4">
                <span className="mr-2">🧾</span> Extra Charges
              </h2>
              <div className="flex justify-end mb-3">
                <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add More</button>
              </div>
              <div className="border rounded bg-white">
                <div className="grid grid-cols-3 font-semibold text-gray-700 border-b p-2">
                  <div>Title</div>
                  <div>Amount ₹</div>
                </div>
                {charges.map((charge, index) => (
                  <div key={index} className="grid grid-cols-3 border-b p-2 gap-2">
                    <select className="border rounded p-2" value={charge.title} onChange={(e) => handleChangeCharge(index, "title", e.target.value)}>
                      <option value="Others">Others</option>
                      <option value="Parking">Parking</option>
                      <option value="Tollgate">Tollgate</option>
                      <option value="Permit">Permit</option>
                    </select>
                    <input type="number" className="border rounded p-2" value={charge.amount}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    onChange={(e) => handleChangeCharge(index, "amount", e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={handleRemove} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Remove Last</button>
              </div>
            </>
          )}
        </div>

        <div className="mb-6 mt-6">
          <InputBox label="Discount Amount" name="discount" type="number" placeholder="Discount Amount" value={discount} onChange={(name, value) => setDiscount(value)} />
          <small className="text-gray-500">If any discount, please enter amount.</small>
        </div>

        <div className="mb-6">
          <InputBox label="Advance Amount" name="advanceAmount" type="number" placeholder="Advance Amount" value={advanceAmount} onChange={(name, value) => setAdvanceAmount(value)} />
          <small className="text-gray-500">Enter advance amount if any.</small>
        </div>

        {data?.tax && data.tax.length > 0 && (
          <div className="bg-white shadow rounded-lg p-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Taxes</h3>
            {data.tax.map((t: any) => (
              <div key={t.taxId} className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id={t.taxId}
                  checked={selectedTaxes.includes(t.taxId)}
                  onChange={() => handleTaxToggle(t.taxId)}
                />
                <label htmlFor={t.taxId} className="text-gray-700">
                  {t.taxName} ({t.taxPercent}%)
                </label>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-6">
   <button
  className={`px-6 py-2 rounded-md text-white transition-colors ${
    !isFormValid || isClosing
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700"
  }`}
  onClick={handleCloseOrder}
  disabled={!isFormValid || isClosing}
>
  {isClosing ? "Closing..." : "Close Order"}
</button>


          <div className="space-y-2 w-[400px] text-sm mt-6 bg-gray-100 p-4 rounded-md">
            <div className="flex justify-between">
<span>
  Package Amount{" "}
  {isSelectedPackageOutstation
    ? `(${selectedPkg?.amount} × ${outstationBillableKm})`
    : ""}
  :
</span>
<span>₹{r(packageAmount)}</span>
            </div>

            {!isSelectedPackageOutstation && (hasGarageDetails || hasGuestDetails) && (
              <>
                <div className="flex justify-between">
                  <span>Additional Km(s) ({additionalKm} × ₹{ratePerKm}) :</span>
<span>₹{r(additionalKm * ratePerKm)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional Hours ({additionalTime.decimalHours} × ₹{ratePerHour}) :</span>
<span>₹{r(additionalHoursAmount)}</span>
                </div>
              </>
            )}

            {isSelectedPackageOutstation && calculationDaysUsed > 0 && (
              <div className="flex justify-between">
                <span>Driver Beta ({driverBetaDays} × {driverBattaPerDay} ) :</span>
                <span>₹{totalDriverBeta.toFixed(2)}</span>
              </div>
            )}

          

            <div className="border-t my-2"></div>

           <div className="flex justify-between">
  <span>Sub Total :</span>
<span>₹{r(baseAmount)}</span>
</div>

     {selectedTaxes.length > 0 && (
              <>
                {data?.tax
                  .filter((t: any) => selectedTaxes.includes(t.taxId))
                  .map((t: any) => (
                    <div key={t.taxId} className="flex justify-between">
                      <span>{t.taxName} ({t.taxPercent}%) :</span>
<span>+ ₹{money2((baseAmount * t.taxPercent) / 100)}</span>
                    </div>
                  ))}
              </>
            )}


  {/* <div className="flex justify-between">
              <span>Extra Charges :</span>
<span>₹{r(extraChargesTotal)}</span>
            </div> */}

            {charges
  .filter(c => Number(c.amount) > 0)
  .map((c, idx) => (
    <div key={idx} className="flex justify-between">
      <span>{c.title} :</span>
      <span>₹{r(c.amount)}</span>
    </div>
))}

            <div className="flex justify-between">
              <span>Discount Amount :</span>
<span>- ₹{r(discount)}</span>
            </div>
       
            <div className="border-t my-2"></div>

            <div className="flex justify-between font-semibold">
              <span>Total :</span>
<span className="text-blue-600">₹{r(finalTotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Advance :</span>
<span>- ₹{r(advanceAmount)}</span>
            </div>

            <div className="flex justify-between border-t pt-2 font-semibold text-lg">
              <span>Total Due :</span>
<span className="text-green-600">₹{r(totalDue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageLayout>
  );
};

export default ClosePendingOrderDetails;
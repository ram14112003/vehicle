import React, { useEffect, useRef, useState } from "react";
import PageLayout from "../../../components/PageLayout";
import CommonButton from "../../../components/CommonButton";
import InputBox, { getFormStore } from "../../../components/InputBox";
import { DataTable, Column } from "../../../components/DataTable";
import SearchBar from "../../../components/SearchBar";
import axiosInstance from "../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../components/AlertBox";

interface TripData {
  bookingCode: string;
  bookingDate: string;
  driver?: {
    driverName: string;
  };
invoice?: {
  closePending?: {
    tripSheetNumber: string;
  };
}[];
}

interface Driver {
  driverId: string;
  driverName: string;
}

const TripDetails: React.FC = () => {
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [tableData, setTableData] = useState<TripData[]>([]);
  const [isSearched, setIsSearched] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  const filterBoxRef = useRef<HTMLDivElement | null>(null);

  // ✅ Fetch Drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await axiosInstance.get("/driver/getAllDrivers");
        setDrivers(res.data?.drivers || []);
      } catch (err) {
        console.error("Driver fetch error", err);
      }
    };

    fetchDrivers();
  }, []);

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleString();
  };


  useEffect(() => {
  const fetchAllTrips = async () => {
    try {
      const res = await axiosInstance.get("/vehicle/getCompletedTrip");

      setTableData(res.data?.data || []);
      setIsSearched(true);
    } catch (err) {
      console.error("Initial load error", err);
    }
  };

  fetchAllTrips();
}, []);

const handleApplyFilter = async () => {
  try {
    const form = getFormStore();
    const { dateRange } = form;

    const params: any = {};

    if (dateRange) {
      const [fromRaw, toRaw] = dateRange.split(" - ");

      if (fromRaw && toRaw) {
        const [fD, fM, fY] = fromRaw.split("/");
        const [tD, tM, tY] = toRaw.split("/");

        params.startDate = `${fY}-${fM}-${fD}`;
        params.endDate = `${tY}-${tM}-${tD}`;
      }
    }

    if (selectedDriver) {
      params.driverId = selectedDriver;
    }

    const res = await axiosInstance.get("/vehicle/getCompletedTrip", {
      params,
    });

    setTableData(res.data?.data || []);
    setIsSearched(true);

  } catch (err) {
    console.error(err);
    showToast("Failed to fetch trips", "error");
  }
};
  // ✅ MAIN FILTER API
//   const handleApplyFilter = async () => {
//     try {
//       const form = getFormStore();
//       const { dateRange } = form;

//       if (!dateRange) {
//         showToast("Please select date range", "warn");
//         return;
//       }

//       const [fromRaw, toRaw] = dateRange.split(" - ");
//       const [fD, fM, fY] = fromRaw.split("/");
//       const [tD, tM, tY] = toRaw.split("/");

//       const startDate = `${fY}-${fM}-${fD}`;
//       const endDate = `${tY}-${tM}-${tD}`;

//       const params: any = {
//         startDate,
//         endDate,
//       };

//       if (selectedDriver) {
//         params.driverId = selectedDriver;
//       }

//       const res = await axiosInstance.get("/vehicle/getCompletedTrip", {
//         params,
//       });

//       setTableData(res.data?.data || []);
//       setIsSearched(true);
//     } catch (err) {
//       console.error(err);
//       showToast("Failed to fetch trips", "error");
//     }
//   };

  // Enter key support
  useEffect(() => {
    if (!showFilterBox) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleApplyFilter();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showFilterBox, selectedDriver]);

  const columns: Column<TripData>[] = [
    { header: "Booking Code", accessor: "bookingCode" },
    {
      header: "Booking Date",
      accessor: "bookingDate",
      render: (row) => formatDate(row.bookingDate),
    },
    {
      header: "Driver Name",
      accessor: "driver",
      render: (row) => row.driver?.driverName || "-",
    },
    {
      header: "Trip Sheet No",
      accessor: "invoice",
      render: (row) =>
  row.invoice?.[0]?.closePending?.tripSheetNumber || "-"    },
  ];

  return (
    <PageLayout>
      <AlertContainer />

      <div className="py-6">
        <h1 className="text-3xl font-bold">Trip Details</h1>
      </div>

      {/* Filter Button */}
      <CommonButton onClick={() => setShowFilterBox(!showFilterBox)}>
        Filter {showFilterBox ? "▲" : "▼"}
      </CommonButton>

      {/* Filter Box */}
      {showFilterBox && (
        <div className="bg-gray-50 p-6 mt-4 rounded shadow">
          <div className="flex gap-4">

            {/* Driver Dropdown */}
            <div className="w-[250px]">
              <label className="text-sm font-medium">Driver</label>
              <select
                className="border rounded w-full px-2 py-1"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                <option value="">All Drivers</option>
                {drivers.map((d) => (
                  <option key={d.driverId} value={d.driverId}>
                    {d.driverName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="w-[280px]">
              <InputBox
                name="dateRange"
                label="Date Range"
                type="date-range"
              />
            </div>

            <SearchBar onlyButton onSearch={handleApplyFilter} />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={isSearched ? tableData : []}
          rowsPerPage={5}
          emptyMessage="No trips found"
        />
      </div>
    </PageLayout>
  );
};

export default TripDetails;
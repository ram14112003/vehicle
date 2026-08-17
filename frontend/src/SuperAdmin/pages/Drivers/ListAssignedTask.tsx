import React, { useState, useEffect } from "react";
import PageLayout from "../../../components/PageLayout";
import axiosInstance from "../../../utils/axiosInstance";
import { DataTable, Column } from "../../../components/DataTable";
import SearchBar from "../../../components/SearchBar"; 
import { showToast } from "../../../components/AlertBox";

interface AssignedDriver {
  name: string;
  orderNumber: string;
  orderDate: string;
  pickupDate: string;
  pickupPoint: string;
}

interface BookingApiResponse {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
  createdAt: string;
  pickupPoint: string;
  driver?: { driverId: string; driverName: string };
}

const AssignedList: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [data, setData] = useState<AssignedDriver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State to hold the data after filtering for the search button
  const [filteredData, setFilteredData] = useState<AssignedDriver[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axiosInstance.get<{ data: BookingApiResponse[] }>(
          "/vehicle/getAssignedTrip"
        );
        

        const bookings = res.data.data;
        const formatted: AssignedDriver[] = bookings.map((b: BookingApiResponse) => ({
          name: b.driver?.driverName || "N/A",
          orderNumber: b.bookingCode,
          orderDate: new Date(b.createdAt).toLocaleString(),
          pickupDate: new Date(b.bookingDate).toLocaleDateString(),
          pickupPoint: b.pickupPoint || "-",
        }));

        setData(formatted);
        // Initially set filteredData to all data
        setFilteredData(formatted);
      } catch (err) {
     
        showToast('Failed to fetch bookings:', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleSearch = () => {
    const result = data.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.orderNumber.includes(search)
    );
    setFilteredData(result);
  };

  const columns: Column<AssignedDriver>[] = [
    {
      header: "Driver Name",
      accessor: "name",
      render: (row) => (
        <>
          <span className="text-gray-700">{row.name}</span>
          <div className="text-xs text-gray-400">(-)</div>
        </>
      ),
    },
    {
      header: "Order Number",
      accessor: "orderNumber",
      render: (row) => (
        <span className="text-blue-600 hover:underline cursor-pointer">
          {row.orderNumber}
        </span>
      ),
    },
    {
      header: "Order Date",
      accessor: "orderDate",
    },
    {
      header: "Pick-up Date",
      accessor: "pickupDate",
    },
    {
      header: "Pick-up Point",
      accessor: "pickupPoint",
    },
  ];

  return (
    <PageLayout>
      <div className="py-6">
        {/* Header */}
        
         <h2 className="text-3xl font-bold text-gray-800 mb-4">
            List Assigned Driver
          </h2>
         
        

        {/* Search */}
        <div className="mb-4">
          <SearchBar
            placeholder="Keywords (Driver Name, Order Number)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={handleSearch}
          />
        </div>

        {/* DataTable */}
        <DataTable
          key={search + filteredData.length}
          columns={columns}
          data={filteredData}
          loading={loading}
          rowsPerPage={10}
          // emptyMessage="No assigned drivers found."
        />
      </div>
    </PageLayout>
  );
};

export default AssignedList;
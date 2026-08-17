import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import PageLayout from "../../../components/PageLayout";
import { DataTable, Column } from "../../../components/DataTable";
import SearchBar from "../../../components/SearchBar";
import { showToast } from "../../../components/AlertBox";

// ✅ Formatter to force "DD/MM/YYYY hh:mm AM/PM"
const formatToCustom = (dateString: string) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  let day = String(d.getDate()).padStart(2, "0");
  let month = String(d.getMonth() + 1).padStart(2, "0");
  let year = d.getFullYear();

  let hours = d.getHours();
  let minutes = String(d.getMinutes()).padStart(2, "0");
  let ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

// ✅ Define the structure of a single cancelled order
interface CancelledOrder {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
  createdAt: string;   // used as "Cancelled Date" in current API
  pickupPoint: string;
  userId: string;
  emailAddress?: string;

  // Enriched
  userName?: string;
  companyName?: string;
  pickupDate?: string;
  cancelledDate?: string;
}

// ✅ Define the structure of the full API response
interface ApiResponse {
  data: CancelledOrder[];
  message: string;
}

const ListCancelOrder: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [orders, setOrders] = useState<CancelledOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ------- helpers -------
  const enrichCancelled = async (items: CancelledOrder[]): Promise<CancelledOrder[]> => {
    return Promise.all(
      items.map(async (order) => {
        try {
          const userRes = await axiosInstance.get(`/user/${order.userId}`);
          const user = userRes.data?.data;
          const companyId = user?.companyId;

          let companyName = "-";
          if (companyId) {
            const companyRes = await axiosInstance.get(`/company/getCompanyById/${companyId}`);
            companyName = companyRes.data?.data?.companyName || "-";
          }

          return {
            ...order,
            pickupDate: formatToCustom(order.bookingDate),
            cancelledDate: formatToCustom(order.createdAt),
            userName: user?.username || "-",
            companyName,
            emailAddress: user?.email || "-",
          };
        } catch {
          return {
            ...order,
            pickupDate: formatToCustom(order.bookingDate),
            cancelledDate: formatToCustom(order.createdAt),
            userName: "-",
            companyName: "-",
          };
        }
      })
    );
  };

  const loadDefault = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<ApiResponse>("/order/status/cancelled");
      const enriched = await enrichCancelled(response.data.data || []);
      setOrders(enriched);
    } catch (e) {
     
      showToast("Error fetching cancelled orders",'error');
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    loadDefault();
  }, []);

  // ------- columns -------
  const columns: Column<CancelledOrder>[] = [
    { header: "Order Number #", accessor: "bookingCode" ,
       render: (row) => (
      <span
        onClick={() => handleView(row)}
        className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
      >
        {row.bookingCode}
      </span>
    ),
    },
    { header: "Pickup Date", accessor: "pickupDate" },
    { header: "Pickup Point", accessor: "pickupPoint" },
    { header: "User Name", accessor: "userName" },
    { header: "Company Name", accessor: "companyName" },
    { header: "Cancelled Date", accessor: "cancelledDate" },
  ];

  // ------- search (with API) -------
  const handleSearch = async () => {
    const q = searchKeyword.trim();
    if (!q) {
      await loadDefault();
      return;
    }

    try {
      setLoading(true);

      // 1) Get current cancelled list to know which bookings are cancelled
      const cancelledRes = await axiosInstance.get<ApiResponse>("/order/status/cancelled");
      const cancelled = cancelledRes.data?.data || [];
      const cancelledIds = new Set(cancelled.map((b) => b.bookingId));

      // 2) Global search across bookings (user/company/bookingCode/invoice etc.)
      const gs = await axiosInstance.get("/globalsearch", {
        params: { model: "booking", keyword: q },
      });

      // 3) Keep only the cancelled ones
      const onlyCancelled = (gs.data || []).filter((b: any) => cancelledIds.has(b.bookingId));

      // 4) Normalize to our CancelledOrder shape
      const normalized: CancelledOrder[] = onlyCancelled.map((b: any) => ({
        bookingId: b.bookingId,
        bookingCode: b.bookingCode,
        bookingDate: b.bookingDate,
        createdAt: b.createdAt,      // your UI currently uses createdAt as "cancelled date"
        pickupPoint: b.pickupPoint,
        userId: b.userId,
      }));

      // 5) Enrich & set
      const enriched = await enrichCancelled(normalized);
      setOrders(enriched);
    } catch (e) {
     
      setOrders([]); // show "No entries found"
    } finally {
      setLoading(false);
    }
  };

  const handleView = (order: CancelledOrder) => {
    navigate(`/orders/view/cancelled-order/${order.bookingId}`);
  };

  return (
    <PageLayout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">List Cancelled Orders</h1>

        <div className="mb-4">
          <SearchBar
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch} // 🔗 server-side search hook
            placeholder="Search by User, Company, Email, Order No"
          />
        </div>
    {/* Display loading, "no records found," or DataTable */}
        <DataTable
          key={searchKeyword + orders.length}
          columns={columns}
          // data={filteredOrders}   // use filteredOrders so typing also filters locally
          data={orders}
          loading={loading}
          onView={handleView}
          rowsPerPage={10}
          
        />
      </div>
    </PageLayout>
  );
};

export default ListCancelOrder;
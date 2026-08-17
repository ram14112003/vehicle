import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '../../../components/PageLayout';
import { DataTable, Column } from '../../../components/DataTable';
import SearchBar from '../../../components/SearchBar';
import axiosInstance from '../../../utils/axiosInstance';
import { showToast, AlertContainer } from '../../../components/AlertBox';

interface ApiItem {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
   bookingTime: string; 
  pickupPoint: string;
  userId: string;
  createdAt: string;
  userName?: string;
  companyName?: string;
  emailAddress?: string;
  paymentMode?: string;
  orderDate?: string;
  pickupDate?: string;
}

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

const ConfirmPendingList: React.FC = () => {
  const location = useLocation();
  const { userId } = location.state || {}; // 👈 userId from navigation

  const [searchText, setSearchText] = useState('');
  const [orders, setOrders] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{ bookingId: string; bookingCode: string } | null>(null);
const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();

  const columns: Column<ApiItem>[] = [
    {
      header: 'Order Number #', accessor: 'bookingCode',
      render: (row) => (
        <span
          onClick={() => handleView(row)}
          className="hover:text-blue-800 font-bold cursor-pointer"
        >
          {row.bookingCode}
        </span>
      ),
    },
    { header: 'Order Date', accessor: 'orderDate' },
    { header: 'Pickup Date', accessor: 'pickupDate' },
    { header: 'Travel Package', accessor: 'pickupPoint' },
    { header: 'User Name', accessor: 'userName' },
    { header: 'Company Name', accessor: 'companyName' },
  ];

  // 🔥 Enrichment function (user + company + formatting)
  const enrichBookings = async (bookings: ApiItem[]): Promise<ApiItem[]> => {
    return Promise.all(
      bookings.map(async (booking) => {
        try {
          const userRes = await axiosInstance.get(`/user/${booking.userId}`);
          const user = userRes.data?.data;
          const companyId = user?.companyId;

          let companyName = "-";
          if (companyId) {
            const companyRes = await axiosInstance.get(`/company/getCompanyById/${companyId}`);
            companyName = companyRes.data?.data?.companyName || "-";
          }

          return {
            ...booking,
            orderDate: formatToCustom(booking.createdAt),
           // pickupDate: formatToCustom(booking.bookingDate),
           pickupDate: formatToCustom(`${booking.bookingDate.split("T")[0]}T${booking.bookingTime}`),
            userName: user?.username || "-",
            companyName,
            emailAddress: user?.email || "-",
          };
        } catch {
          return {
            ...booking,
            orderDate: formatToCustom(booking.createdAt),
           // pickupDate: formatToCustom(booking.bookingDate),
           pickupDate: formatToCustom(`${booking.bookingDate.split("T")[0]}T${booking.bookingTime}`),

            userName: "-",
            companyName: "-",
            emailAddress: "-",
          };
        }
      })
    );
  };

  // ✅ Fetch API + apply filter if userId is passed
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/emp/confirmPendingOrderCountWeb');
        let bookings: ApiItem[] = response.data.data;

        // 👉 Apply filter if userId is present
        if (userId) {
          bookings = bookings.filter((b) => b.userId === userId);
        }

        const enriched = await enrichBookings(bookings);
        setOrders(enriched);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  const handleView = (order: ApiItem) => {
    navigate(`/orders/view/confirm-pending-order/${order.bookingId}`, {
      state: { userId: order.userId }
    });
  };

  const handleCancel = (order: ApiItem) => {
    setSelectedOrder({ bookingId: order.bookingId, bookingCode: order.bookingCode });
    setShowCancelModal(true);
  };

  const handleEdit = (order: ApiItem) => {
    navigate(`/orders/confirmpending/${order.bookingId}`);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;
     setCancelLoading(true);
    try {
      await axiosInstance.put("/order/cancelBooking", {
        bookingId: selectedOrder.bookingId,
        remarks: "Cancelled by employee",
      });
      setOrders(prev => prev.filter(order => order.bookingId !== selectedOrder.bookingId));
      showToast(`Order #${selectedOrder.bookingCode} cancelled successfully`, 'success');
    } catch {
      showToast("Failed to cancel order. Please try again.", 'error');
    } finally {
      setShowCancelModal(false);
      setSelectedOrder(null);
          setCancelLoading(false);

    }
  };
    const handleSearch = async (query: string) => {
  setSearchText(query);

  if (!query.trim()) {
    // reload default API
    try {
      const res = await axiosInstance.get('/emp/confirmPendingOrderCountWeb');
      const bookings: ApiItem[] = res.data.data || [];

      const enriched = await enrichBookings(bookings);
      setOrders(enriched);
    } catch (err) {
      console.error("Reload error:", err);
    }
    return;
  }

  try {
    // 1. Get payment pending bookings
    const pendingRes = await axiosInstance.get('/emp/confirmPendingOrderCountWeb');
    const pendingBookings: ApiItem[] = pendingRes.data?.data || [];
    const pendingIds = new Set(pendingBookings.map(b => b.bookingId));

    // 2. Call global search
    const res = await axiosInstance.get(`/globalsearch`, {
      params: { model: "booking", keyword: query }
    });

    // 3. Filter results → only keep bookings which are in payment pending list
    const filtered = res.data.filter((booking: any) => pendingIds.has(booking.bookingId));

    // 4. Enrich & set
    const enriched = await enrichBookings(filtered);
    setOrders(enriched);

  } catch (error) {
    console.error("Global search failed:", error);
  }
};

  return (
    <PageLayout>
      <AlertContainer />
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          List Confirm Pending Order
        </h1>

        {/* <div className="mb-4">
          <SearchBar
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={() => {}} // search logic same as before
            placeholder="Search by User, Company, Email, Order No, Payment Mode"
          />
        </div> */}
        <div className="mb-4">
          <SearchBar
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            
            onSearch={() => handleSearch(searchText)} 
            placeholder="Search by User, Company, Order No"
          />
        </div>

        <DataTable
        key={searchText}
          columns={columns}
          data={orders}
          loading={loading}
          onView={handleView}
          onCancel={handleCancel}
          onEdit={handleEdit}
          rowsPerPage={10}
        />
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
            <h2 className="text-xl font-semibold mb-4">Cancel Confirmation</h2>
            <p className="mb-6">
              Do you want to cancel this order <span className="font-bold">#{selectedOrder?.bookingCode}</span>?
            </p>
            <div className="flex justify-center gap-4">
             <button
  className={`px-6 py-2 rounded text-white ${
    cancelLoading ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
  }`}
  onClick={handleConfirmCancel}
  disabled={cancelLoading}
>
  {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
</button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded"
                onClick={() => setShowCancelModal(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ConfirmPendingList;


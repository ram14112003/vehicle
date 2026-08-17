import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showToast } from '../../../components/AlertBox';
import {
  Pencil,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  FileText,
  X,
  CheckCircle, // Import the new icon
} from 'lucide-react';
import { faPen, } from '@fortawesome/free-solid-svg-icons';

import axiosInstance from '../../../utils/axiosInstance';
import EditUserCompanyDetails from './EditUserCompanyDetails';

type UserDetailsType = {
  userId: string;
  username: string;
  email: string;
  mobile: string;
  gender: string;
  companyId: string;
    isManager?: boolean;
     danfossuserId?: string;
  managerId?: string;
  managerEmail?: string;
  costCenter?: string; 
  isConfirmed: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  status: string;
  // Address fields
  userAddress: string;
  presentAddress?: string;
  pinCode?: string;
  city?: string;
  state?: string;
  country?: string;
  addresses?: AddressType[];
};

type AddressType = {
  isDefault: boolean;
  address: string;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  
};

type CompanyType = {
  companyId: string;
  companyName: string;
  companyAddress?: string;
  // presentAddress?: string;
  // pinCode?: string;
  // city?: string;
  // state?: string;
  // country?: string;
};
type UserOrderStats = {
  confirmPendingOrder: number;
  closedPendingOrder: number;
  invoicePendingOrderCount: number;
  invoicePendingOrderAmount: number;
  invoicepaidOrderCount: number;
  invoicePaidOrderAmount: number;
  paymentPendingOrderCount: number;
  paymentPendingOrderAmount: number;
  paymentCompletedOrderCount: number;
  paymentCompletedOrderAmount: number;
};

type StatsApiResponse = {
  success: boolean;
  data: UserOrderStats;
};

export default function UserDetails() {
  const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

  const [user, setUser] = useState<UserDetailsType | null>(null);
  const [companyData, setCompanyData] = useState<CompanyType | null>(null);
  const [companyName, setCompanyName] = useState<string>('N/A');
  const [companyList, setCompanyList] = useState<CompanyType[]>([]);
  const [extraAddresses, setExtraAddresses] = useState<any[]>([]);
 const [addressList, setAddressList] = useState<AddressType[]>([]);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // New state for success message
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const [stats, setStats] = useState<UserOrderStats | null>(null);
const [statsLoading, setStatsLoading] = useState<boolean>(false);
const [statsErr, setStatsErr] = useState<string | null>(null);
const danfossCompanyId = companyList.find(
  c => c.companyName.toLowerCase().includes('danfoss')
)?.companyId;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    gender: '',
    companyId: '',
      isManager: false,
        danfossuserId: '',
  managerId: '',
  managerEmail: '',
  costCenter: ''  
  });

  type UserDetailsResponse = {
    data: UserDetailsType & { addressList: AddressType[] };
    message: string;
  };

  // helper: format INR nicely
const inr = (n: number) =>
  (n || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });

// ⬇️ add this effect after fetchUserDetails effect
useEffect(() => {
  const fetchStats = async () => {
    if (!userId) return;
    try {
      setStatsLoading(true);
      setStatsErr(null);
      const { data } = await axiosInstance.get<StatsApiResponse>(
        `/invoiceRoutes/user-order-stats/${userId}`
      );
      if (data?.success) setStats(data.data);
      else setStatsErr("Failed to load order stats");
    } catch (e) {
      console.error("order stats error", e);
      setStatsErr("Failed to load order stats");
    } finally {
      setStatsLoading(false);
    }
  };
  fetchStats();
}, [userId]);


  const fetchUserDetails = async () => {
  try {
    const response = await axiosInstance.get<UserDetailsResponse>(`/user/${userId}`);
    const userData = response.data.data;

    const dateOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    const formattedDate = new Date(userData.createdAt).toLocaleString('en-GB', dateOptions);

    setUser({
      ...userData,
      createdAt: formattedDate,
    });

  setFormData({
  username: userData.username,
  email: userData.email,
  mobile: userData.mobile,
  gender: userData.gender,
  companyId: userData.companyId,
  isManager: userData.isManager ?? false,
  danfossuserId: userData.danfossuserId || '',
  managerId: userData.managerId || '',
  managerEmail: userData.managerEmail || '',
    costCenter: userData.costCenter || ''
});

    // ✅ set both addressList and extraAddresses
setAddressList([
  {
    isDefault: true,
    address: userData.userAddress || '',
    pinCode: userData.pinCode || '',
    city: userData.city || '',
    state: userData.state || '',
    country: userData.country || '',
  },
]);
   

    setExtraAddresses(userData.addresses || []);

    if (userData.companyId) {
      const companyResponse = await axiosInstance.get<{ data: CompanyType }>(
        `/company/getCompanyById/${userData.companyId}`
      );
      setCompanyName(companyResponse.data.data.companyName || 'N/A');
      setCompanyData(companyResponse.data.data);
    }
  } catch (err) {
    console.error(err);
    setError('Failed to load user details');
  } finally {
    setLoading(false);
  }
};


  // 👇 Now use inside useEffect
  useEffect(() => {
    if (userId) fetchUserDetails();
  }, [userId]);


  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axiosInstance.get<{ data: CompanyType[] }>(
          '/company/getAllCompany?status=0'
        );
        setCompanyList(response.data.data);
      } catch (err) {
        console.error('Failed to fetch company list:', err);
      }
    };

    fetchCompanies();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
const handleUpdateUser = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;

  try {
    // const response = await axiosInstance.put(`/user/updateUser/${user.userId}`, formData);
    const response = await axiosInstance.put(`/user/updateUser/${user.userId}`, formData);

    if (response.data.success) {
      const updatedUser: UserDetailsType = response.data.data;

      // Format createdAt
      const dateOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      updatedUser.createdAt = new Date(updatedUser.createdAt).toLocaleString('en-GB', dateOptions);

      setUser(updatedUser);
      setCompanyName(
        companyList.find(c => c.companyId === updatedUser.companyId)?.companyName || 'N/A'
      );

      setShowSuccess(true);

      setTimeout(() => {
        setShowModal(false);
        setShowSuccess(false);
      }, 2000);

    } else {
      // Instead of console.error, show toast
      if (response.data.message.includes("email already exists")) {
        showToast("User with this email already exists", "error"); // show toast with error styling
      } else {
        showToast(response.data.message || "Update failed", "error");
      }
    }
  } catch (err: any) {
    // Show toast instead of letting network error appear
    if (err.response?.data?.message) {
      showToast(err.response.data.message, "error");
    } else {
      showToast("Failed to update user", "error");
    }
  }
};

  const handleUpdateStatus = async (newStatus: string) => {
    if (!user) return;
    try {
      await axiosInstance.put(`/user/${user.userId}/status`, { status: newStatus });
      setUser(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const handleUpdateConfirmation = async (isConfirmed: boolean) => {
    if (!user) return;
    try {
      await axiosInstance.put(`/user/confirmUser/${user.userId}`, { isConfirmed });
      setUser(prev => prev ? { ...prev, isConfirmed } : null);
    } catch (err) {
      console.error('Failed to update user confirmation status:', err);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading user details...</div>;
  if (error || !user) return <div className="p-6 text-red-500">{error || 'User not found'}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* User Info */}
      <div
        className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 mb-6"
        style={{ backgroundColor: '#fff8ed' }}
      >
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h2 className="text-base font-semibold" style={{ color: '#d99723' }}>
            <User className="w-4 h-4 inline-block mr-2" style={{ color: '#d99723' }} />
            User Info
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-sm hover:bg-green-600"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-10 pt-4 text-sm">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-semibold">{user.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">{user.mobile}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">{user.createdAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              {user.status === 'active' ? (
                <>
                  <span className="text-green-600 text-sm font-semibold underline cursor-pointer">Active</span>
                  <button
                    onClick={() => handleUpdateStatus('inactive')}
                    className="text-white bg-[#f15a29] text-xs font-semibold px-2 py-1 rounded hover:bg-red-600"
                  >
                    De-Activate
                  </button>
                </>
              ) : (
                <>
                  <span className="text-red-600 text-sm font-semibold underline cursor-pointer"> {user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                  <button
                    onClick={() => handleUpdateStatus('active')}
                    className="text-white bg-green-600 text-xs font-semibold px-2 py-1 rounded hover:bg-green-700"
                  >
                    Activate
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-semibold">{user.gender || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">{user.createdAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">{companyName}</span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Building2 className="w-4 h-4 text-gray-600" />
              {user.isConfirmed ? (
                <>
                  <span className="text-green-600 text-sm font-semibold underline cursor-pointer"> Confirmed</span>
                  <button
                    onClick={() => handleUpdateConfirmation(false)}
                    className="text-white bg-[#f15a29] text-xs font-semibold px-2 py-1 rounded hover:bg-red-600"
                  >
                    Not Confirmed
                  </button>
                </>
              ) : (
                <>
                  <span className="text-red-600 text-sm font-semibold underline cursor-pointer"> Not Confirmed</span>
                  <button
                    onClick={() => handleUpdateConfirmation(true)}
                    className="text-white bg-green-600 text-xs font-xs px-2 py-1 rounded hover:bg-green-700"
                  >
                    Confirmed
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

     
      {/* User Address List */}
<div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 mt-6">
  <h2 className="text-base font-semibold text-gray-800 pb-4 border-b border-gray-200">
    User Address List
  </h2>

  <div className="mt-4">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {['Address', 'Present Address', 'Pin Code', 'City', 'State', 'Country', 'Action'].map(
            (head) => (
              <th
                key={head}
                className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {head}
              </th>
            )
          )}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {/* Main User Address */}
        <tr >
          {/* <td className="px-2 py-4 font-semibold text-gray-700"></td> */}
         {/* Address */}
         {/* Present Address */}
<td className="px-2 py-4">
  {user.presentAddress && user.presentAddress.trim() !== ''
    ? user.presentAddress
    : 'Default Address'}
</td>
<td className="px-2 py-4">
  {user.userAddress && user.userAddress.trim() !== ''
    ? user.userAddress
    : 'Default Address'}
</td>



           <td className="px-2 py-4">{user.pinCode || 'N/A'}</td>
          <td className="px-2 py-4">{user.city || 'N/A'}</td>
          <td className="px-2 py-4">{user.state || 'N/A'}</td>
          <td className="px-2 py-4">{user.country || 'N/A'}</td>
          <td className="px-2 py-4">
                      <button
                        onClick={() => setShowCompanyModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-sm hover:bg-green-600">
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    </td>
        </tr>

        {/* Extra Addresses */}
        {extraAddresses.map((addr, index) => (
          <tr key={index}>
              <td className="px-2 py-4">{addr.presentAddress || 'N/A'}</td>
            <td className="px-2 py-4">{addr.userAddress || 'N/A'}</td>
             <td className="px-2 py-4">{addr.pinCode || 'N/A'}</td>
            <td className="px-2 py-4">{addr.city || 'N/A'}</td>
            <td className="px-2 py-4">{addr.state || 'N/A'}</td>
            <td className="px-2 py-4">{addr.country || 'N/A'}</td>
            <td className="px-2 py-4">
                      <button
                        onClick={() => setShowCompanyModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-sm hover:bg-green-600">
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

     

      {showCompanyModal && companyData && user && (
        <EditUserCompanyDetails
          userData={user}
          onClose={() => setShowCompanyModal(false)}
          onSuccess={() => {
            fetchUserDetails();
          }}
        />
      )}

      {/* User Order Summary */}
     {/* User Order Summary */}
<div className="bg-white mt-6 p-6 shadow-sm rounded-lg border border-gray-200">
  <h2 className="text-base font-semibold text-gray-800 pb-4 border-b border-gray-200">
    User Order Summary
  </h2>

  {statsLoading && (
    <div className="text-sm text-gray-500 mt-3">Loading summary…</div>
  )}
  {statsErr && <div className="text-sm text-red-600 mt-3">{statsErr}</div>}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">

    {/* Confirm Pending Orders */}
    <div className="bg-[#4285f4] text-white p-4 rounded shadow flex flex-col justify-between">
      <div>
        <p className="text-sm font-medium">Confirm Pending Orders</p>
        <h2 className="text-2xl font-bold mt-2">
          {stats?.confirmPendingOrder ?? 0}
        </h2>
      </div>
      <div 
      className="text-right text-xs mt-2 underline cursor-pointer"
       onClick={() =>
          navigate("/orders/confirmpending", {
            state: { userId: user?.userId },
          })
        }
      >
        View More</div>
    </div>
    {/* <div className="col-span-2 bg-white border-t-4 border-[#4285f4] p-4 rounded shadow">
      <p className="text-xs text-[#4285f4] font-semibold">CONFIRM PENDING ORDERS AMOUNT</p>
      <h2 className="text-lg font-bold text-[#4285f4] mt-1">{inr(0)}</h2>
    </div> */}

    {/* Close Pending Orders */}
    <div className="bg-[#00bcd4] text-white p-4 rounded shadow flex flex-col justify-between">
      <div>
        <p className="text-sm font-medium">Close Pending Orders</p>
        <h2 className="text-2xl font-bold mt-2">
          {stats?.closedPendingOrder ?? 0}
        </h2>
      </div>
      <div 
      className="text-right text-xs mt-2 underline cursor-pointer"
       onClick={() =>
          navigate("/orders/closepending", {
            state: { userId: user?.userId },
          })
        }
      >View More</div>
    </div>
    {/* <div className="col-span-2 bg-white border-t-4 border-[#00bcd4] p-4 rounded shadow">
      <p className="text-xs text-[#00bcd4] font-semibold">CLOSE PENDING ORDERS AMOUNT</p>
      <h2 className="text-lg font-bold text-[#00bcd4] mt-1">{inr(0)}</h2>
    </div> */}
    </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
    {/* Payment Pending Orders */}
    <div className="bg-[#f15a29] text-white p-4 rounded shadow flex flex-col justify-between">
      <div>
        <p className="text-sm font-medium">Payment Pending Orders</p>
        <h2 className="text-2xl font-bold mt-2">
          {stats?.paymentPendingOrderCount ?? 0}
        </h2>
      </div>
      <div className="text-right text-xs mt-2 underline cursor-pointer"
       onClick={() =>
          navigate("/orders/paymentpending", {
            state: { userId: user?.userId },
          })
        }
      >View More</div>
    </div>
    <div className="col-span-2 bg-white border-t-4 border-[#f15a29] p-4 rounded shadow">
      <p className="text-xs text-[#f15a29] font-semibold">PAYMENT PENDING ORDERS AMOUNT</p>
      <h2 className="text-lg font-bold text-[#f15a29] mt-1">
        {inr(stats?.paymentPendingOrderAmount ?? 0)}
      </h2>
    </div>

    {/* Completed Orders (payments completed) */}
    <div className="bg-[#8664a8] text-white p-4 rounded shadow flex flex-col justify-between">
      <div>
        <p className="text-sm font-medium">Completed Orders</p>
        <h2 className="text-2xl font-bold mt-2">
          {stats?.paymentCompletedOrderCount ?? 0}
        </h2>
      </div>
      <div className="text-right text-xs mt-2 underline cursor-pointer"
       onClick={() =>
          navigate("/orders/completed", {
            state: { userId: user?.userId },
          })
        }
      >View More</div>
    </div>
    <div className="col-span-2 bg-white border-t-4 border-[#8664a8] p-4 rounded shadow">
      <p className="text-xs text-[#8664a8] font-semibold">COMPLETED ORDERS AMOUNT</p>
      <h2 className="text-lg font-bold text-[#8664a8] mt-1">
        {inr(stats?.paymentCompletedOrderAmount ?? 0)}
      </h2>
    </div>



    {/* Invoice Paid */}
    <div className="bg-[#263645] text-white p-4 rounded shadow flex flex-col justify-between">
      <div>
        <p className="text-sm font-medium">Invoice Paid Count</p>
        <h2 className="text-2xl font-bold mt-2">
          {stats?.invoicepaidOrderCount ?? 0}
        </h2>
      </div>
      {/* <div className="text-right text-xs mt-2 underline cursor-pointer">View More</div> */}
    </div>
    <div className="col-span-2 bg-white border-t-4 border-[#263645] p-4 rounded shadow">
      <p className="text-xs text-[#263645] font-semibold">INVOICE PAID AMOUNT</p>
      <h2 className="text-lg font-bold text-[#263645] mt-1">
        {inr(stats?.invoicePaidOrderAmount ?? 0)}
      </h2>
    </div>

    {/* Invoice Pending */}
    <div className="bg-[#f5a623] text-white p-4 rounded shadow flex flex-col justify-between">
      <div>
        <p className="text-sm font-medium">Invoice Pending Count</p>
        <h2 className="text-2xl font-bold mt-2">
          {stats?.invoicePendingOrderCount ?? 0}
        </h2>
      </div>
      {/* <div className="text-right text-xs mt-2 underline cursor-pointer">View More</div> */}
    </div>
    <div className="col-span-2 bg-white border-t-4 border-[#f5a623] p-4 rounded shadow">
      <p className="text-xs text-[#f5a623] font-semibold">INVOICE PENDING AMOUNT</p>
      <h2 className="text-lg font-bold text-[#f5a623] mt-1">
        {inr(stats?.invoicePendingOrderAmount ?? 0)}
      </h2>
    </div>
  </div>
</div>


      {/* Edit Modal */}
      {showModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg relative max-h-[80vh] flex flex-col">

            {/* --- Header (static) --- */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Edit User Info</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showSuccess ? (
              // ✅ Success message section
              <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-scale-in" />
                <h3 className="text-lg font-semibold text-green-600">Successfully Updated!</h3>
                <p className="text-sm text-gray-500 mt-2">User details have been saved.</p>
              </div>
            ) : (
              <>
                {/* --- Scrollable Body --- */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <form id="editUserForm" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <input
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mobile</label>
                      <input
                        name="mobile"
                        type="text"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border rounded"
                      >
                        <option value="">Select</option>
                      <option value="male">Male</option>
<option value="female">Female</option>
<option value="other">Other</option>
                      </select>
                    </div>

               {/* Company */}
<div>
  <label className="block text-sm font-medium text-gray-700">Company</label>
  <select
    name="companyId"
    value={formData.companyId}
    onChange={handleInputChange}
    className="mt-1 block w-full px-3 py-2 border rounded"
  >
    <option value="">Select Company</option>
    {companyList.map((company) => (
      <option key={company.companyId} value={company.companyId}>
        {company.companyName}
      </option>
    ))}
  </select>
</div>

{/* ✅ Is Manager – ONLY for Danfoss */}
{formData.companyId === danfossCompanyId && (
  <div className="flex items-center gap-2 mt-2">
    <input
      type="checkbox"
      checked={formData.isManager}
      onChange={(e) =>
        setFormData(prev => ({
          ...prev,
          isManager: e.target.checked,
        }))
      }
      className="w-4 h-4"
    />
    <label className="text-sm text-gray-700">Is Manager</label>
  </div>
)}
{formData.companyId === danfossCompanyId && (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700">
        User ID
      </label>
      <input
        name="danfossuserId"
        type="text"
        value={formData.danfossuserId}
        onChange={handleInputChange}
        className="mt-1 block w-full px-3 py-2 border rounded"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">
        Manager ID
      </label>
      <input
        name="managerId"
        type="text"
        value={formData.managerId}
        onChange={handleInputChange}
        className="mt-1 block w-full px-3 py-2 border rounded"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">
        Manager Email
      </label>
      <input
        name="managerEmail"
        type="email"
        value={formData.managerEmail}
        onChange={handleInputChange}
        className="mt-1 block w-full px-3 py-2 border rounded"
      />
    </div>
    <div>
  <label className="block text-sm font-medium text-gray-700">
    Cost Center
  </label>
  <input
    name="costCenter"
    type="text"
    value={formData.costCenter}
    onChange={handleInputChange}
    className="mt-1 block w-full px-3 py-2 border rounded"
  />
</div>
  </>
)}

                  </form>
                </div>

                {/* --- Footer (static Save button) --- */}
                <div className="flex justify-end p-4 border-t">
                  <button
                    type="submit"
                    form="editUserForm"
                    onClick={handleUpdateUser}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
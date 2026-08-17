import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../../../components/PageLayout";
import axiosInstance from "../../../../utils/axiosInstance";
import { DataTable, Column } from "../../../../components/DataTable";
import { FileText } from "lucide-react";
import { showToast } from "../../../../components/AlertBox";
import CompanyHeader from "./CompanyHeader";
import TravelHeader from "../header";

type User = {
  userId: string;
  username: string;
  email: string;
  mobile: string;
  country: string;
  city: string;
  createdAt: string;
  status: "active" | "inactive" | "suspended" | "pending";
  isConfirmed: boolean;
  companyId: string;
};

type Company = {
  companyId: string;
  companyName: string;
  companyLogo: string;
};

export default function ManagerUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [formKeyword, setFormKeyword] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [formConfirm, setFormConfirm] = useState("");
  const [formOrderBy, setFormOrderBy] = useState("");

  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedConfirm, setAppliedConfirm] = useState("");
  const [appliedOrderBy, setAppliedOrderBy] = useState("");

  // ✅ Fetch company details by ID
  const fetchCompanyDetails = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        showToast("User not found. Please login again.", "error");
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const companyId = parsedUser?.companyId;

      if (!companyId) {
        showToast("Company ID not found in user data.", "error");
        return;
      }

      const response = await axiosInstance.get(`/company/getCompanyById/${companyId}`);
      if (response.data?.data) {
        setCompany(response.data.data);
        console.log("🏢 Company Data:", response.data.data);
      }
    } catch (error: any) {
      console.error("❌ Error fetching company:", error);
      showToast("Failed to load company details.", "error");
    }
  };

  // ✅ Fetch users via getUsersManager API
  const fetchUsers = async () => {
    console.log("🔥 fetchUsers CALLED - Starting API call...");
    setLoading(true);

    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        showToast("User not found. Please login again.", "error");
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser?.userId;
      if (!userId) {
        showToast("Invalid user data.", "error");
        setLoading(false);
        return;
      }

      const apiUrl = `/user/${userId}/getUsersManager`;
      const response = await axiosInstance.get(apiUrl);

      let userData = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        userData = response.data.data;
      } else if (Array.isArray(response.data)) {
        userData = response.data;
      }

      if (userData.length > 0) {
        setUsers(userData);
        showToast(`Successfully loaded ${userData.length} users`, "success");
      } else {
        setUsers([]);
        showToast("No users found for this manager", "info");
      }
    } catch (error: any) {
      console.error("❌ ERROR in fetchUsers:", error);
      showToast("Failed to load users. Please try again.", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Trigger both API calls on mount
  useEffect(() => {
    fetchCompanyDetails();
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter((user) =>
      appliedKeyword
        ? user.username?.toLowerCase().includes(appliedKeyword.toLowerCase()) ||
          user.email?.toLowerCase().includes(appliedKeyword.toLowerCase())
        : true
    )
    .filter((user) => (appliedStatus ? user.status === appliedStatus : true))
    .filter((user) =>
      appliedConfirm
        ? appliedConfirm === "Yes"
          ? user.isConfirmed
          : !user.isConfirmed
        : true
    )
    .sort((a, b) => {
      if (appliedOrderBy === "name") {
        return a.username.localeCompare(b.username);
      } else if (appliedOrderBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  const columns: Column<User>[] = [
    {
      header: "User Name",
      accessor: "username",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-800">{row.username}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Register Date",
      accessor: "createdAt",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "Is Confirmed",
      accessor: "isConfirmed",
      render: (row) => (row.isConfirmed ? "Yes" : "No"),
    },
    { header: "Country", accessor: "country" },
    { header: "City", accessor: "city" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            row.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-200 text-gray-600"
          } capitalize`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <>

      <TravelHeader />
      {/* ✅ Dynamic Company Header Section */}
      {/* <div className="flex items-center gap-4 bg-white shadow-md rounded-xl px-6 py-4 mb-6">
        {company?.companyLogo ? (
          <img
            src={`http://localhost:5000/uploads/companyLogo/${company.companyLogo}`}
            alt="Company Logo"
            className="w-14 h-14 object-contain rounded-md border"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="w-14 h-14 bg-gray-200 rounded-md animate-pulse" />
        )}
        <h2 className="text-2xl font-bold text-gray-800 tracking-wide">
          {company?.companyName || "Loading Company..."}
        </h2>
      </div> */}

      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Managed Users</h1>
        </div>

        {/* 📋 DataTable */}
        <div className="bg-white rounded shadow-sm">
          <DataTable<User>
            columns={columns}
            data={filteredUsers}
            loading={loading}
            rowsPerPage={10}
            emptyMessage="No users found. Please ensure you are logged in as a manager."
onView={(row) => navigate(`/users/userdetails/${row.userId}`)} 
          />
        </div>
      </div>
    </>
  );
}
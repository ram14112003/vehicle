import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../utils/axiosInstance";
import { showToast } from "../../../../components/AlertBox";
import { LogOut } from "lucide-react";

type Company = {
  companyId: string;
  companyName: string;
  companyLogo: string;
};

export default function CompanyHeader() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

 const SEO = localStorage.getItem("seoUrl");
  // ✅ Fetch company details
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
      }
    } catch (error: any) {
      console.error("❌ Error fetching company:", error);
      showToast("Failed to load company details.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout handler
 const handleLogout = () => {
  const SEO = localStorage.getItem("seoUrl");
  localStorage.clear();
  showToast("Logged out successfully.", "success");

  if (SEO) {
    navigate(`/company/${SEO}`);
  } else {
    navigate("/adminlogin"); // fallback if no SEO found
  }
};


  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  // ✅ Loading skeleton
  if (loading) {
    return (
      <div className="flex items-center justify-between bg-white shadow-md rounded-xl px-6 py-4 mb-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-200 rounded-md" />
          <div className="h-6 bg-gray-200 w-40 rounded" />
        </div>
        <div className="w-20 h-8 bg-gray-200 rounded-md" />
      </div>
    );
  }

  // ✅ If no company found
  if (!company) return null;

  // ✅ FIX: make sure image path is correct (use backend base URL)
  const logoUrl = company.companyLogo
    ? company.companyLogo.startsWith("http")
      ? company.companyLogo
      : `https://gracecabs.com/uploads/companyLogo/${company.companyLogo}`
    : "";

  return (
    <div className="flex items-center justify-between bg-white shadow-md rounded-xl px-6 py-4 mb-6">
      {/* Left side: company info */}
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Company Logo"
            className="w-14 h-14 object-contain rounded-md border"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              console.warn("⚠️ Company logo not found:", logoUrl);
            }}
          />
        ) : (
          <div className="w-14 h-14 bg-gray-200 rounded-md" />
        )}

        <h2 className="text-2xl font-bold text-gray-800 tracking-wide">
          {company.companyName || "Company"}
        </h2>
      </div>

      {/* Right side: Logout button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
}

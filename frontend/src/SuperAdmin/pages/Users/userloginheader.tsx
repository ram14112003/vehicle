import React from "react";
import { Mail, Phone } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import config from "../../../../src/config/config";
import gracelogo from "../../../assets/logo.png";

type CompanyData = {
  companyId: string;
  companyName: string;
  companyLogo: string;
  seoUrl: string;
};

const UserLoginHeader: React.FC<{ companyData: CompanyData | null }> = ({ companyData }) => {
  const BASE_URL = config.baseurl.apibaseurl;
  const { seoUrl } = useParams();   // for redirect

  const logoSrc =
    companyData?.companyLogo
      ? `${BASE_URL}/uploads/companyLogo/${companyData.companyLogo}`
      : null;

  return (
    <header className="w-full bg-white shadow-sm">
      
      {/* 🔝 Top bar */}
      <div className="w-full bg-[#f8f9fa] border-b border-gray-200 text-sm">
        <div className="container mx-auto px-4 py-1 flex justify-between items-center text-gray-700">
          <div className="flex items-center space-x-2">
            <Mail size={14} className="text-green-600" />
            <span className="text-[13px]">traveldesk@gracecabs.com</span>
          </div>

          <div className="flex items-center space-x-2">
            <Phone size={14} className="text-green-600" />
            <span className="text-[13px]">+91 98417 22675</span>
          </div>
        </div>
      </div>

      {/* 🟢 Logo Row */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* ✅ LEFT SIDE – PLATFORM LOGO (DO NOT REMOVE) */}
        <div>
          <Link to={`/company/${seoUrl}`}>
            <img
              src={gracelogo}
              alt="Platform Logo"
              className="h-12 object-contain cursor-pointer"
            />
          </Link>
        </div>

        {/* ✅ RIGHT SIDE – COMPANY LOGO (API BASED) */}
        <div>
          {logoSrc && (
            <img
              src={logoSrc}
              alt={companyData?.companyName || "Company Logo"}
              className="w-[160px] h-[60px] object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </div>

      </div>
    </header>
  );
};

export default UserLoginHeader;
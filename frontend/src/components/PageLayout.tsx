import React from "react";
import { useLocation, Link } from "react-router-dom";

interface PageLayoutProps {
  children: React.ReactNode;
  breadcrumbName?: string; // 👈 Add here
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, breadcrumbName }) => {
  const location = useLocation();

  const generateBreadcrumb = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);

    return [
      <Link key="home" to="/dashboard" className="text-blue-500 hover:underline">
        Home
      </Link>,
      ...pathnames.map((value, index) => {
        const isLast = index === pathnames.length - 1;
        const label = isLast && breadcrumbName ? breadcrumbName : decodeURIComponent(value);

        return (
          <span key={index} className="text-gray-600 capitalize">
            {" / "}
            {label}
          </span>
        );
      }),
    ];
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start">
      <div className="w-full max-w-7xl bg-white rounded-lg shadow-md p-6 ">
        <div className=" text-sm text-gray-700">{generateBreadcrumb()}</div>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;


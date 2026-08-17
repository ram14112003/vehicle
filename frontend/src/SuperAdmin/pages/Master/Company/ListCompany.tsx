import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../../../components/PageLayout";
import axiosInstance from "../../../../utils/axiosInstance";
import { showToast } from "../../../../components/AlertBox";

// ✅ Common components
import { DataTable, Column } from "../../../../components/DataTable";
import CommonButton from "../../../../components/CommonButton";
import SearchBar from "../../../../components/SearchBar";
import TrashToggleButton from "../../../../components/TrashToggleButton";

type Company = {
  companyId: string;
  companyName: string;
  seoUrl: string;
  allowTax: string;
  isDeleted: boolean;
   companyLogo?: string;
};

const ListCompany: React.FC = () => {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [showTrashed, setShowTrashed] = useState(false);
  const [deletePopupOpen, setDeletePopupOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
const [loading, setLoading] = useState(false);
  /** Fetch companies */
  const fetchCompanies = useCallback(async () => {
     setLoading(true);
    try {
      const isDeletedParam = showTrashed ? 1 : 0;
      const { data } = await axiosInstance.get<{ data: Company[] }>(
        `/company/getAllCompany?status=${isDeletedParam}`
      );
      setCompanies(data.data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }finally {
      setLoading(false);
    }
  }, [showTrashed]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  /** Edit */
  const handleEdit = (company: Company) => {
    navigate(`/company/edit/${company.companyId}`, { state: company });
  };

  /** Delete ask */
  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setDeletePopupOpen(true);
  };

 

  const confirmDelete = async () => {
  if (!selectedCompany) return;
  try {
    await axiosInstance.delete(`/company/companyDelete/${selectedCompany.companyId}`);
    showToast("Company moved to trash successfully!", "success");
    setDeletePopupOpen(false);
    
    // Fetch the correct list based on current toggle
    fetchCompanies();
  } catch (error) {
    console.error("Error deleting company:", error);
  }
};

  /** Restore */
  const handleActivate = async (company: Company) => {
    try {
      await axiosInstance.put(
        `/company/companyRestore/${company.companyId}`
      );
      showToast("Company restored successfully!", "success");
      fetchCompanies();
    } catch (error) {
      console.error("Error restoring company:", error);
    }
  };

  /** Search */
  const handleSearch = async () => {
    try {
      if (!searchKeyword.trim()) {
        fetchCompanies();
        return;
      }
      const isDeletedParam = showTrashed ? 1 : 0;
      const { data } = await axiosInstance.get<Company[]>(
        `/globalsearch?model=company&keyword=${encodeURIComponent(
          searchKeyword
        )}&isDeleted=${isDeletedParam}`
      );
      // API returns array directly
      setCompanies(data || []);
    } catch (error) {
      console.error("Error searching companies:", error);
    }
  };

  /** Columns for DataTable */
/** Columns for DataTable */
const columns: Column<Company>[] = [
  { header: "Company Name", accessor: "companyName" },
{
  header: "SEO URL",
  accessor: "seoUrl",
  render: (row: Company) => {
    const fullSeoUrl = `${process.env.REACT_APP_SEO_BASE_URL}${row.seoUrl}`;

    const handleSeoClick = () => {
      localStorage.setItem("companyId", row.companyId);
      localStorage.setItem("companyName", row.companyName);

      // ✅ IMPORTANT
      if (row.companyLogo) {
        localStorage.setItem("companyLogo", row.companyLogo);
      }
    };

    return (
      <a
        href={fullSeoUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleSeoClick}
        className="text-blue-600 hover:underline"
      >
        {fullSeoUrl}
      </a>
    );
  },
},

  { header: "Allow Tax", accessor: "allowTax" },
];

  return (
    <PageLayout>
      <div className="py-6">
        <h1 className="text-3xl font-bold">
          List Company {showTrashed ? "- (Trashed)" : ""}
        </h1>

        <main className="flex-1 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            {/* ✅ Common SearchBar */}
            <SearchBar
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              placeholder="Keywords (Company)"
            />

            {/* ✅ Common TrashToggleButton */}
            <TrashToggleButton
              showTrashed={showTrashed}
              onToggle={() => setShowTrashed((prev) => !prev)}
            />
          </div>

         
            <DataTable
              key={searchKeyword + showTrashed + companies.length}
              columns={columns}
              data={companies}
              loading={loading} // Show loading if no companies fetched
              onEdit={!showTrashed ? handleEdit : undefined}
              onDelete={!showTrashed ? handleDelete : undefined}
              onRestore={showTrashed ? handleActivate : undefined}
              rowsPerPage={5}
            />
          
        </main>

        {/* ✅ Delete Confirmation Modal (CommonButton used) */}
        {deletePopupOpen && selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4 text-red-600">
                Delete Company
              </h2>
              <p className="text-gray-700 mb-6">
                Bookings on this company also cancelled, Are you sure you want to delete{" "}
                <strong>{selectedCompany.companyName}</strong>?
              </p>
              <div className="mt-4 flex gap-2 justify-end">
                <CommonButton
                  onClick={() => setDeletePopupOpen(false)}
                  variant="secondary"
                >
                  Cancel
                </CommonButton>
                <CommonButton onClick={confirmDelete} variant="danger">
                  Confirm
                </CommonButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ListCompany;

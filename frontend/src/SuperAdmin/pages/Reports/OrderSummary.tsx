
import React, { useEffect, useState } from 'react';
import PageLayout from '../../../components/PageLayout';
import { DataTable, Column } from '../../../components/DataTable';
import InputBox from '../../../components/InputBox';
import SearchBar from '../../../components/SearchBar';
import axiosInstance from '../../../utils/axiosInstance';

// 🔠 Column Definitions
type TableRow = {
  companyName: string;
  totalDue:number;
  totalAmount: number;
  paidAmount: number;
  taxAmount: number;
  pendingAmount: number;
};

const columns: Column<TableRow>[] = [
  { header: 'Company Name', accessor: 'companyName' },
  { header: 'Total Amount (₹)', accessor: 'totalDue' },
  { header: 'Paid Amount (₹)', accessor: 'paidAmount' },
  { header: 'Tax Amount (₹)', accessor: 'taxAmount' },
  { header: 'Pending Amount (₹)', accessor: 'pendingAmount' },
];

const OrderSummary: React.FC = () => {
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    tax: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/invoiceRoutes/summary');
      if (res.data.success) {
        const companies = res.data.data || [];

        // format table data
        setTableData(companies);

        // calculate overall summary
const total = companies.reduce((acc: number, c: any) => acc + Number(c.totalDue || 0), 0);
        const paid = companies.reduce((acc: number, c: any) => acc + Number(c.paidAmount || 0), 0);
        const tax = companies.reduce((acc: number, c: any) => acc + Number(c.taxAmount || 0), 0);
        const pending = companies.reduce((acc: number, c: any) => acc + Number(c.pendingAmount || 0), 0);

        setSummary({ total, paid, tax, pending });
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSearch = () => {
    console.log("Search clicked");
    // 🔍 if needed, call fetchSummary with filters
  };

  return (
    <PageLayout>
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Order Summary</h1>

        {/* 🔍 Filter Section */}
        <div className="flex items-end space-x-6 mb-8">
          <InputBox
            name="orderDateRange"
            label="Order Date Range"
            type="date-range"
          />
          <div className="pb-4">
            <SearchBar onlyButton onSearch={handleSearch} />
          </div>
        </div>

        {/* 📋 Data Table */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable columns={columns} data={tableData} rowsPerPage={5} />
        )}

        {/* 📦 Summary Section */}
        <div className="flex justify-end mt-8">
          <div className="text-sm bg-gray-50 rounded p-4 w-80">
            <div className="flex justify-between mb-1">
              <span>Total Amount:</span>
              <span className="font-semibold">₹ {summary.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Total Paid Amount:</span>
              <span className="font-semibold">₹ {summary.paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Total Tax Amount:</span>
              <span className="font-semibold">₹ {summary.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Pending Amount:</span>
              <span className="font-semibold">₹ {summary.pending.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default OrderSummary;

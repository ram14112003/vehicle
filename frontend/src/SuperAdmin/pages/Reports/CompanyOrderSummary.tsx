import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '../../../components/PageLayout';
import { DataTable, Column } from '../../../components/DataTable';
import InputBox, { getFormStore } from '../../../components/InputBox';
import SearchBar from '../../../components/SearchBar';
import axiosInstance from '../../../utils/axiosInstance';

type OrderSummaryRow = {
  orderDate?: string;
  company?: string;
  pickupPoint?: string;
  paidOrderCount?: number;
  paidOrderAmount?: string;
  pendingOrderCount?: number;
  pendingOrderAmount?: string;
  cancelOrderCount?: number;
  cancelOrderAmount?: string;
};

const columns: Column<OrderSummaryRow>[] = [
  { header: 'Period', accessor: 'orderDate' },
  { header: 'Company Name', accessor: 'company' },
  { header: 'Pickup Point', accessor: 'pickupPoint' },
  { header: 'Paid Order Count', accessor: 'paidOrderCount' },
  { header: 'Paid Order Amount (Rs)', accessor: 'paidOrderAmount' },
  { header: 'Pending Order Count', accessor: 'pendingOrderCount' },
  { header: 'Pending Order Amount (Rs)', accessor: 'pendingOrderAmount' },
  { header: 'Cancel Order Count', accessor: 'cancelOrderCount' },
  { header: 'Cancel Order Amount (Rs)', accessor: 'cancelOrderAmount' },
];

const pickupPoints = [
  { value: '', label: 'All Pickup Points' },
  { value: 'Local city use', label: 'Local city use' },
  { value: 'Outstation ', label: 'Outstation ' },
];

const dateFilters = [
  { value: 'date', label: 'Date Wise' },
  { value: 'month', label: 'Month Wise' },
  { value: 'week', label: 'Week Wise' },
  { value: 'year', label: 'Year Wise' },
];

const CompanyOrderSummary: React.FC = () => {
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [filteredData, setFilteredData] = useState<OrderSummaryRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
const filterBoxRef = useRef<HTMLDivElement | null>(null);

  // ✅ Fetch companies from API
  useEffect(() => {
    axiosInstance
      .get('/company/getAllCompany?status=0') // active companies only
      .then((res) => {
        const companyOptions = res.data.data.map((c: any) => ({
          value: c.companyId,      // use companyId for backend
          label: c.companyName,    // show companyName in dropdown
        }));
        setCompanies(companyOptions);
      })
      .catch((err) => console.error("Error fetching companies:", err));
  }, []);

  // ✅ API call to fetch company booking report
  const fetchCompanyBookingReport = async (filters: any) => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters
      const params: any = {
        companyId: filters.company,
        period: filters.dateFilter,
      };

      // Add pickup point filter if selected
      if (filters.pickupPoint) {
        params.pickupPoint = filters.pickupPoint;
      }

      // Add date range if provided (for date filter)
      if (filters.orderDateRange && filters.dateFilter === 'date') {
        const [from, to] = filters.orderDateRange.split(' - ');
        if (from && to) {
          // Convert date format from DD/MM/YYYY to YYYY-MM-DD
          const fromDate = from.split('/').reverse().join('-');
          const toDate = to.split('/').reverse().join('-');
          params.from = fromDate;
          params.to = toDate;
        }
      }

     

      const response = await axiosInstance.get('/order/companyBookingReport', { params });

      if (response.data.success) {
        // Get selected company name for display
        const selectedCompany = companies.find(c => c.value === filters.company);
        const companyName = selectedCompany?.label || 'Unknown Company';

        // Transform API response to match table structure
        const transformedData = response.data.data.map((item: any) => ({
          orderDate: item.period,
          company: companyName,
          pickupPoint: item.pickupPoint || 'All',
          paidOrderCount: item.paidOrderCount,
          paidOrderAmount: `₹${item.paidOrderAmount.toFixed(2)}`,
          pendingOrderCount: item.pendingOrderCount,
          pendingOrderAmount: `₹${item.pendingOrderAmount.toFixed(2)}`,
          cancelOrderCount: item.cancelOrderCount,
          cancelOrderAmount: `₹${item.cancelOrderAmount.toFixed(2)}`,
        }));

        setFilteredData(transformedData);
        
      } else {
        setError(response.data.message || 'Failed to fetch data');
        setFilteredData([]);
      }
    } catch (error: any) {
      console.error('API Error:', error);
      setError(error.response?.data?.message || 'Failed to fetch company booking report');
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

 const handleSearch = async () => {
  if (loading) return;

  const { company, pickupPoint, dateFilter, orderDateRange } = getFormStore();
  setError('');

  // ✅ Company validation
  if (!company) {
    setError('Company is required');
    return;
  }

  // ❌ Remove validation for dateFilter itself
  // if (!dateFilter) {
  //   setError('Date Filter is required');
  //   return;
  // }

  // ✅ Add validation only for Order Date Range
  if (dateFilter === 'date') {
    if (!orderDateRange) {
      setError('Order Date Range is required for Date Wise filter');
      return;
    }
    const [from, to] = orderDateRange.split(' - ');
    if (!from || !to) {
      setError('Both From Date and To Date are required');
      return;
    }
  }

  setSearched(true);

  const filters = { company, pickupPoint, dateFilter, orderDateRange };
 

  await fetchCompanyBookingReport(filters);
};

useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;

    const active = document.activeElement as HTMLElement | null;

    // ✅ run search only when focus is inside this filter UI
    if (filterBoxRef.current && active && filterBoxRef.current.contains(active)) {
      e.preventDefault();
      handleSearch();
    }
  };

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [loading, companies]); 

  return (
    <PageLayout>
      <div ref={filterBoxRef} className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Company Order Summary</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* First Line */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {/* ✅ Company dropdown using ListCompany API */}
          <InputBox 
          // label="Select a Company"
          label={
    <>
     Select a Company <span className="text-red-500">*</span>
    </>
  }
           name="company" 
           options={companies} 
           />
          <InputBox label="Pickup Point" name="pickupPoint" options={pickupPoints} />
          <InputBox label="Date Filter" name="dateFilter" options={dateFilters} />
        </div>

        {/* Second Line */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-end">
          <InputBox label="Order Date Range" name="orderDateRange" type="date-range" />
          <div className="flex items-end h-full">
            <SearchBar onlyButton onSearch={handleSearch} />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-blue-500 py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading company booking report...</p>
          </div>
        )}

        {/* Data Table */}
        <div className="mt-8">
          {!loading && searched && filteredData.length === 0 ? (
            <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
              <p className="text-lg">No data found for the selected filters.</p>
              <p className="text-sm mt-2">Try adjusting your search criteria.</p>
            </div>
          ) : (
            !loading && searched && (
              <div>
                <div className="mb-4 text-sm text-gray-600">
                  Found {filteredData.length} record(s)
                </div>
                <DataTable columns={columns} data={filteredData} rowsPerPage={10} />
              </div>
            )
          )}
          
          {/* Show table with empty state when not searched yet */}
          {!searched && !loading && (
            <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
              <p className="text-lg">Select filters and click search to view company booking report.</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CompanyOrderSummary;
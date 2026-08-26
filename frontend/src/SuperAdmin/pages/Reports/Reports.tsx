import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Car,
  User,
  Users,
  IdCard,
  MapPin,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import config from '../../../config/config';

interface SummaryData {
  totalBookings: number;
  completedTrips: number;
  cancelledTrips: number;
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  outstandingBalance: number;
  totalDistanceKm: number;
}

interface BookingRow {
  bookingId: string;
  bookingCode: string;
  createdAt: string;
  bookingDate: string;
  bookingTime: string;
  pickup: string;
  drop: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  driverName: string;
  driverPhone: string;
  vehicleName: string;
  vehicleNumber: string;
  distanceKm: number;
  baseFare: number;
  perKmRate: number;
  finalFare: number;
  paidAmount: number;
  balance: number;
  paymentStatus: string;
  bookingStatus: string;
  driverTripStatus: string;
  paymentMethod: string;
  transactionId: string;
}

interface CustomerRow {
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  outstandingBalance: number;
}

interface DriverRow {
  driverId: string;
  driverName: string;
  driverPhone: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalTripAmount: number;
  totalPaid: number;
  totalPending: number;
}

interface VehicleRow {
  vehicleName: string;
  vehicleNumber: string;
  totalTrips: number;
  totalDistance: number;
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
}


const Reports: React.FC = () => {
  const BASE_URL = config.baseurl.apibaseurl || 'http://localhost:5000';

  // Tabs
  const [activeTab, setActiveTab] = useState<'bookings' | 'customers' | 'drivers' | 'vehicles'>('bookings');

  // Summary State
  const [summary, setSummary] = useState<SummaryData>({
    totalBookings: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalRevenue: 0,
    totalPaid: 0,
    totalPending: 0,
    outstandingBalance: 0,
    totalDistanceKm: 0
  });

  // Filter States
  const [datePreset, setDatePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [bookingStatus, setBookingStatus] = useState<string>('ALL');
  const [paymentStatus, setPaymentStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data States
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);

  // Pagination for Bookings
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const limit = 10;

  // Loading States
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState<boolean>(false);
  const [loadingInvoice, setLoadingInvoice] = useState<boolean>(false);

  // Customer History Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [customerHistory, setCustomerHistory] = useState<BookingRow[]>([]);
  const [customerModalOpen, setCustomerModalOpen] = useState<boolean>(false);
  const [loadingCustomerHistory, setLoadingCustomerHistory] = useState<boolean>(false);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const params: any = { datePreset, bookingStatus, paymentStatus };
      if (datePreset === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get(`${BASE_URL}/api/reports/summary`, { params });
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, [BASE_URL, datePreset, startDate, endDate, bookingStatus, paymentStatus, searchTerm]);

  // Fetch Bookings Report
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        datePreset,
        bookingStatus,
        paymentStatus
      };
      if (datePreset === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get(`${BASE_URL}/api/reports/bookings`, { params });
      if (res.data?.success) {
        setBookings(res.data.data.bookings || []);
        setTotalPages(res.data.data.totalPages || 1);
        setTotalRecords(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch bookings report:', err);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, page, limit, datePreset, startDate, endDate, bookingStatus, paymentStatus, searchTerm]);

  // Fetch Customer Report
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { datePreset, bookingStatus, paymentStatus };
      if (datePreset === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get(`${BASE_URL}/api/reports/users`, { params });
      if (res.data?.success) {
        setCustomers(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch customers report:', err);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, datePreset, startDate, endDate, bookingStatus, paymentStatus, searchTerm]);

  // Fetch Driver Report
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { datePreset, bookingStatus, paymentStatus };
      if (datePreset === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get(`${BASE_URL}/api/reports/drivers`, { params });
      if (res.data?.success) {
        setDrivers(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch drivers report:', err);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, datePreset, startDate, endDate, bookingStatus, paymentStatus, searchTerm]);

  // Fetch Vehicle Report
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { datePreset, bookingStatus, paymentStatus };
      if (datePreset === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get(`${BASE_URL}/api/reports/vehicles`, { params });
      if (res.data?.success) {
        setVehicles(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles report:', err);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, datePreset, startDate, endDate, bookingStatus, paymentStatus, searchTerm]);

  // Trigger Data Fetch based on active tab
  useEffect(() => {
    fetchSummary();
    if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'drivers') {
      fetchDrivers();
    } else if (activeTab === 'vehicles') {
      fetchVehicles();
    }
  }, [activeTab, fetchSummary, fetchBookings, fetchCustomers, fetchDrivers, fetchVehicles]);

  // Handle Preset Change
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    setPage(1);
    if (preset !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setBookingStatus('ALL');
    setPaymentStatus('ALL');
    setSearchTerm('');
    setPage(1);
  };

  // Open Invoice View
  const handleViewInvoice = async (bookingId: string) => {
    setLoadingInvoice(true);
    setInvoiceModalOpen(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/reports/invoice/${bookingId}`);
      if (res.data?.success) {
        setSelectedInvoice(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load invoice:', err);
    } finally {
      setLoadingInvoice(false);
    }
  };

  // Open Customer Booking History Modal
  const handleViewCustomerHistory = async (customer: CustomerRow) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(true);
    setLoadingCustomerHistory(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/reports/users/${customer.userId}/bookings`);
      if (res.data?.success) {
        setCustomerHistory(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load customer history:', err);
    } finally {
      setLoadingCustomerHistory(false);
    }
  };

  // Generate & Download PDF Invoice
  const handleDownloadPdf = (inv: any) => {
    if (!inv) return;
    const doc = new jsPDF();

    // EasyRide Brand Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(245, 158, 11); // amber-500
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('EasyRide', 14, 22);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Ride & Cab Management System', 14, 30);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TRIP INVOICE', 150, 24);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice Date: ${inv.invoiceDate}`, 150, 31);

    // Booking & Customer Details
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Booking Information', 14, 52);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Booking ID: ${inv.bookingCode}`, 14, 60);
    doc.text(`Booking Date: ${inv.bookingDate} at ${inv.bookingTime}`, 14, 66);
    doc.text(`Vehicle: ${inv.vehicleName || inv.vehicle?.name}`, 14, 72);
    doc.text(`Vehicle No: ${inv.vehicleNumber || inv.vehicle?.vehicleNumber || 'Not Added'}`, 14, 78);
    doc.text(`Assigned Driver: ${inv.driverName} (Ph: ${inv.driverPhone})`, 14, 84);

    doc.setFont('helvetica', 'bold');
    doc.text('Customer Details', 115, 52);

    doc.setFont('helvetica', 'normal');
    doc.text(`Customer: ${inv.customerName}`, 115, 60);
    doc.text(`Phone: ${inv.customerPhone}`, 115, 66);
    doc.text(`Email: ${inv.customerEmail}`, 115, 72);
    doc.text(`Payment Status: ${inv.paymentStatus}`, 115, 78);

    // Route Table
    autoTable(doc, {
      startY: 92,
      head: [['Trip Route', 'Pickup Location', 'Drop Location', 'Distance (km)']],
      body: [['One Way', inv.pickup, inv.drop, `${inv.distanceKm} km`]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });


    // Fare Breakdown Table
    const finalY = (doc as any).lastAutoTable.finalY || 110;
    autoTable(doc, {
      startY: finalY + 6,
      head: [['Fare Item', 'Description', 'Amount (INR)']],
      body: [
        ['Base Fare', 'Standard base charge for booking', `Rs. ${inv.baseFare}`],
        ['Distance Charges', `${inv.distanceKm} km @ rate/km`, `Rs. ${inv.distanceCharge}`],
        ['Total Final Fare', 'Complete calculated trip fare', `Rs. ${inv.finalFare}`],
        ['Paid Amount', `Paid via ${inv.paymentMethod || 'Online'}`, `Rs. ${inv.paidAmount}`],
        ['Outstanding Balance', 'Amount pending', `Rs. ${inv.balance}`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });

    const table2FinalY = (doc as any).lastAutoTable.finalY || 170;

    // Payment Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, table2FinalY + 8, 182, 24, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, table2FinalY + 8, 182, 24, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Summary:', 20, table2FinalY + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${inv.paymentStatus}   |   Method: ${inv.paymentMethod}   |   Transaction ID: ${inv.transactionId}`, 20, table2FinalY + 26);

    // Footer
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('Thank you for choosing EasyRide. For support, reach out to support@easyride.in', 14, 280);

    doc.save(`EasyRide_Invoice_${inv.bookingCode}.pdf`);
  };

  // Export Filtered Excel or Multi-Sheet Workbook
  const handleExportExcel = async (mode: 'bookings' | 'overall' | 'customer', userId?: string) => {
    setExporting(true);
    try {
      const params: any = {
        mode,
        datePreset,
        bookingStatus,
        paymentStatus
      };
      if (datePreset === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (searchTerm) params.search = searchTerm;
      if (userId) params.userId = userId;

      const res = await axios.get(`${BASE_URL}/api/reports/export-excel`, {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EasyRide_Report_${mode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel report:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <TrendingUp className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">EasyRide Reports & Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Real-time database-driven financial and operational ride intelligence</p>
        </div>

        {/* Global Export Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleExportExcel('bookings')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Export Bookings (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExportExcel('overall')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Multi-Sheet Report</span>
          </button>
        </div>
      </div>

      {/* 1. Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bookings</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{summary.totalBookings}</h3>
            <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold">
              <span className="text-emerald-600 flex items-center gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {summary.completedTrips} Done
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-rose-600 flex items-center gap-0.5">
                <XCircle className="w-3.5 h-3.5" /> {summary.cancelledTrips} Cancelled
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">₹{summary.totalRevenue.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">Excludes cancelled rides</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Amount Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Amount Collected</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">₹{summary.totalPaid.toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-2">Verified successful payments</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">₹{summary.outstandingBalance.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">Pending collection</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Unified Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Date Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  datePreset === p.id
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>

        {/* Custom Date Pickers if active */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Dropdown Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search booking ID, customer, route..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50/50"
            />
          </div>

          {/* Booking Status Filter */}
          <select
            value={bookingStatus}
            onChange={e => {
              setBookingStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
          >
            <option value="ALL">All Booking Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="DRIVER_ASSIGNED">Driver Assigned</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentStatus}
            onChange={e => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Distance summary indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 text-xs">
            <span className="font-bold text-slate-500">Fleet Distance:</span>
            <span className="font-black text-slate-900">{summary.totalDistanceKm} km</span>
          </div>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'bookings'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Bookings Report</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'customers'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'drivers'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <IdCard className="w-4 h-4" />
          <span>Driver Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'vehicles'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Vehicle Reports</span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: BOOKINGS REPORT */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-200 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Route</th>
                  <th className="py-3.5 px-4">Driver & Vehicle</th>
                  <th className="py-3.5 px-4 text-right">Fare (₹)</th>
                  <th className="py-3.5 px-4 text-right">Paid (₹)</th>
                  <th className="py-3.5 px-4 text-right">Balance (₹)</th>
                  <th className="py-3.5 px-4 text-center">Payment</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                        <span>Loading bookings report...</span>
                      </div>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 font-bold">
                      No bookings found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b.bookingId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-black text-slate-900">{b.bookingCode}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        <div>{b.bookingDate ? String(b.bookingDate).split('T')[0] : String(b.createdAt).split('T')[0]}</div>
                        <div className="text-[10px] text-slate-400">{b.bookingTime || 'Scheduled'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.customerName}</div>
                        <div className="text-[11px] text-slate-400">{b.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="truncate font-semibold text-slate-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {b.pickup}
                        </div>
                        <div className="truncate text-slate-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> {b.drop}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{b.driverName}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">{b.vehicleName} {b.vehicleNumber && b.vehicleNumber !== 'N/A' && b.vehicleNumber !== 'Not Added' ? `(${b.vehicleNumber})` : '(No: Not Added)'}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{b.finalFare.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{b.paidAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">₹{b.balance.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            b.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            b.bookingStatus === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : b.bookingStatus === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleViewInvoice(b.bookingId)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{totalPages}</span> ({totalRecords} records)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold transition disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold transition disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMERS REPORT */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm">Customer Activity & Financial Overview</h3>
            <span className="text-xs text-slate-400 font-semibold">{customers.length} Customers Found</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-200 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 text-center">Total Rides</th>
                  <th className="py-3.5 px-4 text-center">Completed</th>
                  <th className="py-3.5 px-4 text-center">Cancelled</th>
                  <th className="py-3.5 px-4 text-right">Total (₹)</th>
                  <th className="py-3.5 px-4 text-right">Paid (₹)</th>
                  <th className="py-3.5 px-4 text-right">Pending (₹)</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-bold">
                      No customer reports found.
                    </td>
                  </tr>
                ) : (
                  customers.map(c => (
                    <tr key={c.userId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.customerName}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{c.customerPhone}</td>
                      <td className="py-3 px-4 text-slate-500">{c.customerEmail}</td>
                      <td className="py-3 px-4 text-center font-bold">{c.totalBookings}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{c.completedBookings}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">{c.cancelledBookings}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">₹{c.totalAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{c.totalPaid.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">₹{c.outstandingBalance.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleViewCustomerHistory(c)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition"
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DRIVERS REPORT */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm">Driver Performance & Earnings Summary</h3>
            <span className="text-xs text-slate-400 font-semibold">{drivers.length} Drivers Found</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-200 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Driver Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4 text-center">Total Trips</th>
                  <th className="py-3.5 px-4 text-center">Completed</th>
                  <th className="py-3.5 px-4 text-center">Cancelled</th>
                  <th className="py-3.5 px-4 text-right">Trip Revenue (₹)</th>
                  <th className="py-3.5 px-4 text-right">Paid (₹)</th>
                  <th className="py-3.5 px-4 text-right">Pending (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    </td>
                  </tr>
                ) : drivers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                      No driver reports found.
                    </td>
                  </tr>
                ) : (
                  drivers.map(d => (
                    <tr key={d.driverId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.driverName}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{d.driverPhone}</td>
                      <td className="py-3 px-4 text-center font-bold">{d.totalTrips}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{d.completedTrips}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">{d.cancelledTrips}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">₹{d.totalTripAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{d.totalPaid.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">₹{d.totalPending.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VEHICLES REPORT */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm">Vehicle Utilization & Revenue Breakdown</h3>
            <span className="text-xs text-slate-400 font-semibold">{vehicles.length} Vehicle Models</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-200 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Vehicle Model / Type</th>
                  <th className="py-3.5 px-4">Vehicle Number</th>
                  <th className="py-3.5 px-4 text-center">Total Trips</th>
                  <th className="py-3.5 px-4 text-center">Total Distance (km)</th>
                  <th className="py-3.5 px-4 text-right">Total Revenue (₹)</th>
                  <th className="py-3.5 px-4 text-right">Paid (₹)</th>
                  <th className="py-3.5 px-4 text-right">Pending (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      No vehicle reports found.
                    </td>
                  </tr>
                ) : (
                  vehicles.map(v => (
                    <tr key={`${v.vehicleName}__${v.vehicleNumber}`} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{v.vehicleName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{v.vehicleNumber || 'Not Added'}</td>
                      <td className="py-3 px-4 text-center font-bold">{v.totalTrips}</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600">{v.totalDistance} km</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">₹{v.totalRevenue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{v.totalPaid.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">₹{v.totalPending.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

          </div>
        </div>
      )}

      {/* 5. INVOICE VIEW MODAL */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                  ER
                </div>
                <div>
                  <h3 className="font-black text-base">EasyRide Official Invoice</h3>
                  <p className="text-[11px] text-slate-400">Booking Reference #{selectedInvoice?.bookingCode}</p>
                </div>
              </div>
              <button
                onClick={() => setInvoiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            {loadingInvoice ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
                <p>Loading invoice details...</p>
              </div>
            ) : selectedInvoice ? (
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Customer:</span>
                    <span className="font-bold text-slate-900">{selectedInvoice.customerName}</span>
                    <span className="text-slate-500 block">{selectedInvoice.customerPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Driver & Cab:</span>
                    <span className="font-bold text-slate-900 block">
                      {selectedInvoice.driverName} {selectedInvoice.driverPhone && selectedInvoice.driverPhone !== 'N/A' ? `(${selectedInvoice.driverPhone})` : ''}
                    </span>
                    <div className="mt-1">
                      <span className="text-slate-700 font-medium block">{selectedInvoice.vehicleName || selectedInvoice.vehicle?.name}</span>
                      <span className="text-slate-500 block text-[11px] font-mono">
                        Vehicle No: {selectedInvoice.vehicleNumber || selectedInvoice.vehicle?.vehicleNumber || 'Not Added'}
                      </span>
                    </div>
                  </div>
                </div>


                {/* Route */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Trip Route:</span>
                    <span className="font-bold text-indigo-600">{selectedInvoice.distanceKm} km</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">Pickup:</span>
                      <span className="font-semibold text-slate-900">{selectedInvoice.pickup}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">Drop:</span>
                      <span className="font-semibold text-slate-900">{selectedInvoice.drop}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-4 text-left">Description</th>
                        <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-2.5 px-4">Base Fare</td>
                        <td className="py-2.5 px-4 text-right">₹{selectedInvoice.baseFare}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4">Distance Charges ({selectedInvoice.distanceKm} km)</td>
                        <td className="py-2.5 px-4 text-right">₹{selectedInvoice.distanceCharge}</td>
                      </tr>
                      <tr className="bg-slate-50 font-black text-slate-900">
                        <td className="py-3 px-4">Total Amount</td>
                        <td className="py-3 px-4 text-right text-sm">₹{selectedInvoice.finalFare}</td>
                      </tr>
                      <tr className="text-emerald-600 font-bold">
                        <td className="py-2.5 px-4">Paid Amount ({selectedInvoice.paymentStatus})</td>
                        <td className="py-2.5 px-4 text-right">₹{selectedInvoice.paidAmount}</td>
                      </tr>
                      <tr className="text-rose-600 font-bold">
                        <td className="py-2.5 px-4">Outstanding Balance</td>
                        <td className="py-2.5 px-4 text-right">₹{selectedInvoice.balance}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setInvoiceModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(selectedInvoice)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Invoice</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 6. CUSTOMER BOOKING HISTORY MODAL */}
      {customerModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">{selectedCustomer?.customerName}</h3>
                  <p className="text-xs text-slate-400">{selectedCustomer?.customerPhone} | {selectedCustomer?.customerEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedCustomer && (
                  <button
                    onClick={() => handleExportExcel('customer', selectedCustomer.userId)}
                    disabled={exporting}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>
                )}
                <button
                  onClick={() => setCustomerModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* History Table */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Bookings</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{selectedCustomer?.totalBookings}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Amount</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">₹{selectedCustomer?.totalAmount.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Paid Amount</span>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">₹{selectedCustomer?.totalPaid.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Outstanding</span>
                  <p className="text-lg font-black text-rose-600 mt-0.5">₹{selectedCustomer?.outstandingBalance.toLocaleString()}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Route</th>
                      <th className="py-2.5 px-3">Vehicle</th>
                      <th className="py-2.5 px-3">Driver</th>
                      <th className="py-2.5 px-3 text-right">Fare (₹)</th>
                      <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                      <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {loadingCustomerHistory ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500" />
                        </td>
                      </tr>
                    ) : customerHistory.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 font-bold">
                          No booking history found for this customer.
                        </td>
                      </tr>
                    ) : (
                      customerHistory.map(b => (
                        <tr key={b.bookingId} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{b.bookingCode}</td>
                          <td className="py-2.5 px-3 text-slate-500">{b.bookingDate ? String(b.bookingDate).split('T')[0] : String(b.createdAt).split('T')[0]}</td>
                          <td className="py-2.5 px-3 max-w-[150px] truncate">{b.pickup} → {b.drop}</td>
                          <td className="py-2.5 px-3">{b.vehicleName}</td>
                          <td className="py-2.5 px-3">{b.driverName}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{b.finalFare}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">₹{b.paidAmount}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600">₹{b.balance}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.bookingStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {b.bookingStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
import React, { useEffect, useState } from 'react';
import PageLayout from '../../../components/PageLayout';
// import { DataTable, Column } from '../../../components/DataTable';
import { Customer } from '../../../components/DataTable/types';
import { showToast } from '../../../components/AlertBox';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

import {CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import axiosInstance from '../../../utils/axiosInstance';


interface MonthlyBooking {
  year: number;
  month: number;
  totalBookings: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface StatCardProps {
  title: string;
  count: number | string;
  icon: LucideIcon;
  backgroundColor: string;
  textColor: string;
  viewMoreLink: string;
}
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-md ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);


const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  icon: Icon,
  backgroundColor,
  textColor,
  viewMoreLink,
}) => {
  return (
    <div
      className={`relative flex-1 p-4 shadow-md ${textColor} flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer h-32 overflow-hidden group`}
    style={{ backgroundColor,borderRadius: '4px', }}
    >
      <div className="absolute bottom-[10px] right-[10px] z-0 opacity-10">
        <Icon size={80} />
      </div>

      <div className="flex items-center justify-between z-10 relative">
        <div>
          <p className=" uppercase font-medium tracking-wide opacity-80">{title}</p>
          <p className="font-bold mt-1">{count}</p>
        </div>
      </div>

      <a
        href={viewMoreLink}
        className={`text-sm font-medium absolute bottom-0 left-0 right-0 h-10 flex items-center justify-between px-4 text-white uppercase opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-300 ease-in-out z-20
          ${backgroundColor === 'bg-blue-500' ? 'bg-blue-600' :
            backgroundColor === 'bg-red-500' ? 'bg-red-600' :
            backgroundColor === 'bg-emerald-500' ? '#AFB1AE' :
            backgroundColor === 'bg-purple-600' ? 'bg-purple-700' : 'bg-gray-700'
          }`}
      >
        <span>View More</span>
        <ArrowRight size={16} className="ml-2" />
      </a>
    </div>
  );
};


const Dashboard: React.FC = () => {
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number>(-1);
   const [confirmPendingCount, setConfirmPendingCount] = useState<number>(0);
const [paymentPendingCount, setPaymentPendingCount] = useState<number>(0);
const [closedOrdersCount, setClosedOrdersCount] = useState<number>(0); 
const [completedOrdersCount, setCompletedOrdersCount] = useState<number>(0);
  const [bookingData, setBookingData] = useState<MonthlyBooking[]>([]);
  const [yearRange, setYearRange] = useState<string>('');
  const [pendingPercentage, setPendingPercentage] = useState<number>(0);
  const [completedPercentage, setCompletedPercentage] = useState<number>(0);


  const cardData: StatCardProps[] = [
    {
      title: 'Confirm Pending Orders',
      count: confirmPendingCount,
      icon: Clock,
      backgroundColor: 'rgb(33 91 187)',
      textColor: '',
      viewMoreLink: '/orders/confirmpending',
    },
    {
      title: 'Payment Pending Orders',
      count: paymentPendingCount,
      icon: CreditCard,
      backgroundColor: 'rgb(211 173 22)',
      textColor: '',
      viewMoreLink: '/orders/paymentpending',
    },
    {
      title: 'Close Pending Orders',
      count: closedOrdersCount,
      icon: AlertCircle,
      backgroundColor: 'rgb(219 124 58)',
      textColor: '',
      viewMoreLink: '/orders/closepending',
    },
    {
      title: 'Completed   ',
      count: completedOrdersCount,
      icon: CheckCircle,
      backgroundColor: '#AFB1AE',
      textColor: '',
      viewMoreLink: '/orders/completed',
    },
  ];

useEffect(() => {
  const fetchCounts = async () => {
    try {
      // Confirm Pending Orders
      const confirmRes = await axiosInstance.get('/emp/confirmPendingOrderCountWeb');
      setConfirmPendingCount(confirmRes.data.count);

      // Payment Pending Orders
      const paymentRes = await axiosInstance.get('/emp/paymentPendingOrderCount');
      setPaymentPendingCount(paymentRes.data.count);

      // Closed Orders
      const closedRes = await axiosInstance.get('/order/status/confirmed');
      setClosedOrdersCount(closedRes.data.data.length); // backend returns orders array

      // Completed Orders
      const completedRes = await axiosInstance.get('/emp/getcompletedlist');
      setCompletedOrdersCount(completedRes.data.data.length);

    } catch (err) {
      
       showToast('Error fetching order counts:', 'error');
    }
  };

  fetchCounts();
}, []);

 useEffect(() => {
    const fetchData = async () => {
      try {
        // 📊 Invoice status counts
        const statusRes = await axiosInstance.get(
          "/invoiceRoutes/invoice/status-count"
        );
        if (statusRes.data.success) {
          setPendingPercentage(parseFloat(statusRes.data.data.pendingPercentage));
          setCompletedPercentage(parseFloat(statusRes.data.data.completedPercentage));
        }

        // 📊 Monthly bookings
        const bookingsRes = await axiosInstance.get('/order/getmonthlybookings');
        if (bookingsRes.data.success) {
          const formatted = bookingsRes.data.data.map((item: MonthlyBooking) => ({
            date: `${MONTHS[item.month - 1]}`,
            totalBookings: item.totalBookings,
            year: item.year,
          }));

          const years = bookingsRes.data.data.map((item: MonthlyBooking) => item.year);
          const minYear = Math.min(...years);
          const maxYear = Math.max(...years);

          setYearRange(minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`);
          setBookingData(formatted);
        }
      } catch (err) {
        showToast("Error fetching dashboard data", "error");
      }
    };

    fetchData();
  }, []);


  return (
    <PageLayout>
      <div>
            <h2 className="text-3xl font-bold text-gray-800 py-3">DashBoard</h2>

    

      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-4 gap-4">
        {cardData.map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              count={card.count}
              icon={card.icon}
              backgroundColor={card.backgroundColor}
              textColor="text-white"
              viewMoreLink={card.viewMoreLink}
            />
          ))}
      </div>

  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Bookings Chart */}
          <div className="col-span-2 bg-white rounded-xl shadow-md">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="text-lg font-semibold text-gray-700">
                Monthly Bookings 
                <span className="ml-2 text-sm text-gray-500">({yearRange})</span>
              </h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={bookingData}>
                  <CartesianGrid stroke="#f5f5f5" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalBookings" fill="#3B82F6" name="Bookings" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending vs Completed Circle Chart */}
          <div className="bg-white rounded-xl shadow-md">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="text-lg font-semibold text-gray-700">Invoice Status</h3>
            </div>
            <div className="p-6 flex flex-col items-center gap-6">
              <div className="w-40 h-40 relative">
                <CircularProgressbarWithChildren
                  value={completedPercentage}
                  strokeWidth={12}
                  styles={buildStyles({
                    pathColor: "#10B981", // ✅ Green for Completed
                    trailColor: "#FACC15", // ✅ Yellow for Pending
                    textColor: "#111827",
                  })}
                >
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-800">
                      {completedPercentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </CircularProgressbarWithChildren>
              </div>

              {/* Legends */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <p className="text-sm">Completed: {completedPercentage.toFixed(1)}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  <p className="text-sm">Pending: {pendingPercentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </PageLayout>
  );
};

export default Dashboard;
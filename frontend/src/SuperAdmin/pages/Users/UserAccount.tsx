// import React, { useEffect, useState } from "react";
// import axiosInstance from "../../../utils/axiosInstance";
// import TravelHeader from "./header";
// import { useNavigate } from "react-router-dom";
// import Footer from "./Footer";

// const UserAccount: React.FC = () => {
//   const userId = localStorage.getItem("userId");
//   const username = localStorage.getItem("username");
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({
//     confirmPendingOrder: 0,
//     paymentPendingOrderCount: 0,
//     closedPendingOrder: 0,
//     paymentCompletedOrderCount: 0,
//   });

//   const [confirmPendingOrders, setConfirmPendingOrders] = useState<any[]>([]);
//   const [paymentPendingOrders, setPaymentPendingOrders] = useState<any[]>([]);
//   const [closePendingOrders, setClosePendingOrders] = useState<any[]>([]);
//   const [completedOrders, setCompletedOrders] = useState<any[]>([]);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       if (!userId) {
//         console.warn("No userId found in localStorage");
//         setLoading(false);
//         return;
//       }

//       try {
//         // ✅ 1. Fetch user stats
//         const statsRes = await axiosInstance.get(
//           `/invoiceRoutes/user-order-stats/${userId}`
//         );
//         if (statsRes.data.success && statsRes.data.data) {
//           const d = statsRes.data.data;
//           setStats({
//             confirmPendingOrder: d.confirmPendingOrder || 0,
//             paymentPendingOrderCount: d.paymentPendingOrderCount || 0,
//             closedPendingOrder: d.closedPendingOrder || 0,
//             paymentCompletedOrderCount: d.paymentCompletedOrderCount || 0,
//           });
//         }

//         // ✅ 2. Fetch Confirm Pending Orders
//         const pendingRes = await axiosInstance.get(`/order/user/${userId}/pending`);
//         if (pendingRes.data.success && pendingRes.data.data) {
//           setConfirmPendingOrders(pendingRes.data.data);
//         }

//         // ✅ 3. Fetch Payment Pending Orders
//         const paymentRes = await axiosInstance.get(
//           `/order/user/${userId}/payment-pending`
//         );
//         if (paymentRes.data.success && paymentRes.data.data) {
//           setPaymentPendingOrders(paymentRes.data.data);
//         }

//         // ✅ 4. Fetch Close Pending Orders
//         const closeRes = await axiosInstance.get(`/order/user/${userId}/closed`);
//         if (closeRes.data.success && closeRes.data.data) {
//           setClosePendingOrders(closeRes.data.data);
//         }

//         // ✅ 5. Fetch Completed Orders
//         const completedRes = await axiosInstance.get(
//           `/order/user/${userId}/payment-completed`
//         );
//         if (completedRes.data.success && completedRes.data.data) {
//           setCompletedOrders(completedRes.data.data);
//         }
//       } catch (error) {
//         console.error("Error fetching user data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserData();
//   }, [userId]);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen text-lg font-semibold text-gray-700">
//         Loading dashboard...
//       </div>
//     );
//   }

//   // ✅ Define card routes
//   const cardRoutes = [
//     "/user/confirm-pending",
//     "/user/payment-pending",
//     "/user/close-pending",
//     "/user/completed",
//   ];

//   // ✅ Summary Cards
//   const cards = [
//     { title: "Confirm Pending Orders", count: stats.confirmPendingOrder, color: "bg-yellow-400" },
//     { title: "Payment Pending Orders", count: stats.paymentPendingOrderCount, color: "bg-purple-500" },
//     { title: "Close Pending Orders", count: stats.closedPendingOrder, color: "bg-blue-500" },
//     { title: "Completed Orders", count: stats.paymentCompletedOrderCount, color: "bg-teal-500" },
//   ];

//   // ✅ Table Sections with navigation
//   const tableSections = [
//     {
//       title: "Confirm Pending Order Details",
//       color: "border-yellow-400",
//       path: "/user/confirm-pending",
//       headers: ["Order Number", "Order Date", "Pickup Point", "Drop Point"],
//       data: confirmPendingOrders.slice(0, 5).map(order => ({
//         orderNumber: order.bookingCode,
//         orderDate: new Date(order.createdAt).toLocaleString(),
//         pickupPoint: order.pickupPoint,
//         dropPoint: order.dropPoint,
//       })),
//     },
//     {
//       title: "Payment Pending Order Details",
//       color: "border-purple-500",
//       path: "/user/payment-pending",
//       headers: ["Invoice Number", "Invoice Date", "Invoice Amount", "Pickup Point"],
// data: paymentPendingOrders.slice(0, 5).map(inv => ({
//           invoiceNumber: inv.invoiceNumber,
//         invoiceDate: new Date(inv.createdAt).toLocaleString(),
//         invoiceAmount: `₹${inv.invoiceAmount}`,
//         pickupPoint: inv.booking?.pickupPoint || "N/A",
//       })),
//     },
//     {
//       title: "Close Pending Order Details",
//       color: "border-blue-500",
//       path: "/user/close-pending",
//       headers: ["Order Number", "Order Date", "Pickup Point", "Drop Point"],
//       data: closePendingOrders.slice(0, 5).map(order => ({
//         orderNumber: order.bookingCode,
//         orderDate: new Date(order.createdAt).toLocaleString(),
//         pickupPoint: order.pickupPoint || "N/A",
//         dropPoint: order.dropPoint || "N/A",
//       })),
//     },
//     {
//       title: "Completed Order Details",
//       color: "border-teal-500",
//       path: "/user/completed",
//       headers: ["Order Number", "Order Date", "Order Amount", "Pickup Point"],
//       data: completedOrders.slice(0, 5).map(order => ({
//         orderNumber: order.bookingCode,
//         orderDate: new Date(order.createdAt).toLocaleString(),
//         orderAmount: order.invoice?.[0]?.invoiceAmount
//           ? `₹${order.invoice[0].invoiceAmount}`
//           : "N/A",
//         pickupPoint: order.pickupPoint || "N/A",
//       })),
//     },
//   ];
//   // ✅ Bottom Info Cards
// const infoCards = [
//   {
//     title: "Package Details",
//     color: "bg-blue-500",
//     content:
//       "It contains packages such as local use and outstation package. You may see the spare details of the package with respect to the vehicle you have picked.",
//     buttonText: "View",
//     path: `/users/uservehicledetails/${userId}`, // navigate here on click
//   },
//   {
//     title: "Booking Help",
//     color: "bg-green-500",
//     content: "Click here to know how to pick your taxi",
//     buttonText: "How It Works",
//     path: "/user/howitworks", // navigate here
//   },
//   {
//     title: "Address Details",
//     color: "bg-red-500",
//     content: "It shows your address details.",
//     buttonText: "Edit",
//     path: `/Users/UserEditAddressForm/${userId}`, // navigate here
//   },
// ];

//   return (
//     <>
//       <TravelHeader />
//       <div className="min-h-screen bg-gray-50 p-6">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-xl font-semibold text-gray-800">Home / Dashboard</h1>
//           <p className="text-lg font-semibold text-gray-600">
//             Welcome, <span className="text-blue-600">{username}</span>
//           </p>
//         </div>

//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//           {cards.map((card, index) => (
//             <div
//               key={index}
//               className={`${card.color} text-white shadow-md p-4 flex flex-col justify-between cursor-pointer`}
//             >
//               <div>
//                 <p className="text-2xl font-bold">{card.count}</p>
//                 <p className="mt-1 text-sm">{card.title}</p>
//               </div>
//               <button
//                 onClick={() => navigate(cardRoutes[index])}
//                 className="mt-3 text-xs font-semibold text-white bg-black/20 rounded-full px-3 py-1 self-end hover:bg-black/30 transition"
//               >
//                 VIEW MORE
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* Order Detail Sections */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {tableSections.map((section, index) => (
            
//             <div
//               key={index}
//               className={`border-t-4 ${section.color} bg-white shadow rounded-lg overflow-hidden`}
//             >
//               <div className="p-3 font-semibold text-gray-700 border-b bg-gray-50">
//                 {section.title}
//               </div>
//               <table className="min-w-full text-sm text-left">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     {section.headers.map((header, i) => (
//                       <th key={i} className="px-3 py-2 border-b">
//                         {header}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {section.data.length > 0 ? (
//                     section.data.map((row: any, i) => (
//                       <tr key={i} className="border-b hover:bg-gray-50">
//                         {Object.values(row).map((val, j) => (
//                           <td key={j} className="px-3 py-2">
//                             {val as string}
//                           </td>
//                         ))}
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan={section.headers.length}
//                         className="text-center py-4 text-gray-500"
//                       >
//                         No records found
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//               <div
//                 onClick={() => navigate(section.path)}
//                 className="p-3 text-right text-blue-600 text-sm font-medium hover:underline cursor-pointer"
//               >
//                 View More
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
//   {infoCards.map((info, index) => (
//     <div
//       key={index}
//       className={`border-t-4 ${info.color} bg-white shadow-md rounded-lg p-4`}
//     >
//       <h3 className="font-semibold text-gray-800 mb-2">{info.title}</h3>
//       <p className="text-sm text-gray-600 mb-4">{info.content}</p>
//       <button
//         onClick={() => navigate(info.path)}
//         className={`px-4 py-1 rounded text-white font-semibold ${info.color}`}
//       >
//         {info.buttonText}
//       </button>
//     </div>
//   ))}
// </div>

//       </div>
     
//           <Footer/>
//     </>
//   );
// };

// export default UserAccount;


import React, { useEffect, useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import TravelHeader from "./header";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";

const UserAccount: React.FC = () => {
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    confirmPendingOrder: 0,
    paymentPendingOrderCount: 0,
    closedPendingOrder: 0,
    paymentCompletedOrderCount: 0,
  });

  const [confirmPendingOrders, setConfirmPendingOrders] = useState<any[]>([]);
  const [paymentPendingOrders, setPaymentPendingOrders] = useState<any[]>([]);
  const [closePendingOrders, setClosePendingOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        console.warn("No userId found in localStorage");
        setLoading(false);
        return;
      }

      try {
        const statsRes = await axiosInstance.get(
          `/invoiceRoutes/user-order-stats/${userId}`
        );
        if (statsRes.data.success && statsRes.data.data) {
          const d = statsRes.data.data;
          setStats({
            confirmPendingOrder: d.confirmPendingOrder || 0,
            paymentPendingOrderCount: d.paymentPendingOrderCount || 0,
            closedPendingOrder: d.closedPendingOrder || 0,
            paymentCompletedOrderCount: d.paymentCompletedOrderCount || 0,
          });
        }

        const pendingRes = await axiosInstance.get(`/order/user/${userId}/pending`);
        if (pendingRes.data.success && pendingRes.data.data) {
          setConfirmPendingOrders(pendingRes.data.data);
        }

        const paymentRes = await axiosInstance.get(
          `/order/user/${userId}/payment-pending`
        );
        if (paymentRes.data.success && paymentRes.data.data) {
          setPaymentPendingOrders(paymentRes.data.data);
        }

        const closeRes = await axiosInstance.get(`/order/user/${userId}/closed`);
        if (closeRes.data.success && closeRes.data.data) {
          setClosePendingOrders(closeRes.data.data);
        }

        const completedRes = await axiosInstance.get(
          `/order/user/${userId}/payment-completed`
        );
        if (completedRes.data.success && completedRes.data.data) {
          setCompletedOrders(completedRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-base sm:text-lg font-semibold text-gray-700 px-4">
        Loading dashboard...
      </div>
    );
  }

  const cardRoutes = [
    "/user/confirm-pending",
    "/user/payment-pending",
    "/user/close-pending",
    "/user/completed",
  ];

  const cards = [
    { title: "Confirm Pending Orders", count: stats.confirmPendingOrder, color: "bg-yellow-400" },
    { title: "Payment Pending Orders", count: stats.paymentPendingOrderCount, color: "bg-purple-500" },
    { title: "Close Pending Orders", count: stats.closedPendingOrder, color: "bg-blue-500" },
    { title: "Completed Orders", count: stats.paymentCompletedOrderCount, color: "bg-teal-500" },
  ];

  const tableSections = [
    {
      title: "Confirm Pending Order Details",
      color: "border-yellow-400",
      path: "/user/confirm-pending",
      headers: ["Order Number", "Order Date", "Pickup Point", "Drop Point"],
      data: confirmPendingOrders.slice(0, 5).map(order => ({
        orderNumber: order.bookingCode,
        orderDate: new Date(order.createdAt).toLocaleString(),
        pickupPoint: order.pickupPoint,
        dropPoint: order.dropPoint,
      })),
    },
    {
      title: "Payment Pending Order Details",
      color: "border-purple-500",
      path: "/user/payment-pending",
      headers: ["Invoice Number", "Invoice Date", "Invoice Amount", "Pickup Point"],
      data: paymentPendingOrders.slice(0, 5).map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: new Date(inv.createdAt).toLocaleString(),
        invoiceAmount: `₹${inv.invoiceAmount}`,
        pickupPoint: inv.booking?.pickupPoint || "N/A",
      })),
    },
    {
      title: "Close Pending Order Details",
      color: "border-blue-500",
      path: "/user/close-pending",
      headers: ["Order Number", "Order Date", "Pickup Point", "Drop Point"],
      data: closePendingOrders.slice(0, 5).map(order => ({
        orderNumber: order.bookingCode,
        orderDate: new Date(order.createdAt).toLocaleString(),
        pickupPoint: order.pickupPoint || "N/A",
        dropPoint: order.dropPoint || "N/A",
      })),
    },
    {
      title: "Completed Order Details",
      color: "border-teal-500",
      path: "/user/completed",
      headers: ["Order Number", "Order Date", "Order Amount", "Pickup Point"],
      data: completedOrders.slice(0, 5).map(order => ({
        orderNumber: order.bookingCode,
        orderDate: new Date(order.createdAt).toLocaleString(),
        orderAmount: order.invoice?.[0]?.invoiceAmount
          ? `₹${order.invoice[0].invoiceAmount}`
          : "N/A",
        pickupPoint: order.pickupPoint || "N/A",
      })),
    },
  ];

  const infoCards = [
    {
      title: "Package Details",
      color: "bg-blue-500",
      content:
        "It contains packages such as local use and outstation package. You may see the spare details of the package with respect to the vehicle you have picked.",
      buttonText: "View",
      path: `/users/uservehicledetails/${userId}`,
    },
    {
      title: "Booking Help",
      color: "bg-green-500",
      content: "Click here to know how to pick your taxi",
      buttonText: "How It Works",
      path: "/user/howitworks",
    },
    {
      title: "Address Details",
      color: "bg-red-500",
      content: "It shows your address details.",
      buttonText: "Edit",
      path: `/Users/UserEditAddressForm/${userId}`,
    },
  ];

  return (
    <>
      <TravelHeader />
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
            Home / Dashboard
          </h1>
          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-600">
            Welcome, <span className="text-blue-600">{username}</span>
          </p>
        </div>

        {/* Summary Cards - Responsive Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`${card.color} text-white shadow-md rounded-lg p-3 sm:p-4 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow`}
            >
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{card.count}</p>
                <p className="mt-1 text-xs sm:text-sm md:text-base">{card.title}</p>
              </div>
              <button
                onClick={() => navigate(cardRoutes[index])}
                className="mt-3 text-xs font-semibold text-white bg-black/20 rounded-full px-3 py-1 self-end hover:bg-black/30 transition"
              >
                VIEW MORE
              </button>
            </div>
          ))}
        </div>

        {/* Order Detail Sections - Responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {tableSections.map((section, index) => (
            <div
              key={index}
              className={`border-t-4 ${section.color} bg-white shadow rounded-lg overflow-hidden`}
            >
              <div className="p-3 sm:p-4 font-semibold text-sm sm:text-base text-gray-700 border-b bg-gray-50">
                {section.title}
              </div>
              
              {/* Mobile: Card View */}
              <div className="block md:hidden">
                {section.data.length > 0 ? (
                  section.data.map((row: any, i) => (
                    <div key={i} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                      {Object.entries(row).map(([key, val], j) => (
                        <div key={j} className="flex justify-between py-1 text-xs sm:text-sm">
                          <span className="font-medium text-gray-600">
                            {section.headers[j]}:
                          </span>
                          <span className="text-gray-800 text-right ml-2 break-words max-w-[60%]">
                            {val as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No records found
                  </div>
                )}
              </div>

              {/* Tablet & Desktop: Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      {section.headers.map((header, i) => (
                        <th key={i} className="px-2 sm:px-3 py-2 border-b whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.data.length > 0 ? (
                      section.data.map((row: any, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-2 sm:px-3 py-2 max-w-[150px] truncate">
                              {val as string}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={section.headers.length}
                          className="text-center py-4 text-gray-500"
                        >
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div
                onClick={() => navigate(section.path)}
                className="p-3 text-right text-blue-600 text-xs sm:text-sm font-medium hover:underline cursor-pointer"
              >
                View More
              </div>
            </div>
          ))}
        </div>

        {/* Info Cards - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
          {infoCards.map((info, index) => (
            <div
              key={index}
              className={`border-t-4 ${info.color} bg-white shadow-md rounded-lg p-4 sm:p-5 hover:shadow-lg transition-shadow`}
            >
              <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-2">
                {info.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                {info.content}
              </p>
              <button
                onClick={() => navigate(info.path)}
                className={`w-full sm:w-auto px-4 py-2 rounded text-white text-xs sm:text-sm font-semibold ${info.color} hover:opacity-90 transition-opacity`}
              >
                {info.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default UserAccount;

// import React, { useEffect, useState } from "react";
// import PageLayout from "../../../components/PageLayout";
// import { DataTable, Column } from "../../../components/DataTable";
// import { Pencil, Trash2 } from "lucide-react";
// import SearchBar from "../../../components/SearchBar";
// import { AlertContainer, showToast, ActionModal } from "../../../components/AlertBox";
// import axiosInstance from "../../../utils/axiosInstance";

// interface PaymentMode {
//   paymentmodeId: string;
//   modelname: string;
//   isOnline: boolean;
//   isActive: boolean;
//   sortorder: number;
// }

// interface GetAllPaymentModesResponse {
//   message: string;
//   count: number;
//   paymentModes: PaymentMode[];
// }

// interface GetPaymentModeByIdResponse {
//   message: string;
//   paymentMode: PaymentMode;
// }

// export default function ListPaymentMode() {
//   const [data, setData] = useState<PaymentMode[]>([]);
//   const [filteredData, setFilteredData] = useState<PaymentMode[]>([]);
//   const [searchText, setSearchText] = useState("");

//   // Edit modal
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [editData, setEditData] = useState<PaymentMode | null>(null);

//   // Delete modal
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalType, setModalType] = useState<"confirm-delete" | "delete-success">(
//     "confirm-delete"
//   );
//   const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode | null>(
//     null
//   );

//   // Fetch all payment modes
//   const fetchData = async () => {
//     try {
//       const res = await axiosInstance.get<GetAllPaymentModesResponse>(
//         "/paymentmode/getAllPaymentMode"
//       );
//       setData(res.data.paymentModes);
//       setFilteredData(res.data.paymentModes);
//     } catch (err) {
//       console.error("Failed to fetch payment modes:", err);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Global Search
//   const handleGlobalSearch = async () => {
//     if (!searchText.trim()) {
//       setFilteredData(data);
//       return;
//     }

//     try {
//       const res = await axiosInstance.get("/globalsearch", {
//         params: { model: "paymentmode", keyword: searchText },
//       });

//       if (Array.isArray(res.data)) {
//         const mappedData: PaymentMode[] = res.data.map((item: any) => ({
//           paymentmodeId: item.paymentmodeId,
//           modelname: item.modelname,
//           isOnline: item.isOnline,
//           isActive: item.isActive,
//           sortorder: item.sortorder,
//         }));
//         setFilteredData(mappedData);
//       } else {
//         setFilteredData([]);
//       }
//     } catch (err) {
//       console.error("Global search failed:", err);
//     }
//   };

//   // Open Edit Modal
//   const handleEditClick = async (row: PaymentMode) => {
//     try {
//       const res = await axiosInstance.get<GetPaymentModeByIdResponse>(
//         `/paymentmode/getPaymentModeById/${row.paymentmodeId}`
//       );
//       const paymentMode = res.data.paymentMode;
//       setEditData(paymentMode);
//       setEditModalOpen(true);
//     } catch (err) {
//       console.error("Error fetching payment mode:", err);
//     }
//   };

//   // Save Edits
//   const saveEdit = async () => {
//     if (!editData) return;
//     try {
//       await axiosInstance.put(
//         `/paymentmode/updatePaymentMode/${editData.paymentmodeId}`,
//         {
//           modelname: editData.modelname,
//           isOnline: editData.isOnline,
//           isActive: editData.isActive,
//           sortorder: editData.sortorder,
//         }
//       );
//       showToast("Payment Mode Updated Successfully!", "success");
//       setEditModalOpen(false);
//       setEditData(null);
//       fetchData();
//     } catch (err) {
//       console.error("Update failed:", err);
//       showToast("Failed to update Payment Mode.", "error");
//     }
//   };

//   // Delete Handlers
//   const handleDeleteClick = (row: PaymentMode) => {
//     setSelectedPaymentMode(row);
//     setModalType("confirm-delete");
//     setModalOpen(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!selectedPaymentMode) return;
//     try {
//       await axiosInstance.delete(
//         `/paymentmode/deletePaymentMode/${selectedPaymentMode.paymentmodeId}`
//       );
//       setModalOpen(false);
//       setSelectedPaymentMode(null);
//       showToast("Payment Mode Deleted Successfully!", "success");
//       fetchData();
//     } catch (err) {
//       console.error("Delete failed:", err);
//     }
//   };

//   // Table columns
//   const columns: Column<PaymentMode>[] = [
//     { header: "Mode Name", accessor: "modelname" },
//     {
//       header: "Is Online",
//       accessor: "isOnline",
//       render: (row) => (row.isOnline ? "Yes" : "No"),
//     },
//     {
//       header: "Status",
//       accessor: "isActive",
//       render: (row) => (row.isActive ? "Active" : "In-Active"),
//     },
//     { header: "Sort Order", accessor: "sortorder" },
//     {
//       header: "Actions",
//       accessor: "paymentmodeId",
//       render: (row) => (
//         <div className="flex gap-2">
//           <Pencil
//             className="text-blue-600 cursor-pointer w-4 h-4"
//             onClick={() => handleEditClick(row)}
//           />
//           <Trash2
//             className="text-red-600 cursor-pointer w-4 h-4"
//             onClick={() => handleDeleteClick(row)}
//           />
//         </div>
//       ),
//     },
//   ];

//   return (
//     <PageLayout>
//       <main className="py-6">
//         <AlertContainer />

//         <h1 className="text-3xl font-bold text-gray-800">List Payment Mode</h1>

//         {/* Search Bar */}
//         <div className="py-5">
//           <SearchBar
//             placeholder="Search Payment Mode"
//             value={searchText}
//             onChange={(e) => setSearchText(e.target.value)}
//             onSearch={handleGlobalSearch}
//           />
//         </div>

//         {/* Table */}
//         <DataTable columns={columns} data={filteredData} rowsPerPage={5} />

//         {/* Edit Modal */}
//         {editModalOpen && editData && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//             <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto shadow-xl">
//               <h2 className="text-xl font-semibold mb-4">Edit Payment Mode</h2>

//               {/* Mode Name */}
//               <input
//                 type="text"
//                 value={editData.modelname}
//                 onChange={(e) =>
//                   setEditData({ ...editData, modelname: e.target.value })
//                 }
//                 className="w-full border p-2 mb-2 rounded"
//                 placeholder="Mode Name"
//               />

//               {/* Is Online */}
//               <select
//                 value={editData.isOnline ? "Yes" : "No"}
//                 onChange={(e) =>
//                   setEditData({
//                     ...editData,
//                     isOnline: e.target.value === "Yes",
//                   })
//                 }
//                 className="w-full border p-2 mb-2 rounded"
//               >
//                 <option value="Yes">Yes</option>
//                 <option value="No">No</option>
//               </select>

//               {/* Status */}
//               <select
//                 value={editData.isActive ? "Active" : "In-Active"}
//                 onChange={(e) =>
//                   setEditData({
//                     ...editData,
//                     isActive: e.target.value === "Active",
//                   })
//                 }
//                 className="w-full border p-2 mb-2 rounded"
//               >
//                 <option value="Active">Active</option>
//                 <option value="In-Active">In-Active</option>
//               </select>

//               {/* Sort Order */}
//               <input
//                 type="number"
//                 value={editData.sortorder}
//                 onChange={(e) =>
//                   setEditData({
//                     ...editData,
//                     sortorder: parseInt(e.target.value) || 0,
//                   })
//                 }
//                 className="w-full border p-2 mb-4 rounded"
//                 placeholder="Sort Order"
//               />

//               {/* Buttons */}
//               <div className="flex justify-end gap-2">
//                 <button
//                   onClick={() => setEditModalOpen(false)}
//                   className="px-4 py-2 bg-gray-300 rounded"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={saveEdit}
//                   className="px-4 py-2 bg-blue-600 text-white rounded"
//                 >
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Delete Confirmation Modal */}
//         <ActionModal
//           isOpen={modalOpen}
//           type={modalType}
//           onClose={() => setModalOpen(false)}
//           onConfirm={modalType === "confirm-delete" ? handleDeleteConfirm : undefined}
//         />
//       </main>
//     </PageLayout>
//   );
// }


import React, { useEffect, useState } from "react";
import PageLayout from "../../../components/PageLayout";
import { DataTable, Column } from "../../../components/DataTable";
import { Pencil, Trash2 } from "lucide-react";
import SearchBar from "../../../components/SearchBar";
import {
  AlertContainer,
  showToast,
  ActionModal,
} from "../../../components/AlertBox";
import axiosInstance from "../../../utils/axiosInstance";

interface PaymentMode {
  paymentmodeId: string;
  modelname: string;
  isOnline: boolean;
  isActive: boolean;
}

interface GetAllPaymentModesResponse {
  message: string;
  count: number;
  paymentModes: PaymentMode[];
}

interface GetPaymentModeByIdResponse {
  message: string;
  paymentMode: PaymentMode;
}

export default function ListPaymentMode() {
  const [data, setData] = useState<PaymentMode[]>([]);
  const [filteredData, setFilteredData] = useState<PaymentMode[]>([]);
  const [searchText, setSearchText] = useState("");

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<PaymentMode | null>(null);

  // Delete modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] =
    useState<"confirm-delete" | "delete-success">("confirm-delete");
  const [selectedPaymentMode, setSelectedPaymentMode] =
    useState<PaymentMode | null>(null);

  // Fetch all payment modes
  const fetchData = async () => {
    try {
      const res = await axiosInstance.get<GetAllPaymentModesResponse>(
        "/paymentmode/getAllPaymentMode"
      );
      setData(res.data.paymentModes);
      setFilteredData(res.data.paymentModes);
    } catch (err) {
      console.error("Failed to fetch payment modes:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Global Search
  const handleGlobalSearch = async () => {
    if (!searchText.trim()) {
      setFilteredData(data);
      return;
    }

    try {
      const res = await axiosInstance.get("/globalsearch", {
        params: { model: "paymentmode", keyword: searchText },
      });

      if (Array.isArray(res.data)) {
        const mappedData: PaymentMode[] = res.data.map((item: any) => ({
          paymentmodeId: item.paymentmodeId,
          modelname: item.modelname,
          isOnline: item.isOnline,
          isActive: item.isActive,
        }));
        setFilteredData(mappedData);
      } else {
        setFilteredData([]);
      }
    } catch (err) {
      console.error("Global search failed:", err);
    }
  };

  // Open Edit Modal
  const handleEditClick = async (row: PaymentMode) => {
    try {
      const res = await axiosInstance.get<GetPaymentModeByIdResponse>(
        `/paymentmode/getPaymentModeById/${row.paymentmodeId}`
      );
      setEditData(res.data.paymentMode);
      setEditModalOpen(true);
    } catch (err) {
      console.error("Error fetching payment mode:", err);
    }
  };

  // Save Edits
  const saveEdit = async () => {
    if (!editData) return;
    try {
      await axiosInstance.put(
        `/paymentmode/updatePaymentMode/${editData.paymentmodeId}`,
        {
          modelname: editData.modelname,
          isOnline: editData.isOnline,
          isActive: editData.isActive,
        }
      );
      showToast("Payment Mode Updated Successfully!", "success");
      setEditModalOpen(false);
      setEditData(null);
      fetchData();
    } catch (err) {
      console.error("Update failed:", err);
      showToast("Failed to update Payment Mode.", "error");
    }
  };

  // Delete Handlers
  const handleDeleteClick = (row: PaymentMode) => {
    setSelectedPaymentMode(row);
    setModalType("confirm-delete");
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPaymentMode) return;
    try {
      await axiosInstance.delete(
        `/paymentmode/deletePaymentMode/${selectedPaymentMode.paymentmodeId}`
      );
      setModalOpen(false);
      setSelectedPaymentMode(null);
      showToast("Payment Mode Deleted Successfully!", "success");
      fetchData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Table columns (Sort Order removed)
  const columns: Column<PaymentMode>[] = [
    { header: "Mode Name", accessor: "modelname" },
    {
      header: "Is Online",
      accessor: "isOnline",
      render: (row) => (row.isOnline ? "Yes" : "No"),
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (row) => (row.isActive ? "Active" : "In-Active"),
    },
    {
      header: "Actions",
      accessor: "paymentmodeId",
      render: (row) => (
        <div className="flex gap-2">
          <Pencil
            className="text-blue-600 cursor-pointer w-4 h-4"
            onClick={() => handleEditClick(row)}
          />
          <Trash2
            className="text-red-600 cursor-pointer w-4 h-4"
            onClick={() => handleDeleteClick(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <PageLayout>
      <main className="py-6">
        <AlertContainer />

        <h1 className="text-3xl font-bold text-gray-800">
          List Payment Mode
        </h1>

        <div className="py-5">
          <SearchBar
            placeholder="Search Payment Mode"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleGlobalSearch}
          />
        </div>

        <DataTable columns={columns} data={filteredData} rowsPerPage={5} />

        {/* Edit Modal */}
        {editModalOpen && editData && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">
                Edit Payment Mode
              </h2>

              <input
                type="text"
                value={editData.modelname}
                onChange={(e) =>
                  setEditData({ ...editData, modelname: e.target.value })
                }
                className="w-full border p-2 mb-2 rounded"
                placeholder="Mode Name"
              />

              <select
                value={editData.isOnline ? "Yes" : "No"}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    isOnline: e.target.value === "Yes",
                  })
                }
                className="w-full border p-2 mb-2 rounded"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>

              <select
                value={editData.isActive ? "Active" : "In-Active"}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    isActive: e.target.value === "Active",
                  })
                }
                className="w-full border p-2 mb-4 rounded"
              >
                <option value="Active">Active</option>
                <option value="In-Active">In-Active</option>
              </select>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <ActionModal
          isOpen={modalOpen}
          type={modalType}
          onClose={() => setModalOpen(false)}
          onConfirm={
            modalType === "confirm-delete"
              ? handleDeleteConfirm
              : undefined
          }
        />
      </main>
    </PageLayout>
  );
}

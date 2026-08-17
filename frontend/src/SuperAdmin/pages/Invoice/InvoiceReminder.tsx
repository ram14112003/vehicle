// InvoiceReminder.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import PageLayout from "../../../components/PageLayout";
import { DataTable, Column } from "../../../components/DataTable";
import CommonButton from "../../../components/CommonButton";
import SearchBar from "../../../components/SearchBar";
import axiosInstance from "../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../components/AlertBox";
import { useNavigate, useNavigationType } from "react-router-dom";

interface InvoiceRow {
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  userName: string;
  pickupPoint: string;
  invoiceAmount: number;
  bookingId: string;

  // (extra fields may exist from API, but not required)
  invoiceId?: string;
  userId?: string;
  companyId?: string;
}

interface Company {
  companyId: string;
  companyName: string;
}

interface User {
  userId: string;
  username: string;
  email: string;
  companyId: string;
  gstNo?: string;
  mobile?: string;
  userAddress?: string;
}

type Msg = { text: string; type: "success" | "error" } | null;

const InvoiceReminder: React.FC = () => {
  const [showFilterBox, setShowFilterBox] = useState(true);
  const [isSearched, setIsSearched] = useState(false);
  const [tableData, setTableData] = useState<InvoiceRow[]>([]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [message, setMessage] = useState<Msg>(null);

  // ✅ Selection Set (invoiceNumber as key)
  const [selectedInvoiceSet, setSelectedInvoiceSet] = useState<Set<string>>(new Set());
const [sendingReminderEmails, setSendingReminderEmails] = useState(false);
const filterBoxRef = useRef<HTMLDivElement | null>(null);


  const navigate = useNavigate();
  const navigationType = useNavigationType();

  // ✅ Clear only when user enters page freshly (not from back)
  useEffect(() => {
    if (navigationType !== "POP") {
      sessionStorage.removeItem("InvoiceReminderData");
    }
  }, [navigationType]);

  // ✅ Restore data when coming back
  useEffect(() => {
    const saved = sessionStorage.getItem("InvoiceReminderData");
    if (saved) {
      const parsed = JSON.parse(saved);

      const savedTableData: InvoiceRow[] = parsed?.tableData || [];
      const savedCompany: string = parsed?.selectedCompany || "";
      const savedUser: User | null = parsed?.selectedUser || null;
      const savedSelected: string[] = parsed?.selectedInvoiceNumbers || [];

      if (savedTableData?.length) {
        setTableData(savedTableData);
        setIsSearched(true);
      }

      if (savedCompany) setSelectedCompany(savedCompany);
      if (savedUser) setSelectedUser(savedUser);

      if (savedSelected?.length) {
        setSelectedInvoiceSet(new Set(savedSelected));
      } else if (savedTableData?.length) {
        // fallback = select all
        setSelectedInvoiceSet(new Set(savedTableData.map((r) => r.invoiceNumber)));
      }
    }
  }, []);

  // ✅ Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await axiosInstance.get<{ data: Company[] }>(
          `/company/getAllCompany?status=0`
        );
        setCompanies(data.data || []);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  // Reset table when user changes (but not on mount when restoring)
  useEffect(() => {
    const saved = sessionStorage.getItem("InvoiceReminderData");
    if (!saved) {
      setTableData([]);
      setIsSearched(false);
      setSelectedInvoiceSet(new Set());
    }
  }, [selectedUser]);

  useEffect(() => {
    const fetchUsersByCompany = async () => {
      if (!selectedCompany) return;
      try {
        const { data } = await axiosInstance.get<{ data: User[] }>(
          `/user/getAllUserByCompany/${selectedCompany}`
        );

        setUsers(data.data || []);

        // ✅ Don't reset if we're restoring from sessionStorage
        const saved = sessionStorage.getItem("InvoiceReminderData");
        if (!saved) {
          setSelectedUser(null);
          setTableData([]);
          setIsSearched(false);
          setSelectedInvoiceSet(new Set());
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsersByCompany();
  }, [selectedCompany]);

  // ✅ New (Browser Local Time)
  const formatToCustom = (utcDate: string) => {
    if (!utcDate) return "-";
    const d = new Date(utcDate);
    if (isNaN(d.getTime())) return utcDate;

    let day = String(d.getDate()).padStart(2, "0");
    let month = String(d.getMonth() + 1).padStart(2, "0");
    let year = d.getFullYear();

    let hours = d.getHours();
    let minutes = String(d.getMinutes()).padStart(2, "0");
    let ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  // ✅ select-all status
  const isAllSelected = useMemo(() => {
    if (tableData.length === 0) return false;
    return tableData.every((r) => selectedInvoiceSet.has(r.invoiceNumber));
  }, [tableData, selectedInvoiceSet]);

  const selectedRows = useMemo(() => {
    return tableData.filter((r) => selectedInvoiceSet.has(r.invoiceNumber));
  }, [tableData, selectedInvoiceSet]);

  const selectedTotal = useMemo(() => {
    return selectedRows.reduce((sum, row) => sum + Number(row.invoiceAmount || 0), 0);
  }, [selectedRows]);

  const handleSearch = async () => {
    if (!selectedUser || !selectedCompany) {
      showToast("Please select a company and user first!", "error");
      return;
    }

    setMessage(null);

    try {
      // ✅ Use backend filters (your API already supports userId, companyId)
      const response = await axiosInstance.get("/invoiceRoutes/getPendingInvoices", {
        params: { userId: selectedUser.userId, companyId: selectedCompany },
      });

      if (response.data.success) {
        const invoices = response.data.data as any[];

        // map to your table format
        const filteredData: InvoiceRow[] = (invoices || []).map((inv: any) => ({
          orderNumber: inv.orderNumber || inv.booking?.bookingCode || "",
          bookingId: inv.bookingId || inv.booking?.bookingId || "",
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate || inv.createdAt,
          userName: inv.userName || inv.user?.username || "",
          pickupPoint: inv.pickupPoint || inv.booking?.pickupPoint || "-",
          invoiceAmount: Number(inv.invoiceAmount || 0),
        }));

        setTableData(filteredData);
        setIsSearched(true);

        // ✅ default = select ALL rows
        const all = new Set(filteredData.map((r) => r.invoiceNumber));
        setSelectedInvoiceSet(all);

        // ✅ Store data for restoring when coming back
        sessionStorage.setItem(
          "InvoiceReminderData",
          JSON.stringify({
            tableData: filteredData,
            selectedCompany,
            selectedUser,
            selectedInvoiceNumbers: Array.from(all),
          })
        );
      } else {
        setTableData([]);
        setIsSearched(true);
        setSelectedInvoiceSet(new Set());
      }
    } catch (err) {
      console.error("❌ Error fetching invoices:", err);
      setTableData([]);
      setIsSearched(true);
      setSelectedInvoiceSet(new Set());
    }
  };

  useEffect(() => {
  if (!showFilterBox) return;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;

    // ✅ only trigger when focus is inside filter box
    const active = document.activeElement as HTMLElement | null;

    if (filterBoxRef.current && active && filterBoxRef.current.contains(active)) {
      e.preventDefault();
      handleSearch();
    }
  };

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [showFilterBox, selectedCompany, selectedUser, users]);


  // ✅ Checkbox column + other columns
  const columns: Column<InvoiceRow>[] = [
    {
      header: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={(e) => {
            const checked = e.target.checked;
            if (checked) {
              setSelectedInvoiceSet(new Set(tableData.map((r) => r.invoiceNumber)));
            } else {
              setSelectedInvoiceSet(new Set());
            }
          }}
        />
      ) as any,
      accessor: "invoiceNumber",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedInvoiceSet.has(row.invoiceNumber)}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectedInvoiceSet((prev) => {
              const next = new Set(prev);
              if (checked) next.add(row.invoiceNumber);
              else next.delete(row.invoiceNumber);
              return next;
            });
          }}
        />
      ),
    },
    {
      header: "Order Number #",
      accessor: "orderNumber",
      render: (row) => (
        <button
          className="text-blue-600 hover:underline font-bold"
          onClick={() => navigate(`/orders/view/payment-pending-order/${row.bookingId}`)}
        >
          {row.orderNumber}
        </button>
      ),
    },
    { header: "Invoice Number #", accessor: "invoiceNumber" },
    {
      header: "Invoice Date",
      accessor: "invoiceDate",
      render: (row) => formatToCustom(row.invoiceDate),
    },
    { header: "User Name", accessor: "userName" },
    { header: "Pickup Point", accessor: "pickupPoint" },
    { header: "Invoice Amount (Rs.)", accessor: "invoiceAmount" },
  ];

const handleSendEmails = async () => {
  if (sendingReminderEmails) return; // ✅ prevent double click

  setMessage(null);

  try {
    const invoiceNumbers = tableData
      .filter((inv) => selectedInvoiceSet.has(inv.invoiceNumber))
      .map((inv) => inv.invoiceNumber);

    if (invoiceNumbers.length === 0) {
      showToast("Please select at least one invoice!", "error");
      return;
    }

    setSendingReminderEmails(true); // ✅ start loading

    const response = await axiosInstance.post("/invoiceRoutes/sendInvoiceReminder", {
      invoiceNumbers,
    });

    if (response.data.success) {
      setMessage({ text: "Invoice emails sent successfully!", type: "success" });

      sessionStorage.setItem(
        "InvoiceReminderData",
        JSON.stringify({
          tableData,
          selectedCompany,
          selectedUser,
          selectedInvoiceNumbers: Array.from(selectedInvoiceSet),
        })
      );
    } else {
      setMessage({ text: response.data?.message || "Failed to send emails.", type: "error" });
    }
  } catch (err) {
    console.error("Email send error:", err);
    setMessage({ text: "Error sending invoice emails", type: "error" });
  } finally {
    setSendingReminderEmails(false); // ✅ stop loading
  }
};


  return (
    <PageLayout>
      <AlertContainer />

      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Invoice Reminder</h1>
      </div>

      {showFilterBox && (
        <div  ref={filterBoxRef}
        className="rounded-lg w-full max-w-4xl bg-gray-50 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Company Dropdown */}
            <div>
              <label className="text-sm font-medium text-gray-700">Company</label>
              <select
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="">Select company...</option>
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* User Dropdown */}
            <div>
              <label className="text-sm font-medium text-gray-700">User</label>
              <select
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm"
                value={selectedUser?.userId || ""}
                onChange={(e) => {
                  const user = users.find((u) => u.userId === e.target.value);
                  setSelectedUser(user || null);
                }}
              >
                <option value="">Select user...</option>
                {users.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.username} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <SearchBar onlyButton onSearch={handleSearch} />
            </div>
          </div>
        </div>
      )}

      {/* Message box */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <p>{message.text}</p>
        </div>
      )}

      <div className="mt-6 space-y-6">
        <DataTable
          columns={columns}
          data={tableData}
          emptyMessage="No invoice records found."
          rowsPerPage={5}
        />

        {isSearched && tableData.length > 0 && selectedUser && (
          <div className="grid grid-cols-2 gap-6 mt-6 items-start">
            {/* LEFT SIDE → User Details */}
            <div className="border border-gray-300 rounded-lg p-6 shadow-sm">
              <p className="font-bold text-gray-800 text-lg">{selectedUser.username}</p>
              <p className="text-sm text-gray-600">M/s. {selectedUser.username} Pvt Ltd.</p>
              <p className="text-sm text-gray-600">
                {selectedUser.userAddress || "userAddress not available"}
              </p>
              <p className="text-sm text-gray-600">GST No: {selectedUser.gstNo || "-"}</p>
              <p className="text-sm text-gray-600">P: {selectedUser.mobile || "-"}</p>
              <hr className="my-3 border-gray-200" />
              <p className="font-bold text-gray-800">{selectedUser.username}</p>
              <p className="text-sm text-blue-500">
                <a href={`mailto:${selectedUser.email}`}>{selectedUser.email}</a>
              </p>
            </div>

            {/* RIGHT SIDE → Selected Total + Button */}
            <div className="flex justify-end w-full">
              <div className="space-y-2 text-right">
                <div className="text-sm text-gray-500">
                  Selected: {selectedRows.length} / {tableData.length}
                </div>

                <div className="text-lg font-semibold">
                  Selected Total: ₹ {selectedTotal.toFixed(2)}
                </div>

               <CommonButton
  variant="success"
  onClick={handleSendEmails}
  className="text-sm px-4 py-2 font-medium"
  disabled={sendingReminderEmails}
>
  {sendingReminderEmails ? "Sending..." : "Send Invoice Email ✓"}
</CommonButton>

              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default InvoiceReminder;
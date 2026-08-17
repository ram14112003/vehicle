
import React, { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../../../components/PageLayout";
import InputBox, { getFormStore } from "../../../../components/InputBox";
import CommonButton from "../../../../components/CommonButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DataTable, Column } from "../../../../components/DataTable";

import {
  faBuilding,
  faGlobe,
  faEnvelope,
  faLink,
  faChain,
  faReceipt,
  faFileInvoice,
  faPenToSquare,
  faXmark,
  faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";
import { showToast, AlertContainer } from "../../../../components/AlertBox";
import axiosInstance from "../../../../utils/axiosInstance";

type VehicleBookingRule = {
  vehicleTypeId: string;
  vehicleType: string;
  priorMinutes: number;
};

const bookingRuleColumns: Column<VehicleBookingRule>[] = [
  {
    header: "Vehicle Type",
    accessor: "vehicleType",
  },
  {
    header: "Advance Booking Hours",
    accessor: "priorMinutes",
  },
];

export default function AddCompany() {
  const navigate = useNavigate();

  const [companyLogo, setLogo] = useState<File | null>(null);
  const [vehicleRules, setVehicleRules] = useState<VehicleBookingRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
const [companyName, setCompanyName] = useState("");
  // ✅ Add checkbox states
  const [needEmail, setNeedEmail] = useState<boolean>(false);
  const [allowTax, setAllowTax] = useState<boolean>(false);
// ✅ Manager Approval checkbox state
const [managerApproval, setManagerApproval] = useState<boolean>(false);
  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<VehicleBookingRule | null>(null);
  const [editPriorMinutes, setEditPriorMinutes] = useState<string>("");
  const [editSaving, setEditSaving] = useState(false);
const showManagerApproval =
  companyName.toLowerCase().includes("danfoss");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 1 * 1024 * 1024) {
      showToast("Image too large! Please select below 1 MB", "error");
      e.currentTarget.value = "";
      setLogo(null);
      return;
    }
    setLogo(file);
  };

  const fetchVehicleRules = async () => {
    try {
      setRulesLoading(true);
      const res = await axiosInstance.get("/vehicleType/getAllVehicleType");
      const list = res.data?.data ?? [];

      const mapped: VehicleBookingRule[] = list.map((x: any) => ({
        vehicleTypeId: x.vehicleTypeId,
        vehicleType: x.vehicleType,
        priorMinutes: Number(x.priorMinutes ?? 0),
      }));

      setVehicleRules(mapped);
    } catch (e) {
      showToast("Failed to load vehicle types", "error");
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleRules();
  }, []);
useEffect(() => {
  const interval = setInterval(() => {
    const form = getFormStore();
    if (form?.companyName !== undefined) {
      setCompanyName(form.companyName || "");
    }
  }, 200);

  return () => clearInterval(interval);
}, []);
  const openEdit = (row: VehicleBookingRule) => {
    setEditRow(row);
    setEditPriorMinutes(String(row.priorMinutes ?? 0));
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditRow(null);
    setEditPriorMinutes("");
  };

  const saveEdit = async () => {
    if (!editRow) return;

    const pm = Number(editPriorMinutes);
    if (!Number.isFinite(pm) || pm < 0) {
      showToast("Advance Booking Hours must be a valid number", "warn");
      return;
    }

    try {
      setEditSaving(true);

      await axiosInstance.put(`/vehicleType/${editRow.vehicleTypeId}/update`, {
        priorMinutes: pm,
      });

      setVehicleRules((prev) =>
        prev.map((r) =>
          r.vehicleTypeId === editRow.vehicleTypeId ? { ...r, priorMinutes: pm } : r
        )
      );

      showToast("Advance Booking Hours updated!", "success");
      closeEdit();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Update failed";
      showToast(msg, "error");
    } finally {
      setEditSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const form = getFormStore();

    if (!form.companyName || form.companyName.trim() === "") {
      showToast("Company Name is required", "warn");
      return;
    }

    if (!form.managerEmails || form.managerEmails.trim() === "") {
      showToast("Manager Email(s) are required", "warn");
      return;
    }

    const emailList = form.managerEmails.split(/[,;\s]+/).filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter((email: string) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      showToast(
        `Invalid email(s): ${invalidEmails.join(", ")}. Example: gracecabs@gmail.com`,
        "warn"
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("companyName", form.companyName.trim());
      formData.append("managerEmail", form.managerEmails.trim());
if (!form.companyCode || form.companyCode.trim() === "") {
  showToast("Company Code is required", "warn");
  return;
}

formData.append("companyCode", form.companyCode.trim());

      if (form.seoUrl && form.seoUrl.trim() !== "") {
        formData.append("seoUrl", form.seoUrl.trim());
      }

      if (form.domainName) formData.append("domainName", form.domainName.trim());
      if (form.gstNo && form.gstNo.trim() !== "") {
        formData.append("gstNo", form.gstNo.trim());
      }
if (form.companyAddress && form.companyAddress.trim() !== "") {
  formData.append("companyAddress", form.companyAddress.trim());
}

      // ✅ Send allowTax as "Yes" or "No" from state
      formData.append("allowTax", allowTax ? "Yes" : "No");

      // ✅ Send needEmail from state
      formData.append("needEmail", needEmail ? "true" : "false");
      formData.append(
        "bookingRules",
        JSON.stringify(
          vehicleRules.map((r) => ({
            vehicleTypeId: r.vehicleTypeId,
            vehicleType: r.vehicleType,
            priorMinutes: r.priorMinutes,
          }))
        )
      );

// ✅ Send managerApproval as true/false
formData.append("managerApproval", managerApproval ? "true" : "false");
      if (companyLogo) formData.append("companyLogo", companyLogo);

      await axiosInstance.post("/emp/createCompany", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Company saved successfully!", "success");
      navigate("/master/company/list");
    } catch (error: any) {
      showToast("Already exists. Please try again.", "warn");
    }
  };

  return (
    <PageLayout>
      <AlertContainer />
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800">Add Company</h1>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Company Info */}
<div className="bg-white py-4 px-4 rounded-lg shadow-sm">            <h2 className="text-xl font-semibold text-[#025A64] flex items-center gap-2 py-3 underline">
              <FontAwesomeIcon icon={faBuilding} />
              Company Info
            </h2>

<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
<div className="w-full">
                 <InputBox
  label={
    <span>
      Company Name <span className="text-red-500">*</span>
    </span>
  }
  name="companyName"
  icon={faBuilding}
  placeholder="Enter company name"
/>
              </div>
              <div className="w-full">
  <InputBox
    label={
      <span>
        Company Code <span className="text-red-500">*</span>
      </span>
    }
    name="companyCode"
    icon={faReceipt}
    placeholder="Enter company code"
  />
</div>


              <div className="w-full">
                <InputBox label="seoUrl" name="seoUrl" icon={faLink} placeholder="company-name-seo-url" />
              </div>

           <div className="flex flex-col">
  <InputBox
    label={
      <span>
        Manager Emails <span className="text-red-500">*</span>
      </span>
    }
    name="managerEmails"
   isTextarea
    icon={faEnvelope}
    placeholder="Enter manager email(s)"
  />

  <span className="text-xs text-gray-500 mt-1">
    Separate multiple emails with comma (,) or new line.
  </span>
</div>

              <div className="w-full">
                <InputBox
                  label="Domain Name"
                  name="domainName"
                 
                  icon={faGlobe}
                  placeholder="Enter domain name(s)"
                />
              </div>

              <div className="w-full">
                <InputBox label="GST Number" name="gstNo" icon={faFileInvoice} placeholder="Enter GST Number" />
              </div>

              <div className="w-full">
                <label className="block mb-1 font-medium">Company Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
<div className="w-full">
  <InputBox
    label="Company Address"
    name="companyAddress"
    
    icon={faBuilding}
    placeholder="Enter company address"
  />
</div>

              {/* ✅ Allow Tax checkbox with state */}
              <div className="w-full">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowTax}
                    onChange={(e) => setAllowTax(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Allow Tax</span>
                </label>
              </div>

              {/* ✅ Need Email checkbox with state */}
              <div className="w-full">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needEmail}
                    onChange={(e) => setNeedEmail(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Need Email</span>
                </label>
              </div>

              {/* ✅ Manager Approval checkbox */}
{showManagerApproval && (
  <div className="w-full">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={managerApproval}
        onChange={(e) => setManagerApproval(e.target.checked)}
        className="w-4 h-4"
      />
      <span className="font-medium">
        Manager Approval Required
      </span>
    </label>
  </div>
)}
              
            </div>
          </div>

          {/* Booking Rule */}
          <div>
            <h2 className="text-lg font-semibold text-[#275981] mb-4 underline">
              <FontAwesomeIcon icon={faChain} /> Booking Rule
            </h2>

            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-gray-700">Vehicle Type Advance Booking Hours</div>
              <CommonButton type="button" variant="success" onClick={fetchVehicleRules} disabled={rulesLoading}>
                {rulesLoading ? "Refreshing..." : "Refresh"}
              </CommonButton>
            </div>

            <DataTable
              columns={bookingRuleColumns}
              data={vehicleRules}
              loading={rulesLoading}
              rowsPerPage={5}
              emptyMessage="No vehicle types found"
              onEdit={(row) => openEdit(row)}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <CommonButton type="submit" variant="success" className="px-8 py-3">
              Save
            </CommonButton>
          </div>
        </form>

        {/* Edit Modal */}
        {editOpen && editRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="font-semibold text-gray-800">
                  Edit Advance Booking Hours — {editRow.vehicleType}
                </div>
                <button type="button" onClick={closeEdit} className="p-2 rounded hover:bg-gray-100">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Advance Booking Hours</label>
                <input
                  type="number"
                  value={editPriorMinutes}
                  onChange={(e) => setEditPriorMinutes(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  min={0}
                />
              </div>

              <div className="px-4 py-3 border-t flex justify-end gap-2">
                <CommonButton type="button" variant="secondary" onClick={closeEdit}>
                  Cancel
                </CommonButton>
                <CommonButton type="button" variant="success" onClick={saveEdit} disabled={editSaving}>
                  <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                  {editSaving ? "Saving..." : "Save"}
                </CommonButton>
              </div>
            </div>
          </div>
        )}
      </main>
    </PageLayout>
  );
}
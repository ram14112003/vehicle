import React, { useState, useEffect } from "react";
import PageLayout from "../../../components/PageLayout";
import CommonButton from "../../../components/CommonButton";
import InputBox from "../../../components/InputBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPercent,
  faClock,
  faCalendarDay,
  faCircleInfo,
  faHashtag,
  faPlay,
  faServer,
  faEnvelope,
  faLock,
  faEthernet,
} from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "../../../utils/axiosInstance";
import { showToast } from "../../../components/AlertBox";

interface ConfigResponse {
  success: boolean;
  message: string;
  data?: any;
}

const Configuration: React.FC = () => {
  const [form, setForm] = useState({
    serviceTax: "",
    cancelBookingHours: "",
    dueDays: "",
    invoiceNoPrefix: "",
    invoiceNoStart: "",
    smtpServer: "",
    smtpEmail: "",
    smtpPassword: "",
    smtpPort: "",
    outstationHasTax: false,
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const handleInputBoxChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  // Fetch config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axiosInstance.get<ConfigResponse>("/config/getConfiguration");
        if (res.data.success && res.data.data) {
          const config = res.data.data;
          setForm({
            serviceTax: config.serviceTaxPercentage?.toString() || "",
            cancelBookingHours: config.cancelBookingHours?.toString() || "",
            dueDays: config.dueDays?.toString() || "",
            invoiceNoPrefix: config.invoiceNoPrefix || "",
            invoiceNoStart: config.invoiceNoStartingFrom?.toString() || "",
            smtpServer: config.smtpServer || "",
            smtpEmail: config.smtpEmailAddress || "",
            smtpPassword: config.smtpEmailPassword || "",
            smtpPort: config.smtpEmailPort?.toString() || "",
            outstationHasTax: !!config.outstationHasTax,
          });
        } else {
          showToast(res.data.message, "error");
        }
      } catch (error) {
       
        showToast("Failed to fetch configuration", "error");
      } finally {
        setFetching(false);
      }
    };

    fetchConfig();
  }, []);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosInstance.post<ConfigResponse>("/config/createConfiguration", {
        serviceTaxPercentage: Number(form.serviceTax),
        cancelBookingHours: Number(form.cancelBookingHours),
        dueDays: Number(form.dueDays),
        invoiceNoPrefix: form.invoiceNoPrefix,
        invoiceNoStartingFrom: Number(form.invoiceNoStart),
        smtpServer: form.smtpServer,
        smtpEmailAddress: form.smtpEmail,
        smtpEmailPassword: form.smtpPassword,
        smtpEmailPort: Number(form.smtpPort),
        outstationHasTax: form.outstationHasTax,
      });

      if (res.data.success) {
        showToast(res.data.message, "success");
      } else {
        showToast(res.data.message, "error");
      }
    } catch (error) {
     
      showToast("Failed to save configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <PageLayout>Loading configuration...</PageLayout>;

  return (
    <PageLayout>
      <div className="py-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Master Configuration</h2>

        {/* Info Section */}
        <h3 className="text-lg font-semibold mb-4 text-[#025A64] underline">
          <div className="flex items-center gap-x-2">
            <FontAwesomeIcon icon={faCircleInfo} />
            <span>Configuration Info</span>
          </div>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputBox label="Service Tax Percentage" name="serviceTax" type="number" required placeholder="Enter tax %" icon={faPercent} value={form.serviceTax} onChange={handleInputBoxChange}/>
            <InputBox label="Cancel Booking Hours" name="cancelBookingHours" type="number" required placeholder="e.g., 24" icon={faClock} value={form.cancelBookingHours} onChange={handleInputBoxChange}/>
            <InputBox label="Due Days" name="dueDays" type="number" required placeholder="e.g., 7" icon={faCalendarDay} value={form.dueDays} onChange={handleInputBoxChange}/>
            <InputBox label="Invoice No Prefix" name="invoiceNoPrefix" type="text" required placeholder="e.g., INV" icon={faHashtag} value={form.invoiceNoPrefix} onChange={handleInputBoxChange}/>
            <InputBox label="Invoice No Starting From" name="invoiceNoStart" type="number" required placeholder="e.g., 1000" icon={faPlay} value={form.invoiceNoStart} onChange={handleInputBoxChange}/>
          </div>

          {/* SMTP Info */}
          <h3 className="text-lg font-semibold text-[#025A64] underline">
            <div className="flex items-center gap-x-2">
              <FontAwesomeIcon icon={faCircleInfo} />
              <span>SMTP Info</span>
            </div>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputBox label="SMTP Server" name="smtpServer" type="text" required placeholder="e.g., smtp.gmail.com" icon={faServer} value={form.smtpServer} onChange={handleInputBoxChange}/>
            <InputBox label="SMTP Email Address" name="smtpEmail" type="email" required placeholder="e.g., you@example.com" icon={faEnvelope} value={form.smtpEmail} onChange={handleInputBoxChange}/>
            <InputBox label="SMTP Email Password" name="smtpPassword" type="password" required placeholder="Enter password" icon={faLock} value={form.smtpPassword} onChange={handleInputBoxChange}/>
            <InputBox label="SMTP Email Port" name="smtpPort" type="number" required placeholder="e.g., 587" icon={faEthernet} value={form.smtpPort} onChange={handleInputBoxChange}/>
            <div className="flex items-center mt-2">
              <input type="checkbox" name="outstationHasTax" checked={form.outstationHasTax} onChange={handleCheckboxChange} className="mr-2"/>
              <label className="text-sm font-medium">Outstation has Tax</label>
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <CommonButton text={loading ? "Saving..." : "Submit"} type="submit" variant="success" disabled={loading}/>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default Configuration;
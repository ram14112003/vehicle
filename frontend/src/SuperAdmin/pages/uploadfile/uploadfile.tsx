import { useState } from "react";
import axios from "axios";
import PageLayout from "../../../components/PageLayout";
import { AlertContainer, showToast } from "../../../components/AlertBox";
import config from "../../../config/config";

export default function UploadUsers() {
  const [file, setFile] = useState<File | null>(null);
const [inputKey, setInputKey] = useState(Date.now());
  const handleUpload = async () => {
    if (!file) {
      showToast("Please select Excel file first", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // const res = await axios.post(
      //   "http://localhost:5000/api/user/upload-users",
      //   formData
      // );
        const BASE_URL = config.baseurl.apibaseurl;

            const res = await axios.post(
               `${BASE_URL}/api/user/upload-users`,
              formData
            );

    //  showToast(res.data.message || "Users uploaded successfully", "success");
    if (res.data.summary.inserted === 0 && res.data.summary.updated === 0) {
      showToast(res.data.message, "error");
      } else {
      showToast(res.data.message, "success");
      }
    setFile(null);
  setInputKey(Date.now());
    } catch (err) {
      showToast("Upload failed", "error");
    }
  };

  return (
    <PageLayout>
      <AlertContainer />

      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">

          <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
            Upload Users (Excel)
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
            <input
             key={inputKey}
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
            />

            {file && (
              <p className="mt-3 text-sm text-green-600">
                Selected: {file.name}
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Upload File
          </button>

        </div>
      </div>
    </PageLayout>
  );
}
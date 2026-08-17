import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import PageLayout from "../../../components/PageLayout";
import axiosInstance from "../../../utils/axiosInstance";
import { showToast,AlertContainer } from "../../../components/AlertBox";

const EditEmail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // get emailConfigId
  const navigate = useNavigate();

  // 🔹 States
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [emailBCC, setEmailBCC] = useState("");
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 🔹 Fetch details by ID
  useEffect(() => {
   
    const fetchEmailConfig = async () => {
      try {
        const res = await axiosInstance.get(`/emailConfRoutes/getEmailConfById/${id}`);
        const data = res.data.emailConf;
        setSubject(data.subject || "");
        setMessage(data.message || "");
        setFromName(data.fromName || "");
        setFromAddress(data.fromAddress || "");
        setEmailBCC(data.emailBcc || "");
      } catch (err) {
       
        showToast("Failed to load email configuration","error");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEmailConfig();
  }, [id]);

  //  Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  //  Submit (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axiosInstance.put(`/emailConfRoutes/updateEmailConf/${id}`, {
        subject,
        message,
        fromName,
        fromAddress,
        emailBcc: emailBCC,
      });

      showToast("Email configuration updated successfully!","success");
      navigate("/email/configurations"); // go back to list
    } catch (err) {
      
      showToast("Failed to update email configuration","error");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <PageLayout>
      <AlertContainer />
      <div className="max-w-6xl mx-auto bg-white border border-gray-300 rounded-md p-6 mt-6 shadow-md">
        <h2 className="text-2xl font-semibold mb-2 text-gray-800">Edit Email Configuration</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              className="w-full border border-gray-400 px-3 py-2 rounded"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Message</label>
            <Editor
              apiKey="5cxmnr0pn9j08n8sasynohd5mkr2td49kgwxi57qp7w30n63"
              value={message}
              onEditorChange={(content) => setMessage(content)}
              init={{
                height: 400,
                menubar: true,
                plugins: ["advlist", "autolink", "lists", "link", "image", "table", "code"],
                toolbar:
                  "undo redo | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | code",
              }}
            />
          </div>

          {/* 🔹 Live Preview */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Preview</h3>
            <div
              className="border border-gray-300 rounded p-4 bg-gray-50"
              dangerouslySetInnerHTML={{ __html: message }}
            />
          </div>

          {/* From */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">From Name</label>
              <input
                type="text"
                className="w-full border border-gray-400 px-3 py-2 rounded"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">From Address</label>
              <input
                type="email"
                className="w-full border border-gray-400 px-3 py-2 rounded"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
              />
            </div>
          </div>

          {/* BCC */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Email BCC</label>
            <textarea
              className="w-full border border-gray-400 px-3 py-2 rounded h-20"
              value={emailBCC}
              onChange={(e) => setEmailBCC(e.target.value)}
              placeholder="Optional"
            />
          </div>

          {/* Attachments */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Submit */}
          <div className="text-center mt-6">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default EditEmail;

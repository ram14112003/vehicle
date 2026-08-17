import React, { useState } from 'react';
import SimpleHeader from './simpleheader';
import Footer from './Footer';
import axiosInstance from '../../utils/axiosInstance'; // Adjust path if needed
import { showToast , AlertContainer} from "../AlertBox";
interface FormData {
  name: string;
  email: string;
  vehicleType: string;
  registrationYear: string;
  presentAddress: string;
  cityPreferred: string;
  fuelType: string;
  passengerCapacity: string;
  contactNumber: string;
  licenseNo: string;
  registrationNumber: string;
}

export default function PartnerRegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    vehicleType: '',
    registrationYear: '',
    presentAddress: '',
    cityPreferred: '',
    fuelType: '',
    passengerCapacity: '',
    contactNumber: '',
   licenseNo: '',
    registrationNumber: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // VALIDATION FUNCTION
  const validateForm = () => {
    const { name, email, contactNumber, registrationNumber,licenseNo } = formData;

    if (!name.trim()) return showToast("Please enter your name!", "error");

    if (!email) return showToast("Please enter your email!", "error");
if (!licenseNo)
  return showToast("Please enter License Number!", "error");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return showToast("Please enter a valid email address!", "error");

    if (!contactNumber)
      return showToast("Please enter your phone number!", "error");

    if (!/^[6-9]\d{9}$/.test(contactNumber))
      return showToast("Invalid phone number!", "error");

    if (!registrationNumber)
      return showToast("Please enter vehicle registration number!", "error");

    const regNumRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
    if (!regNumRegex.test(registrationNumber))
      return showToast("Invalid registration number!", "error");

    return true;
  };

const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await axiosInstance.post("/order/partners", formData);

      if (response.data?.success) {
        showToast("Form submitted successfully! 🎉", "success");

        setFormData({
          name: "",
          email: "",
          vehicleType: "",
          registrationYear: "",
          presentAddress: "",
          cityPreferred: "",
          fuelType: "",
          passengerCapacity: "",
          contactNumber: "",
          licenseNo: '',
          registrationNumber: "",
        });
      } else {
        showToast(response.data?.message || "Submission failed!", "error");
      }
    } catch (error: any) {
      showToast(
        error?.response?.data?.message ||
          "Something went wrong! Try again later.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SimpleHeader />
      <AlertContainer/>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">Partner With Us</h1>
            <p className="text-xl text-gray-600">Yellow Plate Commercial Cabs Required!</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Name */}
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name*"
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
              />

              {/* Present Address */}
              <input
                type="text"
                name="presentAddress"
                value={formData.presentAddress}
                onChange={handleChange}
                placeholder="Present Address*"
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
              />

              {/* Contact Number */}
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="Contact Number*"
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
              />

              {/* Email */}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email*"
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
              />

              {/* City Preferred */}
              <select
                name="cityPreferred"
                value={formData.cityPreferred}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
              >
                <option value="">City Preferred*</option>
                <option value="chennai">Chennai</option>
                <option value="bangalore">Bangalore</option>
                <option value="mumbai">Mumbai</option>
                <option value="delhi">Delhi</option>
                <option value="hyderabad">Hyderabad</option>
                <option value="pune">Pune</option>
              </select>

              {/* Vehicle Name */}
             <input
  type="text"
  name="licenseNo"
  value={formData.licenseNo}
  onChange={handleChange}
  placeholder="Driving License Number*"
  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
/>


              {/* Vehicle Type */}
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
              >
                <option value="">Vehicle Name*</option>
                <option value="sedan">Swift</option>
                <option value="etios">Etios</option>
                <option value="auro">Aura</option>
                <option value="ertiga">Ertiga</option>
                <option value="xylo">Xylo</option>
                <option value="toyotainnova">Toyota Innova</option>
                <option value="toyotacrysta">Toyota Crysta</option>
                <option value="forcetempo">Force Tempo</option>
                <option value="urbania">Urbania</option>
                <option value="others">Others</option>


                
              </select>

              {/* Fuel Type */}
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
              >
                <option value="">Fuel Type*</option>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="cng">CNG</option>
                <option value="electric">Electric</option>
              </select>

              {/* Registration Number */}
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="Registration Number*"
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
              />

              {/* Registration Date */}
              <input
                type="text"
                name="registrationYear"
                value={formData.registrationYear}
                onChange={handleChange}
                placeholder="Registration Date/Vehicle Year*"
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
              />

              {/* Passenger Capacity */}
              <input
                type="number"
                name="passengerCapacity"
                value={formData.passengerCapacity}
                onChange={handleChange}
                placeholder="Passenger Capacity*"
                min="1"
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:bg-white hover:border-blue-900 transition-all"
              />

              {/* Submit Button */}
              <div className="flex items-end">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full px-12 py-3 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Sending...' : 'SEND NOW'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

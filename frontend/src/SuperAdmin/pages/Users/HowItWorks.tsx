
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // 👈 import navigate
import TravelHeader from "./header";

const steps = [
  {
    id: 1,
    title: "Fill Booking Details",
    description:
      "Start by filling in your travel requirements. Select your pickup date and time, choose whether you're booking for yourself or on behalf of someone else, and pick your travel package.",
    detailedSteps: [
      "Select Pickup Date & Time using the date picker",
      "Choose 'Self' or 'On behalf of' for booking type",
      "Select your Travel Package (Outstation, Local city use, or Airport)",
      "Choose your Pickup City from the dropdown",
      "Enter your Pickup Point/Area details",
      "Enter your Destination City or Drop Point",
      "Select your preferred Car Type (Hatchback, Sedan, SUV, etc.)",
    ],
    image: "/images/step1.jpeg",
  },
  {
    id: 2,
    title: "Choose Your Vehicle",
    description:
      "After filling the booking details, view available vehicles that match your requirements. You can see vehicle images, pricing details, and additional charges clearly displayed.",
    detailedSteps: [
      "Review available vehicles for your selected car type",
      "Check vehicle details including Per KM charges and Per Hour rates",
      "View Additional Per KM and Driver Batta charges",
      "See Available Packages with pricing (Per KM, Driver Batta, Amount)",
      "Review the Booking Schedule with day-wise timings",
      "Compare different vehicles and their pricing",
      "Select the vehicle that best fits your budget and needs",
    ],
    image: "/images/step2.jpeg",
  },
  {
    id: 3,
    title: "Review & Book",
    description:
      "Once you've selected your vehicle, review all your booking details including pickup/drop points, schedule, and pricing. Verify everything is correct before confirming your booking.",
    detailedSteps: [
      "Review your complete Booking Details section",
      "Verify Pickup Date, Travel Package, and Cities",
      "Check Pickup Point and Drop Point details",
      "Confirm your selected Car Type",
      "Review the Booking Schedule for all days",
      "Check Start Time, End Time, and Prior Minutes",
      "Click 'Book a cab' button to confirm your booking",
      "Proceed to payment and receive booking confirmation",
    ],
    image: "/images/step3.jpeg",
  },
];

const HowItWorks = () => {
  const navigate = useNavigate();

  // 👇 Function to handle button click
  const handleBookNow = () => {
    const userId = localStorage.getItem("userId");
    const companyId = localStorage.getItem("companyId");

    if (!userId || !companyId) {
      alert("Missing user or company details. Please log in again.");
      return;
    }

    // Navigate to the invoice page dynamically
    navigate(`/users/userinvoice/${userId}?companyId=${companyId}`);
  };

  return (
    <>
<TravelHeader />

    <div className="relative bg-gradient-to-br from-gray-50 to-white min-h-screen py-20 px-4 md:px-8 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#275981] rounded-full blur-3xl opacity-10"></div>
      <div className="absolute bottom-40 left-10 w-96 h-96 bg-[#275981] rounded-full blur-3xl opacity-10"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-block px-6 py-2 bg-[#275981] rounded-full mb-4">
            <span className="text-white font-semibold text-sm tracking-wider uppercase">
              Simple & Easy
            </span>
          </div>
          <h2 className="text-3xl md:text-3xl font-bold text-gray-900 mb-4">
            How To <span className="text-[#275981]">Book Your Ride</span>
          </h2>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Book your cab in three simple steps - Quick, Easy & Hassle-free
          </p>
        </motion.div>

        {/* Steps Section */}
        <div className="space-y-20">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative"
            >
              {/* Step Badge */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-6"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-[#275981] rounded-2xl transform rotate-12">
                  <span className="text-white text-xl font-bold transform -rotate-12">
                    {step.id}
                  </span>
                </div>
                <div className="h-1 flex-grow bg-[#275981] rounded-full max-w-[100px] opacity-70"></div>
              </motion.div>

              <h3 className="text-3xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
                Step {step.id}.{" "}
                <span className="text-[#275981]">{step.title}</span>
              </h3>

              <p className="text-gray-600 text-md leading-relaxed mb-6 max-w-3xl">
                {step.description}
              </p>

              <div className="mb-8 space-y-3 bg-white p-6 rounded-2xl border border-gray-100">
                <h4 className="text-lg font-semibold text-[#275981] mb-3">
                  What you need to do:
                </h4>
                {step.detailedSteps.map((detail, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-[#275981] flex-shrink-0"></div>
                    <p className="text-gray-700 text-base leading-relaxed">
                      {detail}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Step Image */}
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-[#275981] w-[400px] rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative bg-[#275981] p-1 w-[400px] rounded-3xl">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="rounded-3xl w-[400px] h-auto object-cover"
                  />
                </div>
              </motion.div>

              {index < steps.length - 1 && (
                <div className="mx-8 mt-12 w-1 h-16 bg-[#275981] opacity-30"></div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-r from-[#275981] to-[#1e4461] p-12 rounded-3xl">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Book Your Cab?
            </h3>
            <p className="text-gray-200 text-lg mb-8">
              Experience seamless booking with Grace Cabs - Your trusted travel
              partner
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookNow} // 👈 navigate when clicked
              className="bg-white text-[#275981] px-12 py-5 rounded-2xl font-bold text-xl transition-colors duration-300 hover:bg-gray-100"
            >
              Book Your Ride Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>

    </>
  );
};

export default HowItWorks;

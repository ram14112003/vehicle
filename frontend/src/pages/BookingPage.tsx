import React from "react";
import Navbar from "../components/Navigation/Navbar";
import Footer from "../components/Navigation/Footer";
import BookingFlow from "../components/Booking/BookingFlow";

export const BookingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BookingFlow />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingPage;

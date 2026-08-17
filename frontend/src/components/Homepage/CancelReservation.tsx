import React from 'react';
import { Link } from 'react-router-dom';
import Footer from './Footer';
import SimpleHeader from './simpleheader';

const CancelReservation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-3">
          <Link
            to="/"
            className="text-green-700 font-medium hover:text-green-900 transition-colors duration-200"
          >
            Home
          </Link>{' '}
          <span className="mx-2">›</span>{' '}
          <span className="text-gray-700">Cancel Reservation</span>
        </nav>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#003366' }}>
          Cancel Reservation
        </h2>
        {/* Intro */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
          <p className="text-gray-700 leading-relaxed text-sm md:text-base">
            We understand that plans can change. Below are our cancellation and refund policies to help you
            understand the terms when canceling your reservation with Grace Travel.
          </p>
        </div>

        {/* Cancellation Policy */}
        <section className="bg-white rounded-lg shadow-sm p-5">
 <h3 className="text-2xl font-bold mb-6" style={{ color: '#009970' }}>
            Cancellation Policy
          </h3>

          <div className="space-y-4">
            {/* Policy 1 */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">Cancellation 24+ Hours Prior</h4>
                <p className="text-gray-700 text-sm md:text-base">
                  If a traveler cancels <strong>24 hours prior</strong> to the pick-up time,{' '}
                  <strong className="text-blue-600">10% of the total trip cost will be deducted</strong>.
                </p>
              </div>
            </div>

            {/* Policy 2 */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">Cancellation Within 24 Hours</h4>
                <p className="text-gray-700 text-sm md:text-base">
                  If a traveler cancels <strong>within 24 hours</strong> of the pick-up time,{' '}
                  <strong className="text-blue-600">no refund</strong> will be provided.
                </p>
              </div>
            </div>

            {/* Policy 3 */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">Refund Method</h4>
                <p className="text-gray-700 text-sm md:text-base">
                  Refunds will be made by{' '}
                  <strong className="text-blue-600">online transfer to the customer’s bank account</strong>. No cash
                  refund requests will be accepted.
                </p>
              </div>
            </div>

            {/* Policy 4 */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">Refund Processing Time</h4>
                <p className="text-gray-700 text-sm md:text-base">
                  The amount will be refunded approximately within{' '}
                  <strong className="text-blue-600">7 business days</strong> from the date of cancellation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CancelReservation;

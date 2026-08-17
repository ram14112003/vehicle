import React from 'react';
import Footer from "./Footer";
import SimpleHeader from './simpleheader';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-3">
          <Link
            to="/"
            className="text-green-700 font-medium hover:text-green-900 transition-colors duration-200"
          >
            Home
          </Link>{' '}
          <span className="mx-2">›</span>{' '}
          <span className="text-gray-700">Privacy Policy</span>
        </nav>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#003366' }}>
          Privacy Policy
        </h2>

        {/* Main Intro Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Grace Cabs respects your privacy and recognizes the need to protect the personally identifiable information you share with us.
              We follow appropriate standards when it comes to protecting your privacy on our websites.
            </p>

            <p>
              There are times when we may collect personal information from you such as name, physical address or telephone number.
              It is our intent to inform you before we do that and explain how the information will be used.
              If you choose not to provide the information we request, you can still visit the Grace Cabs website, 
              but some services may not be accessible.
            </p>
          </div>
        </div>

        {/* Info Protection Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-2xl font-bold text-teal-600 mb-4">Information Protection</h3>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Grace Cabs will not sell, trade, or disclose any information derived from the registration or use of
              any online service (including names and addresses) without the consent of the user or customer,
              unless required by law.
            </p>
            <p>
              We have implemented technology, security features, and strict policy guidelines to safeguard
              your identifiable information from unauthorized access or improper use.
            </p>
          </div>
        </section>

        {/* Security Measures Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-2xl font-bold text-teal-600 mb-4">Security Measures</h3>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Grace Cabs will continue to enhance our security procedures as new technology becomes available.
              If our privacy policy changes, it will be posted here with a new effective date.
            </p>
            <p>
              We attempt to respond to all concerns or inquiries within five business days of receipt.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FULL PRIVACY POLICY YOU PROVIDED ADDED BELOW */}
        {/* ------------------------------------------------------------- */}

        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-2xl font-bold text-teal-600 mb-4">
            <strong>Cab Booking App</strong> — Full Privacy Policy
          </h3>

          <div className="space-y-6 text-gray-700 leading-relaxed">

            <p><strong>Effective Date:</strong> November 24, 2025</p>

            <p>
              At Grace Cabs Private Limited ("Company," "we," "our," "us"), we take your privacy seriously. 
              This Privacy Policy explains how we handle your information when you use our website or mobile application <strong>Cab Booking App</strong>.
              This must be read along with our Terms and Conditions: https://gracecabs.com/.
            </p>

            <p>
              By accessing or using the <strong>Cab Booking App</strong>, you agree to be governed by this Privacy Policy.
            </p>

            {/* 1. INFORMATION WE COLLECT */}
            <h4 className="text-xl font-semibold text-teal-700">1. Information We Collect</h4>

            <p className="font-semibold">A. Personal Information You Provide</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>User/Client Account Data: Name, email, phone number, address.</li>
              <li>Booking Details: Pick-up/drop-off locations, times, trip requirements.</li>
              <li>Payment Information: Deposit and invoicing details handled securely.</li>
              <li>Communications: Support calls, messages, email interactions.</li>
            </ul>

            <p className="font-semibold">B. Information Collected Through the App</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Precise Location Data: Real-time tracking for Hirer/Client and Driver.</li>
              <li>Electronic Signature: Driver e-sign at trip completion.</li>
              <li>Trip Data: Route, start time, end time, distance.</li>
              <li>Device Information: OS, device model, identifiers.</li>
              <li>Usage Details: Actions performed inside the <strong>Cab Booking App</strong> (booking, approval, trip start/end).</li>
            </ul>

            {/* 2. HOW WE USE INFO */}
            <h4 className="text-xl font-semibold text-teal-700">2. How We Use Your Information</h4>

            <ul className="list-disc ml-6 space-y-2">
              <li>To process bookings through the <strong>Cab Booking App</strong>, assign vendors/drivers, and track trips.</li>
              <li>To manage deposits and assist in vendor invoicing.</li>
              <li>To ensure safety, fraud prevention, and terms enforcement.</li>
              <li>To communicate booking updates, trip info & support messages.</li>
              <li>To ensure proper functioning and prevent misuse of the <strong>Cab Booking App</strong>.</li>
              <li>To comply with legal and regulatory obligations.</li>
            </ul>

            {/* 3. SHARING */}
            <h4 className="text-xl font-semibold text-teal-700">3. Sharing of Information</h4>

            <ul className="list-disc ml-6 space-y-2">
              <li><strong>With Vendors/Drivers:</strong> Name, phone number, pickup/drop details.</li>
              <li><strong>With Clients:</strong> Driver identity and real-time location.</li>
              <li><strong>Third Parties:</strong> Payment processors, mapping services, analytics.</li>
              <li><strong>Legal Reasons:</strong> When required by law or to protect safety.</li>
            </ul>

            {/* 4. SECURITY */}
            <h4 className="text-xl font-semibold text-teal-700">4. Information Protection & Security</h4>

            <ul className="list-disc ml-6 space-y-2">
              <li>We use appropriate security measures to protect your data.</li>
              <li>All tracking & e-sign data from the <strong>Cab Booking App</strong> is securely stored.</li>
              <li>Users/Vendors/Drivers must maintain login confidentiality.</li>
            </ul>

            {/* 5. CONTACT */}
            <h4 className="text-xl font-semibold text-teal-700">5. Contact Us</h4>

            <p>If you have concerns or questions:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Email: <strong>traveldesk@gracecabs.com</strong></li>
              <li>Call Center: <strong>+91 98417 22675</strong></li>
              <li>Address: 7/621, Nesamani Nagar Ext, Perumbakkam, Sholinganallur, Chennai – 600100</li>
            </ul>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

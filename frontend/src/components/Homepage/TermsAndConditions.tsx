import React from 'react';
import SimpleHeader from './simpleheader';
import Footer from './Footer';
import { Link } from 'react-router-dom';

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
     
<SimpleHeader/>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
   {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-3">
          <Link
            to="/"
            className="text-green-700 font-medium hover:text-green-900 transition-colors duration-200"
          >
            Home
          </Link>{' '}
          <span className="mx-2">›</span>{' '}
          <span className="text-gray-700">Terms And Conditions</span>
        </nav>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#003366' }}>
          Terms And Conditions
        </h2>



        
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <p className="text-gray-700 leading-relaxed mb-4">
            The information contained in this website is for general information purposes only. The information is provided by Grace Cabs and while we endeavor to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose. Any reliance you place on such information is therefore strictly at your own risk.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            In no event will we be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this website.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Through this website you are able to link to other websites which are not under the control of Grace Cabs. We have no control over the nature, content and availability of those sites. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Every effort is made to keep the website up and running smoothly. However, Grace Cabs takes no responsibility for, and will not be liable for, the website being temporarily unavailable due to technical issues beyond our control.
          </p>
        </div>

        {/* Definitions Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-2xl font-bold text-teal-600 mb-4">Definitions</h3>
          <p className="text-gray-700 mb-4">
            In this document, the following definitions are to be used and so interpreted, except for when the context implies other meanings:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li><strong>Company</strong> will refer to Grace Cabs.</li>
            <li><strong>Employee</strong> will refer to any of the Company's employees including, but not limited to, a driver, a member of the sales and support team, a technician or a member of the administration board.</li>
            <li><strong>Hirer or Client</strong> will refer to the person who signed the contract and who is responsible to pay the fees.</li>
            <li><strong>Contract</strong> will refer to the legal agreement between the Company and the Hirer that specifies all aspects of the service.</li>
            <li><strong>Hire period</strong> will refer to the period of time for which the Car was reserved.</li>
            <li><strong>Booking</strong> will refer to the period of time for which the Client has honored the Hire agreement and the corresponding amounts have been paid in full.</li>
            <li><strong>Reservation</strong> will refer to a Hire contract in which a deposit was made but the amount was not paid in full yet.</li>
            <li><strong>Vehicle or Car</strong> will refer to the car that the Company offers the Hirer.</li>
            <li><strong>Balance</strong> will refer to the amounts due under these Terms and Conditions, less whatever deposits have been paid, if any.</li>
            <li><strong>Chauffeur or Driver</strong> will refer to the Employee who will drive the Vehicle.</li>
            <li><strong>Party</strong> will refer to the person or group of people who accompany the Client inside the Vehicle.</li>
            <li><strong>Deposit</strong> will refer to the charges due under the present Terms and Conditions of agreement that are necessary to secure a Reservation.</li>
            <li><strong>Charge</strong> will refer to the amount paid by the Client in exchange for which the Company assumes its obligations stated in the Contract.</li>
          </ul>
        </section>

        {/* Responsibilities Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-2xl font-bold text-teal-600 mb-4">Responsibilities</h3>
          <div className="space-y-4 text-gray-700">
            <p>
              The Hirer is responsible and will be held accountable for the proper behavior of all the passengers in his Party. The Hirer is responsible and will be held accountable for any damages caused to either the inside or the outside of the Car by the Client or a member of the Party, regardless of how these were caused, as long as the aforementioned damages aren't the result of the normal operating of the vehicle.
            </p>
            <p>
              The Company is not to be held accountable for any personal injuries or property damages arising from the misconduct of the Hirer or a member of the Party.
            </p>
            <p>
              The Company is not to be held liable or in any way responsible for any items left in the vehicle. It is solely the Hirer's responsibility to make sure that neither the Hirer nor a member of the Party leaves any personal belongings unattended in the Vehicle.
            </p>
            <p>
              The Hirer is solely responsible for the general conduct of the Party.
            </p>
            <p>
              The Hirer will be held responsible, on behalf of the whole Party, for any losses or property damages incurred by the Company following their misconduct.
            </p>
          </div>
        </section>

        {/* General Conduct Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-2xl font-bold text-teal-600 mb-4">General Conduct</h3>
          <div className="space-y-4 text-gray-700">
            <p>
              Consumption of food is not allowed inside the Vehicle, unless specific agreements have been made prior to the Booking and consigned in writing.
            </p>
            <p>
              Underage drinking is not allowed inside the Vehicle.
            </p>
            <p>
              If the Vehicle requires cleaning after the Client has finished using it, and the mess has been caused by the Client or a member of his Party, the Client will be held liable for the cleaning expenses.
            </p>
          </div>
        </section>

        {/* Safety Requirements Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-2xl font-bold text-teal-600 mb-4">Safety Requirements</h3>
          <div className="space-y-4 text-gray-700">
            <p>
              The Company has a strict no-smoking policy inside all Vehicles. Failure to comply with this requirement may lead to the immediate cancellation of the Contract, without a refund.
            </p>
            <p>
              The Client and each member of his Party must wear a seat belt. All the Vehicles in the Company's fleet are equipped with as many seat belts as the maximum number of passengers that the Vehicle is allowed to carry.
            </p>
            <p>
              The Company strongly prohibits the use of illegal drugs or employing any illegal activities while inside the Car. Failing to comply with this may result in immediate cancellation of the Contract, without any refunds.
            </p>
            <p>
              In the event of an emergency, only the Driver will be allowed to open and close the doors, as a safety measure against accidents or other damages to the Vehicle.
            </p>
            <p>
              The Hirer agrees not to carry more members of the Party than the Vehicle can legally carry. The maximum allowed number of passengers in a Company's Vehicle is given by the total number of seats equipped with a seat belt.
            </p>
            <p>
              Irresponsible behavior from the Hirer or the Party may lead to damage to the Vehicle or put the safety of others at risk, and shall not be tolerated in any form.
            </p>
          </div>
        </section>

        {/* Limitation of Liability Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-2xl font-bold text-teal-600 mb-4">Limitation of Liability</h3>
          <div className="space-y-4 text-gray-700">
            <p>
              The Hirer agrees not to hold the Company accountable for any losses directly or indirectly correlated with failure to meet the Hirer's deadlines.
            </p>
            <p>
              The Hirer agrees that the car equipment, such as LCD screens and DVD players, are provided as a courtesy addon and their presence is in no way guaranteed by the Contract.
            </p>
            <p>
              If the Vehicle is involved in an accident, suffers from a mechanical failure or the Chauffeur decides that it is no longer safe to drive, the Company will do its best effort to arrange alternative transportation for the Hirer and the Party to the destination.
            </p>
            <p>
              Should, at any point, the Company accept responsibility for not meeting its contractual obligations, the settlement will be not larger than the Charge.
            </p>
            <p>
              The Company reserves its right to change the specifications of the vehicle at any time during the Hire period.
            </p>
          </div>
        </section>


{/* App Usage & Responsibilities Section */}
<section className="bg-white rounded-lg shadow-sm p-6 mb-6">
  <h3 className="text-2xl font-bold text-teal-600 mb-4">App Usage & Responsibilities</h3>
  <div className="space-y-4 text-gray-700">
    <p>
      In addition to the above terms, the Company provides a mobile application("cab booking app") through which Users, Vendors, and Drivers may manage their respective activities. Users who log in through the App can create bookings or orders directly. These bookings will appear in the User’s account, and Users can also view the status of their bookings at any time.
    </p>

    <p>
      Vendors who log in to the App may review the bookings or orders assigned to them and provide their approval for the same. Approval indicates acceptance of the details provided, as well as agreement to follow the Company’s service standards and operational guidelines. Vendors or Owners are responsible for ensuring the availability and suitability of vehicles and drivers assigned through the cab booking app.
    </p>

    <p>
      Drivers who log in to the App are able to view trips assigned to them. Drivers are required to use the App to start the trip when the journey physically begins and end the trip when the journey is completed. Accurate trip updates, responsible conduct, and compliance with Company policies remain mandatory while using the cab booking app.
    </p>

    <p>
      All parties using the App agree to provide accurate information at all times. Any misuse of the App, manipulation of booking data, alteration of trip information, or unauthorized activity may result in immediate suspension of access. All activity carried out through the App, including creating bookings, approving orders, starting and ending trips, or viewing information, is digitally recorded and considered valid and binding.
    </p>

    <p>
      Availability of the App is dependent on external technical services, and the Company is not liable for any issues arising from network interruptions, device malfunctions, or temporary technical failures. Responsibility for maintaining login confidentiality rests solely with the User, Vendor, or Driver accessing the cab booking app.
    </p>
  </div>
</section>
        {/* Final Considerations Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-2xl font-bold text-teal-600 mb-4">Final Considerations</h3>
          <div className="space-y-4 text-gray-700">
            <p>
              Should, at any point, be any of these terms and conditions be rendered invalid then this agreement will by no means be considered invalid. All other terms and conditions in this document shall remain in force.
            </p>
            <p>
              The Company may, at its sole discretion, refuse to sign a Contract with a Customer without any explanations.
            </p>
            <p>
              All figures quoted on this website are in INR and may change without prior notice.
            </p>
            <p>
              The Company reserves the right to cancel any Booking, at any time, for any reason, with or without explanations, and limits its liability to the amounts paid by the Customer for the Booking.
            </p>
            
            <div className="mt-6 space-y-2">
              <p>• Please do not insist and/or encourage the driver for overspeeding, jumping traffic signals, driving in wrong lane/side, overtaking, offroading, race/competition etc.</p>
              <p>• We strictly recommend NOT to leave any cash, valuables, precious items like laptops, mobiles, wallets, handbags, luggage etc in the vehicle.</p>
              <p>• Grace Cabs or any driver engaged through it will NOT be responsible for any loss, theft or damage.</p>
              <p>• Please insist the driver to display the company ID card every time the driver reports for your booking.</p>
              <p>• We accept payments ONLY in cash and should be made by the customer directly to the driver at the end of the booking.</p>
              <p>• Management is not responsible in case of any incidents if you hire a driver directly without office intimation.</p>
              <p>• Please do not support, insist and/or encourage the driver to drive the vehicle under any influence of alcohol, drugs etc.</p>
              <p>• For any grievance or complaints you can contact us at our call center or our support email address.</p>
            </div>
          </div>
        </section>
      </main>

   <Footer/>
    </div>
  );
};

export default TermsAndConditions;
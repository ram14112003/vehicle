import React from 'react';
import { MapPin, PhoneCall, Mail } from 'lucide-react';

const Contact: React.FC = () => (
  <section id="contact" className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      <h3 className="text-3xl font-bold text-[#0b2c6b] mb-2">CONTACT US
        <div className="w-16 h-1 bg-green-600 mt-2"></div>
      </h3>
      <p className="text-gray-600 mb-12 mt-4">Have any queries? get in touch today</p>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-green-600 mx-auto mb-4 animate-bounce" />
          <h4 className="font-semibold text-gray-800 mb-2">ADDRESS</h4>
          <p className="text-gray-600">
            Building No./Flat No.: 7/621, Nesamani Nagar ext
            Road/Street: Perumbakam, Sholinganallur
          </p>
          <p className="text-gray-600 text-sm mt-2">
            City/Town/Village: Tambaram
            District: Kancheepuram
            State: Tamil Nadu
            PIN Code: 600100          </p>
        </div>

        <div className="text-center">
          <PhoneCall className="w-12 h-12 text-green-600 mx-auto mb-4 shake-phone" />
          <h4 className="font-semibold text-gray-800 mb-2">PHONE NUMBER</h4>
          <p className="text-gray-600">+91 98417 22675</p>
          <p className="text-gray-600">+91 90032 41571</p>
          <p className="text-gray-600">+91 89250 72675</p>


          <style>{`
  @keyframes shakePhone {
    0% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
    100% { transform: translateX(0); }
  }

  .shake-phone {
    display: inline-block;
    animation: shakePhone 0.6s ease-in-out infinite;
  }
`}</style>
        </div>

        <div className="text-center">
          <Mail className="w-12 h-12 text-green-600 mx-auto mb-4 animate-bounce" />
          <h4 className="font-semibold text-gray-800 mb-2">EMAIL</h4>
          <p className="text-gray-600">traveldesk@gracecabs.com </p>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden shadow-lg">
        <iframe
          title="Grace Cabs Location Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.2!2d80.2447!3d12.8985!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a525d8f0000000f%3A0x1234567890abcdef!2sPerumbakkam%2C%20Chennai%2C%20Tamil%20Nadu%20600100!5e0!3m2!1sen!2sin!4v1696931503000!5m2!1sen!2sin"
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  </section>
);

export default Contact;
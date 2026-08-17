import React from 'react';

// CSS used: py-16, bg-blue-900, text-white, container, mx-auto, px-4, text-center, text-3xl, font-bold
// border-2, border-white, px-8, py-3, rounded, hover:bg-white, hover:text-blue-900

const CTA: React.FC = () => (
  <section className="py-16 bg-blue-900 text-white">
    <div className="container mx-auto px-4 text-center">
      <h3 className="text-3xl font-bold mb-4">Call To Action</h3>
      <p className="mb-8">Let anything be as it at your level</p>
      <button className="border-2 border-white px-8 py-3 rounded hover:bg-white hover:text-blue-900 transition">Call for Action</button>
    </div>
  </section>
);

export default CTA;

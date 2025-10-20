import React from 'react';

const Hero = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden md:flex">
      {/* Text Section */}
      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Trusted Lab Tests, Right at Your Home
        </h1>
        <p className="text-gray-700 text-lg mb-6">
          In association with ThyroCare, we bring NABL, CAP, and ISO certified lab services directly to you.
        </p>
        <div className="flex gap-4">
          <button className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition">
            Book a Test
          </button>
          <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
            View Packages
          </button>
        </div>
      </div>
      
      {/* Photo Section */}
      <div className="md:w-1/2 h-64 md:h-auto">
        <img 
          src="https://plus.unsplash.com/premium_photo-1661281397737-9b5d75b52c66?q=80&w=1470&auto=format&fit=crop" 
          alt="Lab technician" 
          className="w-full h-full object-cover" 
        />
      </div>
    </div>
  );
};

export default Hero;
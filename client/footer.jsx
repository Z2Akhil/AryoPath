import React from 'react';

// For the Facebook icon to work, you need to link Font Awesome in your main public/index.html file.
// Example: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

const Footer = () => {
  return (
    <footer className="bg-[#0e5474] text-[#b0c9d6] font-sans">
      <div className="max-w-7xl mx-auto px-10 py-12">
        
        {/* Main footer content grid */}
        {/* It's a 1-column grid on small screens, and a 3-column grid on medium screens and up (md:) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">

          {/* Column 1: About Us */}
          <div>
            <h3 className="font-bold text-white text-base mb-4">About Us</h3>
            <p className="leading-relaxed">
              DiagnosticCentres.in is your trusted partner for booking health packages and diagnostic tests with ease and confidence. We connect you with top-certified labs across the country.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-bold text-white text-base mb-4">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <a href="#" className="text-white underline transition-colors duration-200">Health Packages</a>
              <a href="#" className="hover:text-white hover:underline transition-colors duration-200">Thyrocare Packages</a>
              <a href="#" className="hover:text-white hover:underline transition-colors duration-200">Aarthi Scans and Labs</a>
              <a href="#" className="hover:text-white hover:underline transition-colors duration-200">Partner With Us</a>
              <a href="#" className="hover:text-white hover:underline transition-colors duration-200">Privacy & Terms</a>
            </nav>
          </div>

          {/* Column 3: Follow Us */}
          <div>
            <h3 className="font-bold text-white text-base mb-4">Follow Us</h3>
            <a 
              href="#" 
              aria-label="Facebook" 
              className="inline-flex items-center justify-center w-8 h-8 bg-[#3b5998] text-white rounded-sm hover:opacity-90 transition-opacity"
            >
              <i className="fab fa-facebook-f text-lg"></i>
            </a>
          </div>

        </div>

        {/* Bottom copyright section */}
        <div className="mt-12 pt-6 border-t border-gray-700 text-center text-sm">
          <p>&copy; 2025 DiagnosticCentres.in - All Rights Reserved.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
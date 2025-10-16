import React, { useState } from "react";
import { ShoppingCart, Menu, X } from "lucide-react"; // icons

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      {/* Top Header */}
      <div className="max-w-8xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Left: Logo and Company Name */}
        <div className="flex items-center gap-2">
          <img
            src="./lo.jpg"
            alt="Company Logo"
            className="w-10 h-10 object-contain"
          />
          <div className=" sm:block leading-tight">
            <span className="text-lg font-semibold text-gray-800">
              YourCompany
            </span>
            <p className="text-xs text-gray-500">
              In association with ThyroCare
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M9.5 17A7.5 7.5 0 109.5 2a7.5 7.5 0 000 15z"
              />
            </svg>
          </div>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <div className="relative">
            <ShoppingCart className="w-6 h-6 text-gray-700 cursor-pointer hover:text-blue-600 transition" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              2
            </span>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Secondary Navigation (visible on desktop) */}
      <nav className="hidden sm:flex max-w-8xl mx-auto px-6 py-2 border-t border-gray-100 bg-gray-50">
        <ul className="flex space-x-8 text-gray-700 font-medium text-sm">
          <li>
            <a href="#" className="hover:text-blue-600">
              Home
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-600">
              Popular Packages
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-600">
              All Tests
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-600">
              Offers
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-600">
              About Us
            </a>
          </li>
        </ul>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-col gap-3 text-gray-700 font-medium">
          <a href="#" className="hover:text-blue-600">
            Home
          </a>
          <a href="#" className="hover:text-blue-600">
            Popular Packages
          </a>
          <a href="#" className="hover:text-blue-600">
            All Tests
          </a>
          <a href="#" className="hover:text-blue-600">
            Offers
          </a>
          <a href="#" className="hover:text-blue-600">
            About Us
          </a>

          {/* Optional Mobile Search Bar */}
          <div className="mt-2">
            <input
              type="text"
              placeholder="Search..."
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

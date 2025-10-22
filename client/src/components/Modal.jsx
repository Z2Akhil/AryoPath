// src/components/Modal.jsx

import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ children, onClose }) => { // Removed title prop, handled in AuthModal
  return (
    // **** THIS IS THE IMPORTANT PART ****
    // Ensure this div has a semi-transparent background color.
    // bg-black bg-opacity-50 makes it dark gray and see-through.
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" // Use bg-opacity-50 here
      onClick={onClose} // Close modal when clicking the overlay
    >
      {/* This div is the "glass" panel. 
        - bg-white/80 makes it semi-transparent white.
        - backdrop-blur-md blurs WHATEVER IS BEHIND IT (which is the bg-opacity-50 overlay + page content).
      */}
      <div
        className="relative bg-white/80 backdrop-blur-md border border-gray-200/80 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 bg-transparent hover:bg-white/50 hover:text-gray-900 rounded-lg text-sm p-1.5 inline-flex items-center z-10"
        >
          <X size={20} />
          <span className="sr-only">Close modal</span>
        </button>

        {/* The children (LoginForm/RegisterForm + Welcome message) render inside */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
// src/components/Modal.jsx
import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ children,  onClose, showCloseButton = true }) => {
  return (
    // Standard dark overlay
    <div
      className="fixed inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Solid white background, wider modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden" // Keep max-w-3xl for 2-column layout
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 inline-flex items-center z-10"
          >
            <X size={20} />
            <span className="sr-only">Close modal</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
export default Modal;
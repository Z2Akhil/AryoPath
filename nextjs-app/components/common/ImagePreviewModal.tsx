"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
    imgSrc: string;
    name: string;
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imgSrc, name, onClose }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    if (!mounted || !imgSrc) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative max-w-3xl w-[95%] sm:w-full mx-4 shadow-2xl rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button — inside top-right corner */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center shadow-lg active:scale-90 z-10 backdrop-blur-sm"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                <img
                    src={imgSrc}
                    loading="lazy"
                    alt={name}
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/packagePic.webp";
                    }}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[90vh] object-contain block"
                />

                {name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-4 py-2">
                        <p className="text-center text-sm font-semibold text-white truncate">{name}</p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default ImagePreviewModal;

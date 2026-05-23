'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Info, HelpCircle } from 'lucide-react';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
    isLoading?: boolean;
}

const ConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning",
    isLoading = false
}: ConfirmationDialogProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const getIcon = () => {
        const iconClass = "w-6 h-6";
        switch (type) {
            case 'warning':
                return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
            case 'danger':
                return <AlertTriangle className={`${iconClass} text-red-500`} />;
            case 'info':
                return <Info className={`${iconClass} text-blue-500`} />;
            default:
                return <HelpCircle className={`${iconClass} text-gray-500`} />;
        }
    };

    const getButtonStyles = () => {
        switch (type) {
            case 'warning':
                return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
            case 'danger':
                return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
            case 'info':
                return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
            default:
                return "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500";
        }
    };

    return createPortal(
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full max-w-md relative transform transition-all duration-300 ease-out ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-50 rounded-full">
                            {getIcon()}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
                        disabled={isLoading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Message */}
                <div className="p-6">
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl 
                       hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 
                       focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 
                       focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow 
                       disabled:opacity-50 disabled:cursor-not-allowed ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
                                type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' :
                                    type === 'info' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' :
                                        'bg-gray-800 hover:bg-gray-900 focus:ring-gray-800'
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmationDialog;

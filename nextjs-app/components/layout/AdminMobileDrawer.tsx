'use client';

import React from 'react';
import Link from 'next/link';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdminAuth } from '@/providers/AdminAuthProvider';

interface MobileDrawerProps {
    open: boolean;
    onClose: () => void;
    productOpen: boolean;
    toggleProduct: () => void;
}

const AdminMobileDrawer: React.FC<MobileDrawerProps> = ({
    open,
    onClose,
    productOpen,
    toggleProduct
}) => {
    const { user } = useAdminAuth();

    if (!open) return null;

    const initial = user?.adminProfile?.name?.split(" ")[0][0] || 'A';
    const firstName = user?.adminProfile?.name?.split(" ")[0] || 'Admin';

    return (
        <>
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
            />

            <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-blue-700">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                                    <span className="text-white font-bold text-lg">{initial}</span>
                                </div>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Welcome, {firstName}</p>
                                <p className="text-sm text-blue-100">Admin Dashboard</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-blue-800 transition-colors"
                        >
                            <X size={20} className="text-white" />
                        </button>
                    </div>

                    <nav className="flex-1 p-6 overflow-y-auto">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4">Navigation</p>
                        <div className="space-y-2">
                            <Link href="/admin" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                Home
                            </Link>
                            <Link href="/admin/analytics" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                Analytics
                            </Link>
                            <Link href="/admin/orders" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                Orders
                            </Link>

                            {/* Products Accordion */}
                            <div className="space-y-2">
                                <button
                                    onClick={toggleProduct}
                                    className="flex justify-between items-center w-full px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                                >
                                    <span>Products</span>
                                    {productOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>

                                {productOpen && (
                                    <div className="pl-6 space-y-2 border-l-2 border-gray-100 ml-4">
                                        <Link href="/admin/offers" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                                            Offers
                                        </Link>
                                        <Link href="/admin/packages" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                                            Packages
                                        </Link>
                                        <Link href="/admin/tests" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                                            Tests
                                        </Link>
                                        <Link href="/admin/medicines" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                                            Medicines
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <Link href="/admin/doctors" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                Doctors
                            </Link>

                            <Link href="/admin/users" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                Users
                            </Link>
                            <Link href="/admin/notifications" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                Notifications
                            </Link>
                            <Link href="/admin/settings" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                Settings
                            </Link>
                            <Link href="/admin/account" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                Account
                            </Link>
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-500 text-center">© 2024 Ayropath Admin</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminMobileDrawer;

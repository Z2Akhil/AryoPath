'use client';

import React from 'react';
import Link from 'next/link';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';

interface MobileDrawerProps {
    open: boolean;
    onClose: () => void;
    analyticsOpen: boolean;
    toggleAnalytics: () => void;
    bookingsOpen: boolean;
    toggleBookings: () => void;
    productOpen: boolean;
    toggleProduct: () => void;
}

const AdminMobileDrawer: React.FC<MobileDrawerProps> = ({
    open,
    onClose,
    analyticsOpen,
    toggleAnalytics,
    bookingsOpen,
    toggleBookings,
    productOpen,
    toggleProduct
}) => {
    const { isAdmin, isStaff, hasPermission, user } = useAdminAuth();

    if (!open) return null;

    const displayName = isStaff
        ? ((user as any)?.name?.split(' ')[0] || 'Staff')
        : ((user as any)?.adminProfile?.name?.split(' ')[0] || 'Admin');

    const initial = displayName[0]?.toUpperCase() || 'A';
    const roleLabel = isAdmin ? 'Admin Dashboard' : 'Staff Portal';

    const showAnalytics     = isAdmin;
    const showLabOrders     = isAdmin || hasPermission(PERMISSIONS.LAB_ORDERS_VIEW);
    const showMedOrders     = isAdmin || hasPermission(PERMISSIONS.MED_ORDERS_VIEW);
    const showAppointments  = isAdmin || hasPermission(PERMISSIONS.APPOINTMENTS_VIEW);
    const showProducts      = isAdmin || hasPermission(PERMISSIONS.PRODUCTS_VIEW) || hasPermission(PERMISSIONS.MEDICINES_VIEW);
    const showMedicines     = isAdmin || hasPermission(PERMISSIONS.MEDICINES_VIEW);
    const showLabProducts   = isAdmin || hasPermission(PERMISSIONS.PRODUCTS_VIEW);
    const showDoctors       = isAdmin || hasPermission(PERMISSIONS.DOCTORS_VIEW);
    const showUsers         = isAdmin || hasPermission(PERMISSIONS.USERS_VIEW);
    const showNotifications = isAdmin || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW);
    const showHomepage      = isAdmin || hasPermission(PERMISSIONS.HOMEPAGE_EDIT);
    const showServices      = isAdmin || hasPermission(PERMISSIONS.SERVICES_VIEW);
    const showLabReceipt    = isAdmin || hasPermission(PERMISSIONS.LAB_RECEIPT_VIEW);
    const showPrescriptions = isAdmin || hasPermission(PERMISSIONS.PRESCRIPTION_BOOKING);

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
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                                <span className="text-white font-bold text-lg">{initial}</span>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Welcome, {displayName}</p>
                                <p className="text-sm text-blue-100">{roleLabel}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-blue-800 transition-colors">
                            <X size={20} className="text-white" />
                        </button>
                    </div>

                    <nav className="flex-1 p-6 overflow-y-auto">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4">Navigation</p>
                        <div className="space-y-2">
                            {/* Home — always */}
                            <Link href="/admin" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                Home
                            </Link>

                            {/* Analytics Accordion */}
                            {(showAnalytics || showMedicines || showAppointments) && (
                                <div className="space-y-2">
                                    <button
                                        onClick={toggleAnalytics}
                                        className="flex justify-between items-center w-full px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                                    >
                                        <span>Analytics</span>
                                        {analyticsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    {analyticsOpen && (
                                        <div className="pl-6 space-y-2 border-l-2 border-gray-100 ml-4">
                                            {showAnalytics && (
                                                <Link href="/admin/analytics" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Overview</Link>
                                            )}
                                            {showMedicines && (
                                                <Link href="/admin/medicine-dashboard" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Meds Sales</Link>
                                            )}
                                            {showAppointments && (
                                                <Link href="/admin/appointments/dashboard" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Consultations</Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {showHomepage && (
                                <Link href="/admin/homepage" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                    Homepage
                                </Link>
                            )}

                            {/* Bookings Accordion */}
                            {(showLabOrders || showMedOrders || showAppointments) && (
                                <div className="space-y-2">
                                    <button
                                        onClick={toggleBookings}
                                        className="flex justify-between items-center w-full px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                                    >
                                        <span>Bookings</span>
                                        {bookingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    {bookingsOpen && (
                                        <div className="pl-6 space-y-2 border-l-2 border-gray-100 ml-4">
                                            {showLabOrders && (
                                                <Link href="/admin/orders" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Lab Orders</Link>
                                            )}
                                            {showMedOrders && (
                                                <Link href="/admin/orders/medicine" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Meds Orders</Link>
                                            )}
                                            {showAppointments && (
                                                <Link href="/admin/appointments" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Appointments</Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Products Accordion */}
                            {showProducts && (
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
                                            {showLabProducts && (
                                                <>
                                                    <Link href="/admin/offers"   onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Offers</Link>
                                                    <Link href="/admin/packages" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Packages</Link>
                                                    <Link href="/admin/tests"    onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Tests</Link>
                                                </>
                                            )}
                                            {showMedicines && (
                                                <Link href="/admin/medicines" onClick={onClose} className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">Medicines</Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {showDoctors && (
                                <Link href="/admin/doctors" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                    Doctors
                                </Link>
                            )}

                            {showUsers && (
                                <Link href="/admin/users" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                    Users
                                </Link>
                            )}

                            {/* Staff — admin only */}
                            {isAdmin && (
                                <Link href="/admin/staff" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                    Staff
                                </Link>
                            )}

                            {showNotifications && (
                                <Link href="/admin/notifications" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                    Notifications
                                </Link>
                            )}

                            {/* Prescriptions — admin + staff with PRESCRIPTION_BOOKING */}
                            {showPrescriptions && (
                                <Link href="/admin/prescriptions" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                    Prescriptions
                                </Link>
                            )}

                            {/* Lab Receipt Generator — admin + staff with LAB_RECEIPT_VIEW */}
                            {showLabReceipt && (
                                <Link href="/admin/lab-receipt" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                    Lab Receipt
                                </Link>
                            )}

                            {/* Services — admin + staff with SERVICES_VIEW */}
                            {showServices && (
                                <Link href="/admin/settings/services" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                    Services
                                </Link>
                            )}

                            {/* Settings / Account — admin only */}
                            {isAdmin && (
                                <>
                                    <Link href="/admin/settings" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                        Settings
                                    </Link>
                                    <Link href="/admin/account" onClick={onClose} className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                                        Account
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>

                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-500 text-center">© 2024 Ayropath</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminMobileDrawer;

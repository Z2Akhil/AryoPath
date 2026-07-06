'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, BarChart3, Package, Users, Bell,
    Settings, UserCircle, ChevronLeft, ChevronRight,
    ChevronDown, ChevronUp, Stethoscope, Layers, UserCog, Star,
    ClipboardList, Printer, FileText,
} from 'lucide-react';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import adminPrescriptionApi from '@/lib/api/adminPrescriptionApi';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    analyticsOpen: boolean;
    onToggleAnalytics: () => void;
    bookingsOpen: boolean;
    onToggleBookings: () => void;
    productOpen: boolean;
    onToggleProduct: () => void;
}

type FlyoutType = 'analytics' | 'bookings' | 'products' | null;

const AdminSidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, analyticsOpen, onToggleAnalytics, bookingsOpen, onToggleBookings, productOpen, onToggleProduct }) => {
    const pathname = usePathname();
    const { isAdmin, hasPermission } = useAdminAuth();
    const [flyout, setFlyout] = useState<FlyoutType>(null);
    const [flyoutY, setFlyoutY] = useState(0);
    const flyoutRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!flyout) return;
        const handler = (e: MouseEvent) => {
            if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
                setFlyout(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [flyout]);

    useEffect(() => { if (!collapsed) setFlyout(null); }, [collapsed]);

    const openFlyout = (type: FlyoutType, e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setFlyoutY(rect.top);
        setFlyout(prev => prev === type ? null : type);
    };

    const isActive = (path: string, exact = false) => {
        if (path === '/admin') return pathname === '/admin';
        if (exact) return pathname === path;
        return pathname.startsWith(path);
    };

    const navLinkClass = (path: string, exact = false) => `
        flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3
        rounded-md hover:bg-blue-50 font-medium transition-all duration-200
        ${isActive(path, exact) ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
    `;

    const flyoutLinkClass = (path: string, exact = false) =>
        `block px-4 py-2.5 text-sm font-medium transition-colors rounded-lg mx-1
        ${isActive(path, exact) ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`;

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
    const showServices      = isAdmin || hasPermission(PERMISSIONS.SERVICES_VIEW);
    const showLabReceipt    = isAdmin || hasPermission(PERMISSIONS.LAB_RECEIPT_VIEW);
    const showPrescriptions = isAdmin || hasPermission(PERMISSIONS.PRESCRIPTION_BOOKING);

    // Live red-count badge for pending prescription uploads
    const [rxPending, setRxPending] = useState(0);
    useEffect(() => {
        if (!showPrescriptions) return;
        let alive = true;
        const fetchCount = () => {
            adminPrescriptionApi.list({ limit: 1, status: 'pending' })
                .then(r => { if (alive && r.success) setRxPending(r.pendingCount); })
                .catch(() => {});
        };
        fetchCount();
        const t = setInterval(fetchCount, 60000); // refresh every 60s
        return () => { alive = false; clearInterval(t); };
    }, [showPrescriptions]);

    return (
        <>
            <aside className={`hidden lg:block z-40 h-full bg-white shadow-md transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700">
                    {!collapsed && <h1 className="text-xl font-semibold text-white">Admin Panel</h1>}
                    <button
                        onClick={onToggle}
                        className="p-1 rounded-md hover:bg-blue-800 transition-colors"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed
                            ? <ChevronRight className="h-5 w-5 text-white" />
                            : <ChevronLeft  className="h-5 w-5 text-white" />}
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {/* Home — always visible */}
                    <Link href="/admin" className={navLinkClass('/admin')} title="Home">
                        <Home className="h-5 w-5" />
                        {!collapsed && <span className="ml-3">Home</span>}
                    </Link>

                    {/* Analytics accordion */}
                    {(showAnalytics || showMedicines || showAppointments) && (
                        <>
                            <button
                                onClick={collapsed
                                    ? (e) => openFlyout('analytics', e)
                                    : onToggleAnalytics}
                                className={`flex ${collapsed ? 'justify-center' : 'justify-between'} items-center w-full ${collapsed ? 'px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200 ${isActive('/admin/analytics') || isActive('/admin/medicine-dashboard') || isActive('/admin/appointments/dashboard') ? 'text-blue-600' : 'text-gray-700'}`}
                                title="Analytics"
                            >
                                <div className="flex items-center">
                                    <BarChart3 className="h-5 w-5" />
                                    {!collapsed && <span className="ml-3">Analytics</span>}
                                </div>
                                {!collapsed && (analyticsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
                            </button>

                            {analyticsOpen && !collapsed && (
                                <div className="pl-8 space-y-1 text-sm">
                                    {showAnalytics && (
                                        <Link href="/admin/analytics" className={`block px-3 py-2 rounded-md transition-colors font-medium ${isActive('/admin/analytics', true) ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-blue-100'}`}>
                                            Overview
                                        </Link>
                                    )}
                                    {showMedicines && (
                                        <Link href="/admin/medicine-dashboard" className={`block px-3 py-2 rounded-md transition-colors font-medium ${isActive('/admin/medicine-dashboard') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-blue-100'}`}>
                                            Meds Sales
                                        </Link>
                                    )}
                                    {showAppointments && (
                                        <Link href="/admin/appointments/dashboard" className={`block px-3 py-2 rounded-md transition-colors font-medium ${isActive('/admin/appointments/dashboard') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-blue-100'}`}>
                                            Consultations
                                        </Link>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Homepage Featured */}
                    {(isAdmin || hasPermission(PERMISSIONS.HOMEPAGE_EDIT)) && (
                        <Link href="/admin/homepage" className={navLinkClass('/admin/homepage')} title="Homepage Featured">
                            <Star className="h-5 w-5" />
                            {!collapsed && <span className="ml-3">Homepage</span>}
                        </Link>
                    )}

                    {/* Bookings accordion */}
                    {(showLabOrders || showMedOrders || showAppointments) && (
                        <>
                            <button
                                onClick={collapsed
                                    ? (e) => openFlyout('bookings', e)
                                    : onToggleBookings}
                                className={`flex ${collapsed ? 'justify-center' : 'justify-between'} items-center w-full ${collapsed ? 'px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200 ${isActive('/admin/orders') || isActive('/admin/appointments') ? 'text-blue-600' : 'text-gray-700'}`}
                                title="Bookings"
                            >
                                <div className="flex items-center">
                                    <ClipboardList className="h-5 w-5" />
                                    {!collapsed && <span className="ml-3">Bookings</span>}
                                </div>
                                {!collapsed && (bookingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
                            </button>

                            {bookingsOpen && !collapsed && (
                                <div className="pl-8 space-y-1 text-sm">
                                    {showLabOrders && (
                                        <Link href="/admin/orders" className={`block px-3 py-2 rounded-md transition-colors font-medium ${isActive('/admin/orders', true) ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-blue-100'}`}>
                                            Lab Orders
                                        </Link>
                                    )}
                                    {showMedOrders && (
                                        <Link href="/admin/orders/medicine" className={`block px-3 py-2 rounded-md transition-colors font-medium ${isActive('/admin/orders/medicine') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-blue-100'}`}>
                                            Meds Orders
                                        </Link>
                                    )}
                                    {showAppointments && (
                                        <Link href="/admin/appointments" className={`block px-3 py-2 rounded-md transition-colors font-medium ${isActive('/admin/appointments') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-blue-100'}`}>
                                            Appointments
                                        </Link>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Products */}
                    {showProducts && (
                        <>
                            <button
                                onClick={collapsed
                                    ? (e) => openFlyout('products', e)
                                    : onToggleProduct}
                                className={`flex ${collapsed ? 'justify-center' : 'justify-between'} items-center w-full ${collapsed ? 'px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200 text-gray-700`}
                                title="Products"
                            >
                                <div className="flex items-center">
                                    <Package className="h-5 w-5" />
                                    {!collapsed && <span className="ml-3">Products</span>}
                                </div>
                                {!collapsed && (productOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
                            </button>

                            {productOpen && !collapsed && (
                                <div className="pl-8 space-y-1 text-sm">
                                    {showLabProducts && (
                                        <>
                                            <Link href="/admin/offers"   className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-gray-600">Offers</Link>
                                            <Link href="/admin/packages" className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-gray-600">Packages</Link>
                                            <Link href="/admin/tests"    className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-gray-600">Tests</Link>
                                        </>
                                    )}
                                    {showMedicines && (
                                        <Link href="/admin/medicines" className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-gray-600">Medicines</Link>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Doctors */}
                    {showDoctors && (
                        <Link href="/admin/doctors" className={navLinkClass('/admin/doctors')} title="Doctors">
                            <Stethoscope className="h-5 w-5" />
                            {!collapsed && <span className="ml-3">Doctors</span>}
                        </Link>
                    )}

                    {/* Users */}
                    {showUsers && (
                        <Link href="/admin/users" className={navLinkClass('/admin/users')} title="Users">
                            <Users className="h-5 w-5" />
                            {!collapsed && <span className="ml-3">Users</span>}
                        </Link>
                    )}

                    {/* Staff — admin only */}
                    {isAdmin && (
                        <Link href="/admin/staff" className={navLinkClass('/admin/staff')} title="Staff">
                            <UserCog className="h-5 w-5" />
                            {!collapsed && <span className="ml-3">Staff</span>}
                        </Link>
                    )}

                    {/* Notifications */}
                    {showNotifications && (
                        <Link href="/admin/notifications" className={navLinkClass('/admin/notifications')} title="Notifications">
                            <Bell className="h-5 w-5" />
                            {!collapsed && <span className="ml-3">Notifications</span>}
                        </Link>
                    )}

                    {/* Prescriptions — admin + staff with PRESCRIPTION_BOOKING (red-count badge) */}
                    {showPrescriptions && (
                        <Link href="/admin/prescriptions" className={navLinkClass('/admin/prescriptions')} title="Prescriptions">
                            <div className="relative">
                                <FileText className="h-5 w-5" />
                                {rxPending > 0 && (
                                    <span className={`absolute -top-1.5 ${collapsed ? '-right-1.5' : '-right-2'} min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black`}>
                                        {rxPending > 99 ? '99+' : rxPending}
                                    </span>
                                )}
                            </div>
                            {!collapsed && (
                                <span className="ml-3 flex items-center gap-2">
                                    Prescriptions
                                    {rxPending > 0 && (
                                        <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black">
                                            {rxPending > 99 ? '99+' : rxPending}
                                        </span>
                                    )}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* Lab Receipt Generator — admin + staff with LAB_RECEIPT_VIEW */}
                    {showLabReceipt && (
                        <Link href="/admin/lab-receipt" className={navLinkClass('/admin/lab-receipt')} title="Lab Receipt">
                            <Printer className="h-5 w-5" />
                            {!collapsed && <span className="ml-3">Lab Receipt</span>}
                        </Link>
                    )}

                    {/* Services — admin + staff with SERVICES_VIEW */}
                    {showServices && (
                        <Link href="/admin/settings/services" className={navLinkClass('/admin/settings/services')} title="Services">
                            <Layers className="h-5 w-5" />
                            {!collapsed && <span className="ml-3">Services</span>}
                        </Link>
                    )}

                    {/* Settings / Account — admin only */}
                    {isAdmin && (
                        <>
                            <Link href="/admin/settings" className={navLinkClass('/admin/settings', true)} title="Settings">
                                <Settings className="h-5 w-5" />
                                {!collapsed && <span className="ml-3">Settings</span>}
                            </Link>

                            <Link href="/admin/account" className={navLinkClass('/admin/account')} title="Account">
                                <UserCircle className="h-5 w-5" />
                                {!collapsed && <span className="ml-3">Account</span>}
                            </Link>
                        </>
                    )}
                </nav>
            </aside>

            {/* Collapsed flyout panel */}
            {collapsed && flyout && (
                <div
                    ref={flyoutRef}
                    style={{ top: flyoutY, left: 80 }}
                    className="fixed z-50 ml-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-left-2 duration-150"
                >
                    <p className="px-4 pb-1.5 pt-0.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {flyout === 'analytics' ? 'Analytics' : flyout === 'bookings' ? 'Bookings' : 'Products'}
                    </p>

                    {flyout === 'analytics' && (
                        <>
                            <Link href="/admin/analytics"              onClick={() => setFlyout(null)} className={flyoutLinkClass('/admin/analytics', true)}>Overview</Link>
                            <Link href="/admin/medicine-dashboard"     onClick={() => setFlyout(null)} className={flyoutLinkClass('/admin/medicine-dashboard')}>Meds Sales</Link>
                            <Link href="/admin/appointments/dashboard" onClick={() => setFlyout(null)} className={flyoutLinkClass('/admin/appointments/dashboard')}>Consultations</Link>
                        </>
                    )}

                    {flyout === 'bookings' && (
                        <>
                            {showLabOrders && (
                                <Link href="/admin/orders"          onClick={() => setFlyout(null)} className={flyoutLinkClass('/admin/orders', true)}>Lab Orders</Link>
                            )}
                            {showMedOrders && (
                                <Link href="/admin/orders/medicine" onClick={() => setFlyout(null)} className={flyoutLinkClass('/admin/orders/medicine')}>Meds Orders</Link>
                            )}
                            {showAppointments && (
                                <Link href="/admin/appointments"    onClick={() => setFlyout(null)} className={flyoutLinkClass('/admin/appointments')}>Appointments</Link>
                            )}
                        </>
                    )}

                    {flyout === 'products' && (
                        <>
                            {showLabProducts && (
                                <>
                                    <Link href="/admin/offers"   onClick={() => setFlyout(null)} className={flyoutLinkClass('/admin/offers')}>Offers</Link>
                                    <Link href="/admin/packages" onClick={() => setFlyout(null)} className={flyoutLinkClass('/admin/packages')}>Packages</Link>
                                    <Link href="/admin/tests"    onClick={() => setFlyout(null)} className={flyoutLinkClass('/admin/tests')}>Tests</Link>
                                </>
                            )}
                            {showMedicines && (
                                <Link href="/admin/medicines" onClick={() => setFlyout(null)} className={flyoutLinkClass('/admin/medicines')}>Medicines</Link>
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default AdminSidebar;

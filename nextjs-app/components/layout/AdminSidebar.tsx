'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    BarChart3,
    ShoppingCart,
    Package,
    Users,
    Bell,
    Settings,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Stethoscope,
} from 'lucide-react';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    productOpen: boolean;
    onToggleProduct: () => void;
}

const AdminSidebar: React.FC<SidebarProps> = ({
    collapsed,
    onToggle,
    productOpen,
    onToggleProduct
}) => {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/admin' && pathname === '/admin') return true;
        if (path !== '/admin' && pathname.startsWith(path)) return true;
        return false;
    };

    const navLinkClass = (path: string) => `
    flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 
    rounded-md hover:bg-blue-50 font-medium transition-all duration-200
    ${isActive(path) ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
  `;

    return (
        <aside className={`hidden lg:block z-40 h-full bg-white shadow-md transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700">
                {!collapsed && (
                    <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
                )}
                <button
                    onClick={onToggle}
                    className="p-1 rounded-md hover:bg-blue-800 transition-colors"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5 text-white" />
                    ) : (
                        <ChevronLeft className="h-5 w-5 text-white" />
                    )}
                </button>
            </div>

            <nav className="p-4 space-y-2">
                <Link href="/admin" className={navLinkClass('/admin')} title="Home">
                    <Home className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Home</span>}
                </Link>
                <Link href="/admin/analytics" className={navLinkClass('/admin/analytics')} title="Analytics">
                    <BarChart3 className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Analytics</span>}
                </Link>
                <Link href="/admin/orders" className={navLinkClass('/admin/orders')} title="Orders">
                    <ShoppingCart className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Orders</span>}
                </Link>

                <button
                    onClick={onToggleProduct}
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
                    <div className="pl-8 space-y-2 text-sm">
                        <Link href="/admin/offers" className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200 text-gray-600">
                            Offers
                        </Link>
                        <Link href="/admin/packages" className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200 text-gray-600">
                            Packages
                        </Link>
                        <Link href="/admin/tests" className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200 text-gray-600">
                            Tests
                        </Link>
                        <Link href="/admin/medicines" className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200 text-gray-600">
                            Medicines
                        </Link>
                    </div>
                )}

                <Link href="/admin/doctors" className={navLinkClass('/admin/doctors')} title="Doctors">
                    <Stethoscope className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Doctors</span>}
                </Link>

                <Link href="/admin/users" className={navLinkClass('/admin/users')} title="Users">
                    <Users className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Users</span>}
                </Link>
                <Link href="/admin/notifications" className={navLinkClass('/admin/notifications')} title="Notifications">
                    <Bell className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Notifications</span>}
                </Link>
                <Link href="/admin/settings" className={navLinkClass('/admin/settings')} title="Settings">
                    <Settings className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Settings</span>}
                </Link>
                <Link href="/admin/account" className={navLinkClass('/admin/account')} title="Account">
                    <UserCircle className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Account</span>}
                </Link>
            </nav>
        </aside>
    );
};

export default AdminSidebar;

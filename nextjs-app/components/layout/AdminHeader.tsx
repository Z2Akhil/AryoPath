'use client';

import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useAdminAuth } from '@/providers/AdminAuthProvider';

interface AdminHeaderProps {
    onMenuClick: () => void;
    title: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, title }) => {
    const { user, logout } = useAdminAuth();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    return (
        <header className="flex items-center justify-between bg-white p-4 shadow-sm border-b border-gray-100">
            <div className="flex items-center space-x-4">
                <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors">
                    <Menu className="text-gray-700 h-6 w-6" />
                </button>
                <h2 className="text-lg font-semibold text-gray-700">
                    {title}
                </h2>
            </div>
            <div className="flex items-center space-x-4">
                {user && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User size={16} />
                        <span>{(user as any).adminProfile?.name || (user as any).name || user.username}</span>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                    title="Logout"
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
};

export default AdminHeader;

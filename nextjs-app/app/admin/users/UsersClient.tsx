'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Users,
    Mail,
    Phone,
    Calendar,
    Eye,
    Edit,
    RefreshCw,
    AlertCircle,
    ShoppingBag,
    ShoppingCart,
    CheckCircle,
    XCircle,
    MoreVertical,
    Filter,
    FlaskConical,
    Pill,
    Stethoscope,
    X,
} from 'lucide-react';
import adminUserApi from '@/lib/api/adminUserApi';
import { CustomerUser } from '@/types/admin';
import Pagination from '@/components/common/Pagination';
import UserViewModal from '@/components/admin/users/UserViewModal';
import UserEditModal from '@/components/admin/users/UserEditModal';
import BookOrderModal from '@/components/admin/orders/BookOrderModal';
import BookMedicineModal from '@/components/admin/orders/BookMedicineModal';
import BookAppointmentModal from '@/components/admin/orders/BookAppointmentModal';
import UserCartModal from '@/components/admin/users/UserCartModal';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';

export default function UsersClient() {
    const { isAdmin, hasPermission } = useAdminAuth();
    const toast = useToast();
    const [users, setUsers] = useState<CustomerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal states
    const [selectedUser, setSelectedUser] = useState<CustomerUser | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isMedBookOpen, setIsMedBookOpen] = useState(false);
    const [isApptBookOpen, setIsApptBookOpen] = useState(false);
    const [isBookChooserOpen, setIsBookChooserOpen] = useState(false);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const canPrescriptionBook = isAdmin || hasPermission(PERMISSIONS.PRESCRIPTION_BOOKING);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminUserApi.searchUsers({
                search: searchTerm,
                status: statusFilter === 'all' ? undefined : statusFilter,
                page: currentPage,
                limit: itemsPerPage
            });

            if (response.success) {
                setUsers(response.users);
                setTotalUsers(response.pagination.totalCount);
                setTotalPages(response.pagination.totalPages);
            } else {
                setError('Failed to fetch users');
            }
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.error || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, currentPage, itemsPerPage]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [fetchUsers]);

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            setIsUpdating(true);
            const response = await adminUserApi.toggleStatus(userId, !currentStatus);
            if (response.success) {
                // Update local state
                setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
                if (selectedUser?._id === userId) {
                    setSelectedUser({ ...selectedUser, isActive: !currentStatus });
                }
                // Using error state for success message too briefly or just logging
                console.log(response.message);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update user status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSaveUser = async (updatedData: Partial<CustomerUser>) => {
        if (!selectedUser) return;
        try {
            setIsUpdating(true);
            const response = await adminUserApi.updateUser(selectedUser._id, updatedData);
            if (response.success) {
                setUsers(users.map(u => u._id === selectedUser._id ? response.user : u));
                setIsEditModalOpen(false);
                setSelectedUser(null);
                console.log('User updated successfully');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update user');
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!isAdmin && !hasPermission(PERMISSIONS.USERS_VIEW)) {
        return <AccessDenied section="Users" />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-sm text-gray-500">Total {totalUsers} users registered</p>
                    </div>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition-all border border-gray-200 font-medium"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {users.filter(u => u.isActive).length}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Showing current page only
                            </p>
                        </div>
                        <Users className="h-8 w-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Verified Users</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {users.filter(u => u.isVerified === true).length}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Showing current page only
                            </p>
                        </div>
                        <Mail className="h-8 w-8 text-purple-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">This Month</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {users.filter(u => {
                                    const userDate = new Date(u.createdAt);
                                    const now = new Date();
                                    return userDate.getMonth() === now.getMonth() &&
                                        userDate.getFullYear() === now.getFullYear();
                                }).length}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Showing current page only
                            </p>
                        </div>
                        <Calendar className="h-8 w-8 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email or mobile..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="relative min-w-[150px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && users.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skeleton-user-${i}`} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded w-10 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Users className="h-12 w-12 text-gray-200" />
                                            <p className="text-lg font-medium">No users found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u._id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm uppercase">
                                                    {u.firstName ? u.firstName[0] : '?'}{u.lastName ? u.lastName[0] : ''}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{u.firstName || 'Unknown'} {u.lastName || ''}</div>
                                                    <div className="text-xs text-gray-500 font-mono">ID: {u._id.slice(-8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-600 gap-2">
                                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                    {u.email || 'N/A'}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600 gap-2">
                                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                    {u.mobileNumber}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(u._id, u.isActive)}
                                                disabled={isUpdating}
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all ${u.isActive
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                            >
                                                {u.isActive ? (
                                                    <><CheckCircle className="h-3 w-3 mr-1.5" /> Active</>
                                                ) : (
                                                    <><XCircle className="h-3 w-3 mr-1.5" /> Inactive</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {formatDate(u.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedUser(u); setIsViewModalOpen(true); }}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedUser(u); setIsCartModalOpen(true); }}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                                    title="View Cart"
                                                >
                                                    <ShoppingCart className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedUser(u); setIsEditModalOpen(true); }}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedUser(u); setIsBookChooserOpen(true); }}
                                                    className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                                                    title="Book on behalf"
                                                >
                                                    <ShoppingBag className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalUsers}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(limit) => {
                        setItemsPerPage(limit);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* Modals */}
            {isViewModalOpen && selectedUser && (
                <UserViewModal
                    user={selectedUser}
                    onClose={() => { setIsViewModalOpen(false); setSelectedUser(null); }}
                />
            )}

            {isEditModalOpen && selectedUser && (
                <UserEditModal
                    user={selectedUser}
                    loading={isUpdating}
                    onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
                    onSave={handleSaveUser}
                />
            )}

            {/* Booking type chooser */}
            {isBookChooserOpen && selectedUser && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-extrabold text-gray-900">Book on behalf</h2>
                                <p className="text-xs text-gray-400">{selectedUser.firstName} {selectedUser.lastName} · {selectedUser.mobileNumber}</p>
                            </div>
                            <button onClick={() => { setIsBookChooserOpen(false); setSelectedUser(null); }} className="p-2 rounded-xl hover:bg-gray-100">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 gap-3">
                            {/* Lab */}
                            <button
                                onClick={() => { setIsBookChooserOpen(false); setIsBookModalOpen(true); }}
                                className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                            >
                                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center"><FlaskConical className="h-5 w-5 text-blue-600" /></div>
                                <div><p className="font-bold text-gray-900">Lab Test</p><p className="text-xs text-gray-400">Book Thyrocare test / package</p></div>
                            </button>

                            {/* Medicine */}
                            <button
                                onClick={() => {
                                    if (!canPrescriptionBook) { toast.error('You need Prescription Booking permission'); return; }
                                    setIsBookChooserOpen(false); setIsMedBookOpen(true);
                                }}
                                className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all text-left"
                            >
                                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center"><Pill className="h-5 w-5 text-teal-600" /></div>
                                <div><p className="font-bold text-gray-900">Medicines</p><p className="text-xs text-gray-400">Book medicine order (COD)</p></div>
                            </button>

                            {/* Appointment */}
                            <button
                                onClick={() => {
                                    if (!canPrescriptionBook) { toast.error('You need Prescription Booking permission'); return; }
                                    setIsBookChooserOpen(false); setIsApptBookOpen(true);
                                }}
                                className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                            >
                                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center"><Stethoscope className="h-5 w-5 text-purple-600" /></div>
                                <div><p className="font-bold text-gray-900">Appointment</p><p className="text-xs text-gray-400">Book consultation (payment link)</p></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isBookModalOpen && selectedUser && (
                <BookOrderModal
                    user={selectedUser}
                    onClose={() => { setIsBookModalOpen(false); setSelectedUser(null); }}
                    onSuccess={(msg) => {
                        setIsBookModalOpen(false);
                        setSelectedUser(null);
                        toast.success(msg);
                    }}
                />
            )}

            {isMedBookOpen && selectedUser && (
                <BookMedicineModal
                    user={selectedUser}
                    onClose={() => { setIsMedBookOpen(false); setSelectedUser(null); }}
                    onSuccess={(msg) => {
                        setIsMedBookOpen(false);
                        setSelectedUser(null);
                        toast.success(msg);
                    }}
                />
            )}

            {isApptBookOpen && selectedUser && (
                <BookAppointmentModal
                    user={selectedUser}
                    onClose={() => { setIsApptBookOpen(false); setSelectedUser(null); }}
                    onSuccess={(msg) => {
                        setIsApptBookOpen(false);
                        setSelectedUser(null);
                        toast.success(msg);
                    }}
                />
            )}

            {isCartModalOpen && selectedUser && (
                <UserCartModal
                    user={selectedUser}
                    onClose={() => { setIsCartModalOpen(false); setSelectedUser(null); }}
                />
            )}

            {error && (
                <div className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <AlertCircle className="h-6 w-6" />
                    <div>
                        <p className="font-bold">Error</p>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

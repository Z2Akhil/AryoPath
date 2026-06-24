import React, { useState } from 'react';
import {
    ChevronDown, ChevronUp, Package, User, CheckCircle, Truck, Users,
    Copy, RefreshCw
} from 'lucide-react';
import adminOrderApi from '@/lib/api/adminOrderApi';
import { AdminOrder } from '@/types/admin';

interface OrderAccordionProps {
    order: AdminOrder | null;
    loading: boolean;
    error: string;
    onRetry: () => void;
    isExpanded: boolean;
    onToggle: () => void;
    onRefresh: () => void;
}

const OrderAccordion: React.FC<OrderAccordionProps> = ({
    order,
    loading,
    error,
    onRetry,
    isExpanded,
    onToggle,
    onRefresh
}) => {
    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState('');
    const [refreshSuccess, setRefreshSuccess] = useState(false);

    const handleRefreshStatus = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!order?._id) return;

        try {
            setRefreshing(true);
            setRefreshError('');
            setRefreshSuccess(false);

            await adminOrderApi.syncOrderStatus(order._id);
            setRefreshSuccess(true);

            if (onRefresh) {
                onRefresh();
            }

            setTimeout(() => {
                setRefreshSuccess(false);
            }, 3000);

        } catch (err: any) {
            console.error('Error refreshing order status:', err);
            setRefreshError(err.response?.data?.error || 'Failed to refresh status');
            setTimeout(() => {
                setRefreshError('');
            }, 5000);
        } finally {
            setRefreshing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'CREATED': return 'bg-blue-100 text-blue-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getThyrocareFriendlyStatus = (status: string): string => {
        if (!status) return 'Order Booked';
        const normalized = status.toUpperCase().trim();
        switch (normalized) {
            case 'YET TO ASSIGN':
            case 'Y':
                return 'Order Booked';
            case 'ASSIGNED':
                return 'Technician Assigned';
            case 'ACCEPTED':
                return 'Technician Accepted';
            case 'STARTED':
                return 'Technician On the Way';
            case 'ARRIVED':
                return 'Technician Arrived';
            case 'CONFIRMED':
                return 'Sample Collected';
            case 'SERVICED':
            case 'LAB':
                return 'Sample at Lab';
            case 'PARTIAL SERVICED':
                return 'Partially Serviced';
            case 'FIX APPOINTMENT':
                return 'Appointment Fixed';
            case 'RESCHEDULED':
                return 'Appointment Rescheduled';
            case 'DONE':
                return 'Report Ready';
            case 'REPORTED':
                return 'Report Released';
            case 'CANCELLED':
                return 'Cancelled';
            case 'CANCELLATIONREQUEST':
                return 'Cancellation Requested';
            case 'CANCELTEST':
                return 'Cancellation Initiated';
            case 'CHARBI PUSHED':
                return 'Assigned to Partner Tech';
            case 'PERSUASION':
                return 'Follow-up in Progress';
            case 'CALLBACK':
                return 'Callback Requested';
            default:
                return status;
        }
    };

    const getThyrocareStatusColor = (status: string) => {
        const normalized = (status || '').toUpperCase().trim();
        switch (normalized) {
            case 'DONE':
            case 'REPORTED':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'SERVICED':
            case 'LAB':
            case 'PARTIAL SERVICED':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'ACCEPTED':
            case 'STARTED':
            case 'ARRIVED':
            case 'CONFIRMED':
                return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'ASSIGNED':
                return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
            case 'YET TO ASSIGN':
            case 'Y':
            case 'FIX APPOINTMENT':
            case 'RESCHEDULED':
                return 'bg-yellow-100 text-yellow-850 border border-yellow-250';
            case 'CANCELLED':
            case 'CANCELLATIONREQUEST':
            case 'CANCELTEST':
                return 'bg-gray-100 text-gray-800 border border-gray-200';
            case 'FAILED':
                return 'bg-red-100 text-red-800 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return 'N/A';
        return new Date(dateString as string).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'medium'
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (loading) {
        return (
            <tr>
                <td colSpan={6} className="px-6 py-4">
                    <div className="flex items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading order details...</span>
                    </div>
                </td>
            </tr>
        );
    }

    if (error) {
        return (
            <tr>
                <td colSpan={6} className="px-6 py-4">
                    <div className="text-center">
                        <p className="text-red-600 mb-2">{error}</p>
                        <button
                            onClick={onRetry}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    if (!order) return null;

    return (
        <React.Fragment>
            <tr className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={onToggle}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.orderId}</div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-blue-700">₹{order.payment?.amount || order.package?.price || 0}</div>
                        {order.reportsHardcopy === 'Y' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                                Hard Copy
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                        {typeof order.userId === 'object' ? `${order.userId.firstName} ${order.userId.lastName}` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">{order.contactInfo?.email || 'No email'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 line-clamp-1 max-w-[200px]">{order.package?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{order.beneficiaries?.length || 0} beneficiaries</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)} w-fit`}>
                            {order.status}
                        </span>
                        {order.thyrocare?.status && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getThyrocareStatusColor(order.thyrocare.status)} w-fit`}>
                                {getThyrocareFriendlyStatus(order.thyrocare.status)}
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {isExpanded ? 'Hide' : 'View'}
                        </button>

                        {order.thyrocare?.orderNo && (
                            <button
                                type="button"
                                onClick={handleRefreshStatus}
                                disabled={refreshing}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? '...' : 'Sync'}
                            </button>
                        )}
                    </div>
                    {refreshError && <p className="text-red-500 text-xs mt-1">{refreshError}</p>}
                    {refreshSuccess && <p className="text-green-500 text-xs mt-1">Synced!</p>}
                </td>
            </tr>

            {isExpanded && (
                <tr>
                    <td colSpan={6} className="px-6 py-8 bg-gray-50/50 border-y border-gray-200">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* ── LEFT COLUMN ── */}
                            <div className="space-y-5">

                                {/* Package Information */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                                        <Package className="h-5 w-5 text-blue-500" />
                                        Package Information
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Package Name:</span>
                                            <span className="font-semibold text-gray-900">{order.package?.name || 'N/A'}</span>
                                        </div>
                                        {order.package?.code && order.package.code.length > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Package Code:</span>
                                                <span className="font-mono text-gray-700">
                                                    {Array.isArray(order.package.code) ? order.package.code.join(', ') : order.package.code}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Price:</span>
                                            <span className="text-gray-700">₹{order.package?.originalPrice ?? order.package?.price}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Discount:</span>
                                            <span className="text-gray-700">₹{order.package?.discountAmount ?? 0}</span>
                                        </div>
                                        {order.reportsHardcopy === 'Y' && (
                                            <div className="flex justify-between text-red-600 font-medium">
                                                <span>Hard Copy Charge:</span>
                                                <span>₹75</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-3 border-t">
                                            <span className="text-gray-900 font-bold">Total Amount:</span>
                                            <span className="text-xl text-blue-700 font-black">₹{order.payment?.amount || order.package?.price}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Information */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                                        <User className="h-5 w-5 text-blue-500" />
                                        Customer Information
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Name:</span>
                                            <span className="font-semibold text-gray-900">
                                                {typeof order.userId === 'object'
                                                    ? `${order.userId.firstName} ${order.userId.lastName}`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        {order.contactInfo?.email && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Email:</span>
                                                <span className="flex items-center gap-1.5 font-medium text-gray-800">
                                                    {order.contactInfo.email}
                                                    <button
                                                        onClick={() => copyToClipboard(order.contactInfo?.email || '')}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Phone:</span>
                                            <span className="flex items-center gap-1.5 font-bold text-gray-800">
                                                {order.contactInfo?.mobile || 'N/A'}
                                                {order.contactInfo?.mobile && (
                                                    <button
                                                        onClick={() => copyToClipboard(order.contactInfo?.mobile || '')}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </span>
                                        </div>
                                        <div className="pt-1">
                                            <span className="text-gray-500 block mb-1">Address:</span>
                                            <p className="font-medium leading-relaxed text-gray-800">
                                                {order.contactInfo?.address
                                                    ? `${order.contactInfo.address.street}, ${order.contactInfo.address.city}, ${order.contactInfo.address.state} ${order.contactInfo.address.pincode}`
                                                    : 'N/A'}
                                            </p>
                                            {order.contactInfo?.address?.landmark && (
                                                <p className="text-gray-500 italic text-xs mt-0.5">
                                                    Near: {order.contactInfo.address.landmark}
                                                </p>
                                            )}
                                        </div>
                                        {order.appointment?.date && (
                                            <div className="flex justify-between pt-2 border-t">
                                                <span className="text-gray-500">Appointment:</span>
                                                <span className="font-bold text-blue-600">
                                                    {order.appointment.date} ({order.appointment.slot})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>


                            </div>

                            {/* ── RIGHT COLUMN ── */}
                            <div className="space-y-5">

                                {/* Order Status */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                                        <CheckCircle className="h-5 w-5 text-blue-500" />
                                        Order Status
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Created:</span>
                                            <span className="font-medium text-gray-800">{formatDate(order.createdAt as any)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Last Updated:</span>
                                            <span className="font-medium text-gray-800">{formatDate(order.updatedAt as any)}</span>
                                        </div>
                                        {order.notes && (
                                            <div className="pt-2 border-t">
                                                <span className="text-gray-500 text-xs block mb-1">Notes:</span>
                                                <p className="text-gray-700 text-xs leading-relaxed">{order.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Thyrocare Status */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                                        <Truck className="h-5 w-5 text-blue-500" />
                                        Thyrocare Status
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getThyrocareStatusColor(order.thyrocare?.status || '')}`}>
                                                {getThyrocareFriendlyStatus(order.thyrocare?.status || 'YET TO ASSIGN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Thyrocare Order No:</span>
                                            <span className="flex items-center gap-2 font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                                                {order.thyrocare?.orderNo || 'N/A'}
                                                {order.thyrocare?.orderNo && (
                                                    <button
                                                        onClick={() => copyToClipboard(order.thyrocare?.orderNo || '')}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Last Synced:</span>
                                            <span className="font-medium text-gray-700">{formatDate(order.thyrocare?.lastSyncedAt)}</span>
                                        </div>
                                        {order.thyrocare?.error && (
                                            <div className="p-3 bg-red-50 border border-red-100 rounded text-red-700 text-xs">
                                                <strong>Sync Error:</strong> {order.thyrocare.error}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Beneficiaries */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                                        <Users className="h-5 w-5 text-blue-500" />
                                        Beneficiaries ({order.beneficiaries?.length || 0})
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-tight">
                                                    <th className="pb-3">Name</th>
                                                    <th className="pb-3">Age</th>
                                                    <th className="pb-3">Gender</th>
                                                    <th className="pb-3 text-right">Report</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 text-sm">
                                                {order.beneficiaries.map((ben, idx) => {
                                                    const report = order.reports?.find(r => r.beneficiaryName === ben.name || r.leadId === ben.leadId);
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50/50">
                                                            <td className="py-3 font-semibold text-gray-800">{ben.name}</td>
                                                            <td className="py-3 text-gray-600">{ben.age}</td>
                                                            <td className="py-3 text-gray-600">{ben.gender}</td>
                                                            <td className="py-3 text-right">
                                                                {report?.reportUrl ? (
                                                                    <a
                                                                        href={report.reportUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-blue-600 hover:text-blue-800 font-bold transition-colors"
                                                                    >
                                                                        View PDF
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-300">N/A</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

export default OrderAccordion;

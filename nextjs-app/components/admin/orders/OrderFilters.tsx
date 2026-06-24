import React from 'react';
import { Search, RefreshCw, Filter } from 'lucide-react';

interface OrderFiltersProps {
    searchTerm: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    statusFilter: string;
    onStatusFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    thyrocareStatusFilter: string;
    onThyrocareStatusFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    dateRange: { startDate: string; endDate: string };
    onDateChange: (type: 'startDate' | 'endDate', value: string) => void;
    onClearFilters: () => void;
    onRefresh: () => void;
    loading: boolean;
    syncLoading?: boolean;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    thyrocareStatusFilter,
    onThyrocareStatusFilterChange,
    dateRange,
    onDateChange,
    onClearFilters,
    onRefresh,
    loading,
    syncLoading = false
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search by order ID, email, phone, or package..."
                            value={searchTerm}
                            onChange={onSearchChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${(loading || syncLoading) ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={onClearFilters}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Clear Filters
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Order Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={onStatusFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="COMPLETED">Completed (COMPLETED + DONE)</option>
                            <option value="PENDING">Pending (All Others)</option>
                            <option value="FAILED">Failed (FAILED)</option>
                            <option value="CREATED">Created (System)</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thyrocare Status
                        </label>
                        <select
                            value={thyrocareStatusFilter}
                            onChange={onThyrocareStatusFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="YET TO ASSIGN">Order Booked</option>
                            <option value="ASSIGNED">Technician Assigned</option>
                            <option value="ACCEPTED">Technician Accepted</option>
                            <option value="STARTED">Technician On the Way</option>
                            <option value="ARRIVED">Technician Arrived</option>
                            <option value="CONFIRMED">Sample Collected</option>
                            <option value="SERVICED">Sample at Lab</option>
                            <option value="DONE">Report Ready</option>
                            <option value="REPORTED">Report Released</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => onDateChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => onDateChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderFilters;

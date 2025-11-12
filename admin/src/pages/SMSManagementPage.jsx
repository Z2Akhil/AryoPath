import { useState, useEffect } from "react";
import { 
  Wallet, 
  BarChart3, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  Filter,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SMSManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [walletBalance, setWalletBalance] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [smsHistory, setSmsHistory] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [filters, setFilters] = useState({
    mobileNumber: '',
    status: 'all',
    messageType: 'all',
    purpose: 'all',
    startDate: '',
    endDate: ''
  });
  const [testSmsData, setTestSmsData] = useState({
    mobileNumber: '',
    message: '',
    messageType: 'notification'
  });

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sms/wallet', {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      });
      
      if (response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setWalletBalance(data.balance);
        } else {
          // Handle non-JSON response
          const text = await response.text();
          console.error('Non-JSON response from wallet API:', text);
          setWalletBalance(0); // Set default value
        }
      } else {
        console.error('Failed to fetch wallet balance, status:', response.status);
        setWalletBalance(0); // Set default value
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setWalletBalance(0); // Set default value on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch SMS statistics
  const fetchStatistics = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/sms/statistics?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Fetch SMS history
  const fetchSMSHistory = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await fetch(`/api/admin/sms/history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSmsHistory(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching SMS history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send test SMS
  const sendTestSMS = async () => {
    if (!testSmsData.mobileNumber || !testSmsData.message) {
      alert('Please enter mobile number and message');
      return;
    }

    try {
      setTestSmsLoading(true);
      const response = await fetch('/api/admin/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        },
        body: JSON.stringify(testSmsData)
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('Test SMS sent successfully!');
        setTestSmsData({
          mobileNumber: '',
          message: '',
          messageType: 'notification'
        });
        // Refresh data
        fetchWalletBalance();
        fetchStatistics();
        fetchSMSHistory();
      } else {
        alert('Failed to send test SMS');
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      alert('Error sending test SMS');
    } finally {
      setTestSmsLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchWalletBalance();
      fetchStatistics();
    } else if (activeTab === 'history') {
      fetchSMSHistory();
    }
  }, [activeTab, filters]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Management</h1>
        </div>
        <button
          onClick={fetchWalletBalance}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'history', 'test'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' && <BarChart3 className="w-4 h-4 inline mr-2" />}
              {tab === 'history' && <MessageSquare className="w-4 h-4 inline mr-2" />}
              {tab === 'test' && <Send className="w-4 h-4 inline mr-2" />}
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Wallet Balance Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {walletBalance !== null ? `₹${walletBalance.toFixed(2)}` : 'Loading...'}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Fast2SMS Account Balance</p>
            </div>

            {/* Statistics Cards */}
            {statistics && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total SMS</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {statistics.totalSMS}
                      </p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">All time sent messages</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Cost</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        ₹{statistics.totalCost.toFixed(2)}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Total SMS expenses</p>
                </div>
              </>
            )}
          </div>

          {/* Status Breakdown */}
          {statistics && statistics.statusBreakdown && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statistics.statusBreakdown.map((item) => (
                  <div key={item.status} className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-2 capitalize">{item.status}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{item.count}</p>
                    <p className="text-xs text-gray-500">₹{item.cost.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={filters.mobileNumber}
                  onChange={(e) => setFilters({...filters, mobileNumber: e.target.value})}
                  placeholder="Search by number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
                <select
                  value={filters.messageType}
                  onChange={(e) => setFilters({...filters, messageType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="otp">OTP</option>
                  <option value="notification">Notification</option>
                  <option value="promotional">Promotional</option>
                  <option value="transactional">Transactional</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => fetchSMSHistory(1)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* SMS History Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">SMS History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : smsHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No SMS records found
                      </td>
                    </tr>
                  ) : (
                    smsHistory.map((sms) => (
                      <tr key={sms._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {sms.mobileNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {sms.messageType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {sms.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(sms.status)}
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sms.status)}`}>
                              {sms.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(sms.sentAt).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchSMSHistory(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchSMSHistory(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test SMS Tab */}
      {activeTab === 'test' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Test SMS</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                value={testSmsData.mobileNumber}
                onChange={(e) => setTestSmsData({...testSmsData, mobileNumber: e.target.value})}
                placeholder="Enter mobile number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Type
              </label>
              <select
                value={testSmsData.messageType}
                onChange={(e) => setTestSmsData({...testSmsData, messageType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="notification">Notification</option>
                <option value="otp">OTP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={testSmsData.message}
                onChange={(e) => setTestSmsData({...testSmsData, message: e.target.value})}
                placeholder="Enter your message"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={sendTestSMS}
              disabled={testSmsLoading}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testSmsLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {testSmsLoading ? 'Sending...' : 'Send Test SMS'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

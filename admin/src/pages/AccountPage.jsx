import { useAuth } from '../context/AuthContext';

const AccountPage = () => {
  const { user, logout } = useAuth();

  const adminProfile = user?.adminProfile || {
    name: user?.username || 'Admin User',
    email: 'ultramodernajay@gmail.com',
    mobile: '9955955296',
    userType: 'NSA',
    role: 'admin',
    lastLogin: user?.loginTime || new Date().toISOString(),
    loginCount: 0,
    status: 'Active',
    accountCreated: new Date().toISOString()
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
     
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Card Header - Subtle styling */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-md font-medium text-gray-900 border-b pb-2">Personal Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900 font-medium">{adminProfile.name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900 font-medium">{adminProfile.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900 font-medium">{adminProfile.mobile}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-6">
              <h3 className="text-md font-medium text-gray-900 border-b pb-2">Account Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900 font-medium">{adminProfile.userType}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900 font-medium capitalize">{adminProfile.role}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      adminProfile.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {adminProfile.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900 font-medium">
                      {new Date(adminProfile.lastLogin).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'medium',
                        timeStyle: 'medium'
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Login Count</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900 font-medium">{adminProfile.loginCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Section - Subtle separation */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h4 className="text-sm font-medium text-gray-700">Session Management</h4>
                <p className="text-sm text-gray-500 mt-1">End your current admin session</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;

import { NavLink } from 'react-router-dom';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileDrawer = ({ 
  open, 
  onClose, 
  productOpen, 
  toggleProduct 
}) => {
  const { user } = useAuth();

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
      />

      <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out-cubic animate-slide-in-left">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{user.adminProfile.name.split(" ")[0][0]}</span>
                  </div>
              </div>
              <div>
                    <p className="font-semibold text-gray-900">Welcome, {user.adminProfile.name.split(" ")[0]}</p>
                    <p className="text-sm text-gray-500">Admin Dashboard</p>
                  </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <nav className="flex-1 p-6 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navigation</p>
            <div className="space-y-2">
              <NavLink
                to="home"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Home
              </NavLink>
              <NavLink
                to="reports"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Reports
              </NavLink>
              <NavLink
                to="orders"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Orders
              </NavLink>

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
                    <NavLink
                      to="offers"
                      onClick={onClose}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      Offers
                    </NavLink>
                    <NavLink
                      to="packages"
                      onClick={onClose}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      Packages
                    </NavLink>
                    <NavLink
                      to="tests"
                      onClick={onClose}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      Tests
                    </NavLink>
                  </div>
                )}
              </div>

              <NavLink
                to="users"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Users
              </NavLink>
              <NavLink
                to="settings"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Settings
              </NavLink>
              <NavLink
                to="account"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Account
              </NavLink>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">© {new Date().getFullYear()} AryoPath Admin</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;

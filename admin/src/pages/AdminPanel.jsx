import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, ChevronDown, ChevronUp, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MobileDrawer from "../components/auth/MobileDrawer";

export default function AdminPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProduct = () => setProductOpen(!productOpen);

  const getCurrentPageTitle = () => {
    const path = location.pathname;
    
    if (path.includes('/home') || path === '/') return 'Home';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/orders')) return 'Orders';
    if (path.includes('/offers')) return 'Offers';
    if (path.includes('/packages')) return 'Packages';
    if (path.includes('/tests')) return 'Tests';
    if (path.includes('/users')) return 'Users';
    if (path.includes('/account')) return 'Account';
    if (path.includes('/settings')) return 'Settings';
    
    return 'Dashboard';
  };

  const currentPageTitle = getCurrentPageTitle();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:block z-40 h-full w-64 bg-white shadow-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-blue-600">Admin Panel</h1>
        </div>

        <nav className="p-4 space-y-2 text-gray-700">
          <NavLink
            to="home"
            className="block px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            Home
          </NavLink>
          <NavLink
            to="reports"
            className="block px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            Reports
          </NavLink>
          <NavLink
            to="orders"
            className="block px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            Orders
          </NavLink>

          <button
            onClick={toggleProduct}
            className="flex justify-between items-center w-full px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            <span>Products</span>
            {productOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {productOpen && (
            <div className="pl-8 space-y-2 text-sm">
              <NavLink
                to="offers"
                className="block px-3 py-1 rounded-md hover:bg-blue-100"
              >
                Offers
              </NavLink>
              <NavLink
                to="packages"
                className="block px-3 py-1 rounded-md hover:bg-blue-100"
              >
                Packages
              </NavLink>
              <NavLink
                to="tests"
                className="block px-3 py-1 rounded-md hover:bg-blue-100"
              >
                Tests
              </NavLink>
            </div>
          )}

          <NavLink
            to="users"
            className="block px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            Users
          </NavLink>
          <NavLink
            to="settings"
            className="block px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            Settings
          </NavLink>
          <NavLink
            to="account"
            className="block px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            Account
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between bg-white p-4 shadow-sm">
          <button onClick={toggleSidebar} className="lg:hidden">
            <Menu className="text-gray-700" />
          </button>
          <h2 className="text-lg font-semibold text-gray-700 hidden lg:block">
            {currentPageTitle}
          </h2>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User size={16} />
                <span>{user.adminProfile?.name || user.username}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
              title="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="h-full w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Drawer - Enhanced mobile experience */}
      <MobileDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        productOpen={productOpen}
        toggleProduct={toggleProduct}
      />
    </div>
  );
}

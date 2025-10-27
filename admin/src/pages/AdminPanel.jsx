import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProduct = () => setProductOpen(!productOpen);

  // 🧠 Close sidebar automatically on link click (only for mobile)
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-white shadow-md transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-blue-600">Admin Panel</h1>
          <button onClick={toggleSidebar} className="lg:hidden">
            <X className="text-gray-600" />
          </button>
        </div>

        <nav className="p-4 space-y-2 text-gray-700">
          <NavLink
            to="home"
            onClick={handleLinkClick}
            className="block px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            Home
          </NavLink>
          <NavLink
            to="reports"
            onClick={handleLinkClick}
            className="block px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            Reports
          </NavLink>
          <NavLink
            to="orders"
            onClick={handleLinkClick}
            className="block px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            Orders
          </NavLink>

          {/* Accordion Section */}
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
                onClick={handleLinkClick}
                className="block px-3 py-1 rounded-md hover:bg-blue-100"
              >
                Offers
              </NavLink>
              <NavLink
                to="packages"
                onClick={handleLinkClick}
                className="block px-3 py-1 rounded-md hover:bg-blue-100"
              >
                Packages
              </NavLink>
              <NavLink
                to="tests"
                onClick={handleLinkClick}
                className="block px-3 py-1 rounded-md hover:bg-blue-100"
              >
                Tests
              </NavLink>
            </div>
          )}

          <NavLink
            to="settings"
            onClick={handleLinkClick}
            className="block px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
          >
            Settings
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
          <h2 className="text-lg font-semibold text-gray-700">Dashboard</h2>
          <div></div>
        </header>

        {/* Main content */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="h-full w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

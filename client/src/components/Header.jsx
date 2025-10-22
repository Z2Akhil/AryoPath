// src/components/Header.jsx
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { useUser } from '../context/userContext'; // Ensure this path is correct
import AuthModal from './AuthModal'; // Ensure this path is correct

/* ---------- config ---------- */
const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Popular Packages', href: '/packages' },
  { label: 'Offers', href: '/offers' },
  { label: 'All Tests', href: '/tests' },
  { label: 'About Us', href: '/about' }, // Assuming you have an /about route
];

/* ---------- sub-components ---------- */
const Logo = () => (
  <Link to="/" className="flex items-center gap-3 group cursor-pointer">
    <div className="flex items-center gap-2">
      <img
        src="./logo.jpg" // Make sure logo.jpg is in your public folder or imported
        alt="Company Logo"
        className="w-10 h-10 object-contain"
      />
    </div>
    <div className="leading-tight">
      <p className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">AryoPath</p>
      <p className="text-xs text-gray-500 font-medium">In association with ThyroCare</p>
    </div>
  </Link>
);

const SearchBar = () => (
  <div className="relative w-full max-w-xl group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
    </div>
    <input
      type="text"
      placeholder="Search health packages, tests, and more..."
      className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full text-sm bg-white/80 backdrop-blur-sm
               placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
               transition-all duration-300 hover:border-gray-300 shadow-sm hover:shadow-md"
    />
  </div>
);

const CartIcon = ({ count = 0 }) => ( // Default count to 0
  <Link to="/cart" className="relative group cursor-pointer"> {/* Assuming /cart route */}
    <div className="p-2 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors duration-300">
      <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors duration-300" />
    </div>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold
                       rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
        {count}
      </span>
    )}
  </Link>
);

// Helper function to determine display name
const getUserDisplayName = (user) => {
  if (!user) return '';
  // Use firstName if available, otherwise fallback to "My Account"
  return user.firstName ? `Hi, ${user.firstName}` : 'My Account';
};

/* ---------- desktop nav ---------- */
const DesktopNav = ({ user, onLogin, onLogout }) => (
  <div className="hidden lg:flex items-center gap-4">
    {user ? (
      <div className="flex items-center gap-3">
        {/* Link wraps the user display */}
        <Link to="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          {/* Use the helper function result */}
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{getUserDisplayName(user)}</span>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    ) : (
      <button
        onClick={onLogin}
        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        Login
      </button>
    )}
  </div>
);

/* ---------- mobile drawer ---------- */
const MobileDrawer = ({ open, user, onLogin, onLogout, onClose }) => {
  if (!open) return null;

  return (
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
      />

      {/* panel */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out-cubic animate-slide-in-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src="./logo.jpg" alt="Company Logo" className="w-10 h-10 object-contain"/>
              </div>
              <div>
                <p className="font-bold text-gray-900">AryoPath</p>
                <p className="text-xs text-gray-500">ThyroCare Partner</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* User Section */}
          <div className="p-6 border-b border-gray-100">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    {/* Use the helper function result */}
                    <p className="font-semibold text-gray-900">{getUserDisplayName(user).replace('Hi, ','Welcome, ')}</p>
                    <Link to="/account" onClick={onClose} className="text-sm text-blue-600 hover:underline">Manage your account</Link>
                  </div>
                </div>
                <button
                  onClick={() => { onLogout(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onLogin(); onClose(); }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg"
              >
                Login to Your Account
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navigation</p>
            <div className="space-y-2">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  to={href}
                  onClick={onClose}
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">© {new Date().getFullYear()} AryoPath. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
};

/* ---------- main header component ---------- */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, logout } = useUser(); // Get user state and logout function

  // Add for debugging in browser console
  console.log("Header rendering, user state from useUser:", user);

  return (
    <>
      {/* Inline styles for animations (keep if needed) */}
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .ease-out-cubic { transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
      `}</style>

      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 border-b border-gray-200/80 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-20">
            <Logo />

            {/* Desktop Search */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <SearchBar />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <CartIcon count={2} /> {/* Example cart count */}
              <DesktopNav user={user} onLogin={() => setAuthOpen(true)} onLogout={logout} />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(true)}
                className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Menu size={24} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <nav className="hidden lg:block border-t border-gray-100/80">
            <div className="flex items-center justify-between py-4">
              <ul className="flex items-center gap-8">
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    {/* Use NavLink for active styling if needed, otherwise Link is fine */}
                    <NavLink
                      to={href}
                      className={({ isActive }) =>
                        `text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 relative group ${isActive ? 'text-blue-600' : ''}`
                      }
                    >
                      {label}
                      <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 ${ ' ' /* Add active state underline if needed */}`}></span>
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* Quick Actions */}
              <div className="flex items-center gap-4 text-sm">
                <Link to="/help" className="text-gray-600 hover:text-blue-600 transition-colors">Help Center</Link> {/* Assuming /help route */}
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <a href="tel:+911234567890" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  📞 +91 12345 67890
                </a>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Search Bar - shown on mobile below header */}
      <div className="lg:hidden bg-white/90 backdrop-blur-xl border-b border-gray-200/80 px-4 py-3 sticky top-20 z-30"> {/* Adjusted sticky top */}
        <SearchBar />
      </div>

      <MobileDrawer
        open={menuOpen}
        user={user}
        onLogin={() => setAuthOpen(true)}
        onLogout={logout}
        onClose={() => setMenuOpen(false)}
      />

      {/* Render Auth Modal */}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
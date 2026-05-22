'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut, ChevronDown, Settings, Stethoscope } from 'lucide-react';
import { useSiteSettings } from '@/providers/SiteSettingsProvider';
import { useCart } from '@/providers/CartProvider';
import { useAuthModal } from '@/providers/AuthModalProvider';
import { useUser } from '@/providers/UserProvider';
import { Logo } from '@/components/ui';
import SearchBar from '@/components/search/SearchBar';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

const NAV_LINKS = [
  { label: 'Packages', href: '/profiles' },
  { label: 'Offers', href: '/offers' },
  { label: 'Lab Tests', href: '/tests' },
  { label: 'Medicines', href: '/medicines' },
  { label: 'Doctor Consult', href: '/consult' },
  { label: 'About Us', href: '/about' },
];

const CartIcon = ({ count }: { count: number }) => (
  <Link href="/cart" aria-label={`Shopping cart with ${count} items`} className="relative group cursor-pointer">
    <div className="p-2 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors duration-300">
      <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors duration-300" />
    </div>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
        {count}
      </span>
    )}
  </Link>
);

interface DesktopNavProps {
  user: { firstName: string; lastName: string } | null;
  onLogin: () => void;
  onLogout: () => void;
}

const DesktopNav = ({ user, onLogin, onLogout }: DesktopNavProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogoutClick = () => {
    onLogout();
    setIsDropdownOpen(false);
  };

  return (
    <div className="hidden lg:flex items-center gap-3">
      {user ? (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
              {user.firstName}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-fade-in">
                <Link
                  href="/account"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Account
                </Link>
                <Link
                  href="/account/appointments"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Stethoscope className="w-4 h-4" /> My Appointments
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={onLogin}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <User className="w-4 h-4" /> Sign in
        </button>
      )}
    </div>
  );
};

interface MobileDrawerProps {
  open: boolean;
  user: { firstName: string; lastName: string } | null;
  mounted: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onClose: () => void;
}

const MobileDrawer = ({ open, user, mounted, onLogin, onLogout, onClose }: MobileDrawerProps) => {
  // Defer user-dependent rendering until client is mounted to avoid hydration mismatch
  const resolvedUser = mounted ? user : null;
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            {resolvedUser ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-gray-900">Hi, {resolvedUser.firstName}</p>
              </div>
            ) : (
              <button
                onClick={() => { onLogin(); onClose(); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <User className="w-4 h-4" /> Sign in
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-600" />
            </button>
          </div>

          <nav className="flex-1 p-5 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Navigation</p>
            <div className="space-y-1">
              {NAV_LINKS.map(({ label, href }) =>
                (
                  <Link
                    key={label}
                    href={href}
                    onClick={onClose}
                    className="block px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium text-sm"
                  >
                    {label}
                  </Link>
                )
              )}
              {resolvedUser && (
                <>
                  <div className="border-t border-gray-100 my-2" />
                  <Link href="/account" onClick={onClose} className="block px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium text-sm">
                    My Account
                  </Link>
                  <Link href="/account/appointments" onClick={onClose} className="block px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium text-sm">
                    My Appointments
                  </Link>
                  <button
                    onClick={() => { onLogout(); onClose(); }}
                    className="w-full text-left block px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium text-sm"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </nav>

          <div className="p-5 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Ayropath</p>
          </div>
        </div>
      </div>
    </>
  );
};

interface HeaderProps {
  children?: ReactNode;
}

const Header = ({ children }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [showPillBar, setShowPillBar] = useState(false);
  const [showVisitorNudge, setShowVisitorNudge] = useState(false);
  const lastScrollY = useRef(0);

  const { user, logout } = useUser();
  const { cart, medicineCartCount } = useCart();
  const pathname = usePathname();
  const hideMedicineSearchBar = pathname?.startsWith('/medicines');
  const cartCount = (cart?.items?.length || 0) + (medicineCartCount || 0);
  const { settings, loading } = useSiteSettings();
  const { openAuth } = useAuthModal();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // Scroll direction with 10px dead-zone to prevent jitter
  useEffect(() => {
    const THRESHOLD = 10;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;
      if (Math.abs(diff) < THRESHOLD) return;
      const scrollingUp = diff < 0;
      lastScrollY.current = currentY;
      setShowPillBar(currentY > 120 && scrollingUp);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Login nudge for first-time visitors (not logged in)
  useEffect(() => {
    if (!mounted || user) return;
    if (localStorage.getItem('ayropath_nudge_seen')) return;
    const t = setTimeout(() => setShowVisitorNudge(true), 3000);
    return () => clearTimeout(t);
  }, [mounted, user]);

  const dismissNudge = () => {
    setShowVisitorNudge(false);
    localStorage.setItem('ayropath_nudge_seen', '1');
  };

  const handleLogin = () => openAuth();

  const handleLogout = () => setLogoutConfirmOpen(true);

  const confirmLogout = () => {
    logout();
    setLogoutConfirmOpen(false);
    setMenuOpen(false);
    router.push('/');
  };

  const showUserNav = mounted;

  return (
    <>
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.25s ease-out; }
        .animate-slide-up { animation: slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>

      {/* ── MAIN HEADER ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Top bar: logo | search | user+cart */}
          <div className="flex items-center gap-4 h-16">
            <Logo logo={settings?.logo} loading={loading} />

            {/* Search — desktop */}
            {!hideMedicineSearchBar && (
              <div className="hidden lg:flex flex-1 max-w-xl">
                <SearchBar />
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <CartIcon count={mounted ? cartCount : 0} />
              {showUserNav && (
                <DesktopNav user={user} onLogin={handleLogin} onLogout={handleLogout} />
              )}
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Menu size={22} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* Desktop quick links — hides on scroll down, shows on scroll up */}
          <nav className="hidden lg:block border-t border-gray-100">
            <div className="relative flex items-center justify-center py-2.5">
              <ul className="flex items-center gap-7">
                {NAV_LINKS.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors relative group py-1"
                      >
                        {label}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
                      </Link>
                    </li>
                  )
                )}
              </ul>

              {/* Helpline — pinned right */}
              {!loading && settings?.helplineNumber && (
                <a
                  href={`tel:${settings.helplineNumber}`}
                  className="absolute right-0 text-xs text-gray-500 hover:text-blue-600 transition-colors font-medium"
                >
                  📞 {settings.helplineNumber}
                </a>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── MOBILE SEARCH BAR (below header, scrolls away) ─────────── */}
      {!hideMedicineSearchBar && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2.5 z-30">
          <SearchBar />
        </div>
      )}

      {/* ── MOBILE PILL QUICK-LINKS (fixed, appears on scroll-up) ─── */}
      <div
        className={`lg:hidden fixed top-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 transition-transform duration-300 ${
          showPillBar ? 'translate-y-0 shadow-sm' : '-translate-y-full'
        }`}
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2.5">
          {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="shrink-0 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap"
              >
                {label}
              </Link>
            )
          )}
        </div>
      </div>

      <MobileDrawer
        open={menuOpen}
        user={user}
        mounted={mounted}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onClose={() => setMenuOpen(false)}
      />

      <ConfirmationDialog
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout? You will need to login again to access your cart and orders."
        type="danger"
        confirmText="Yes, Logout"
        cancelText="Cancel"
      />

      {/* Visitor login nudge — shown once to unauthenticated first-timers */}
      {showVisitorNudge && !user && (
        <div className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-5 sm:w-80 z-50 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 relative">
            <button onClick={dismissNudge} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors" aria-label="Dismiss">
              <X size={14} className="text-gray-400" />
            </button>
            <div className="flex items-start gap-3 pr-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Welcome to Ayropath!</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Sign in to track orders and save your details for faster booking.</p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => { handleLogin(); dismissNudge(); }} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                    Sign In / Register
                  </button>
                  <button onClick={dismissNudge} className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {children}
    </>
  );
};

export default Header;

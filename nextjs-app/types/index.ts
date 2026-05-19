export interface SocialMedia {
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
}

export interface SiteSettings {
  _id?: string;
  logo: string;
  logoPublicId?: string;
  heroImage: string;
  heroImagePublicId?: string;
  helplineNumber: string;
  email: string;
  socialMedia: SocialMedia;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

export interface Address {
  _id: string;
  houseNo: string;
  roadName?: string;
  area?: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
  isVerified: boolean;
  emailVerified: boolean;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  authProvider?: string;
}

export interface UserContextType {
  user: User | null;
  loading: boolean;
  loginWithOTP: (mobileNumber: string, otp: string) => Promise<{ success: boolean; isNewUser?: boolean; message?: string }>;
  registerWithOTP: (mobileNumber: string, firstName: string, email?: string) => Promise<{ success: boolean; message?: string }>;
  requestOTP: (mobileNumber: string, purpose?: string) => Promise<{ success: boolean; message?: string; verificationId?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
}

export interface CartItem {
  productCode: string;
  productType: string;
  name: string;
  quantity: number;
  originalPrice: number;
  sellingPrice: number;
  discount: number;
  thyrocareRate?: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  productTotal: number;
  collectionCharge: number;
  totalAmount: number;
  hasCollectionCharge?: boolean;
  thyrocareValidation?: boolean;
  breakdown?: {
    productTotal: number;
    collectionCharge: number;
    grandTotal: number;
  };
  guestSessionId?: string;
}

export interface MedicineCartItem {
  slug: string;
  name: string;
  mrp: number;
  offerPrice: number;
  type: string;
  quantity: number;
  thumbnail?: { url: string; publicId?: string };
  prescriptionRequired?: boolean;
}

export interface CartContextType {
  // ── Thyrocare cart (backend-synced) ───────────────────────────────────────
  cart: Cart;
  loading: boolean;
  addToCart: (item: any) => Promise<{ success: boolean; message: string }>;
  removeFromCart: (productCode: string, productType: string) => Promise<{ success: boolean; message: string }>;
  updateQuantity: (productCode: string, productType: string, quantity: number) => Promise<{ success: boolean; message: string }>;
  clearCart: () => Promise<{ success: boolean; message: string }>;
  refreshCart: () => Promise<void>;

  // ── Medicine cart (local state + localStorage) ────────────────────────────
  medicineCart: MedicineCartItem[];
  medicineCartTotal: number;
  medicineCartCount: number;
  addMedicineToCart: (item: Omit<MedicineCartItem, 'quantity'>) => void;
  removeMedicineFromCart: (slug: string) => void;
  updateMedicineQty: (slug: string, qty: number) => void;
  clearMedicineCart: () => void;
}

export interface Admin {
  _id?: string;
  username: string;
  email: string;
  mobile: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  status: boolean;
  isActive: boolean;
  thyrocareUserId?: string;
  userType?: string;
  respId?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  code: string;
  name: string;
  type: string;
  category?: string;
  rate?: {
    b2C: number;
    offerRate?: number;
  };
  sellingPrice?: number;
  discount?: number;
  testCount?: number;
  fasting?: string;
  childs?: any[];
  originalPrice?: number; // UI helper
}

export interface ProductContextType {
  allProducts: Product[];
  packages: Product[];
  tests: Product[];
  offers: Product[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMoreProducts: boolean;
  refreshProducts: () => void;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  removeToast: (id: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}
'use client';

import { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from "react";
import { useUser } from "./UserProvider";
import { useAuthModal } from "./AuthModalProvider";
import CartApi from "@/lib/api/cartApi";
import { axiosInstance } from "@/lib/api/axiosInstance";
import { Cart, CartContextType, MedicineCartItem } from "@/types";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

const initialCartState: Cart = {
    items: [],
    totalItems: 0,
    subtotal: 0,
    totalDiscount: 0,
    productTotal: 0,
    collectionCharge: 0,
    totalAmount: 0,
    hasCollectionCharge: false,
    thyrocareValidation: false,
    breakdown: { productTotal: 0, collectionCharge: 0, grandTotal: 0 }
};

const MEDICINE_CART_KEY = 'medicineCart';

const loadMedicineCartFromStorage = (): MedicineCartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(MEDICINE_CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const { openAuth } = useAuthModal();
    const [cart, setCart] = useState<Cart>(initialCartState);
    const [loading, setLoading] = useState(false);
    const [medicineCart, setMedicineCart] = useState<MedicineCartItem[]>(loadMedicineCartFromStorage);
    const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { loadCart(); }, [user]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try { localStorage.setItem(MEDICINE_CART_KEY, JSON.stringify(medicineCart)); } catch { /* silent */ }
    }, [medicineCart]);

    useEffect(() => {
        if (!user) return;
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(async () => {
            try { await axiosInstance.post('/user/medicine-cart/sync', { items: medicineCart }); } catch { /* silent */ }
        }, 1500);
        return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
    }, [medicineCart, user]);

    const medicineCartTotal = useMemo(
        () => medicineCart.reduce((sum, i) => sum + i.offerPrice * i.quantity, 0),
        [medicineCart]
    );

    const medicineCartCount = useMemo(
        () => medicineCart.reduce((sum, i) => sum + i.quantity, 0),
        [medicineCart]
    );

    const processCartResponse = (response: any) => {
        if (response.success && response.cart) {
            const enhanced: Cart = {
                ...response.cart,
                hasCollectionCharge: response.hasCollectionCharge || false,
                thyrocareValidation: response.thyrocareValidation || false,
                breakdown: response.breakdown || {
                    productTotal: response.cart.productTotal || response.cart.totalAmount,
                    collectionCharge: response.collectionCharge || 0,
                    grandTotal: response.cart.totalAmount
                },
                guestSessionId: response.cart.guestSessionId
            };
            setCart(enhanced);
            saveCartToLocalStorage(enhanced);
            return enhanced;
        }
        return null;
    };

    const loadCart = async () => {
        setLoading(true);
        try {
            if (user) {
                const guestId = cart?.guestSessionId ||
                    (localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')!).guestSessionId : null);
                const response = await CartApi.getCart(guestId);
                processCartResponse(response);
            } else {
                setCart(initialCartState);
            }
        } catch {
            setCart(initialCartState);
        } finally {
            setLoading(false);
        }
    };

    const saveCartToLocalStorage = (cartData: Cart) => {
        if (typeof window === 'undefined') return;
        try { localStorage.setItem("cart", JSON.stringify(cartData)); } catch { /* silent */ }
    };

    const recalculateTotals = (cartData: Cart): Cart => {
        const totalItems    = cartData.items.reduce((s, i) => s + i.quantity, 0);
        const subtotal      = cartData.items.reduce((s, i) => s + i.originalPrice * i.quantity, 0);
        const totalDiscount = cartData.items.reduce((s, i) => s + (i.originalPrice - i.sellingPrice) * i.quantity, 0);
        const productTotal  = cartData.items.reduce((s, i) => s + i.sellingPrice * i.quantity, 0);
        const collectionCharge = cartData.collectionCharge || 0;
        const totalAmount = productTotal + collectionCharge;
        return {
            ...cartData, totalItems, subtotal, totalDiscount, productTotal,
            collectionCharge, totalAmount,
            breakdown: { productTotal, collectionCharge, grandTotal: totalAmount }
        };
    };

    // ── Thyrocare cart operations ───────────────────────────────────────────────

    const addToCart = async (item: any) => {
        if (!user) { openAuth(); return { success: false, message: 'Please login to add items to cart' }; }

        setLoading(true);
        try {
            const updatedCart = { ...cart };
            const productType = item.type?.toUpperCase() || "TEST";

            const existingIdx = updatedCart.items.findIndex(
                ci => ci.productCode === item.code && ci.productType === productType
            );

            const originalPrice = item.originalPrice || item.rate?.b2C || 0;
            const sellingPrice  = item.sellingPrice || originalPrice;
            const discount      = originalPrice > sellingPrice ? originalPrice - sellingPrice : 0;

            if (productType === 'OFFER') {
                const existingOffer = updatedCart.items.find(i => i.productType === 'OFFER' && i.productCode !== item.code);
                if (existingOffer) {
                    setLoading(false);
                    return { success: false, message: 'Only one offer product can be added per order.' };
                }
            }

            if (existingIdx > -1) {
                updatedCart.items[existingIdx].quantity += 1;
            } else {
                updatedCart.items.push({ productCode: item.code, productType, name: item.name, quantity: 1, originalPrice, sellingPrice, discount });
            }

            const finalCart = recalculateTotals(updatedCart);
            setCart(finalCart);
            saveCartToLocalStorage(finalCart);

            const itemToAdd = updatedCart.items.find(ci => ci.productCode === item.code && ci.productType === productType);
            if (itemToAdd) {
                const response = await CartApi.addToCart(item.code, productType, itemToAdd.quantity);
                processCartResponse(response);
            }

            return { success: true, message: "Item added to cart" };
        } catch (error: any) {
            return { success: false, message: error.message || "Failed to add item to cart" };
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (productCode: string, productType: string) => {
        setLoading(true);
        try {
            if (user && productType !== 'MEDICINE') {
                try {
                    const response = await CartApi.removeFromCart(productCode, productType);
                    if (response.success) {
                        processCartResponse(response);
                        if (!response.cart?.items?.length && typeof window !== 'undefined') localStorage.removeItem('cart');
                        return { success: true, message: "Item removed from cart" };
                    }
                } catch { /* fallback below */ }
            }

            const updatedCart = { ...cart };
            updatedCart.items = updatedCart.items.filter(
                i => !(i.productCode === productCode && i.productType === productType)
            );
            const finalCart = recalculateTotals(updatedCart);
            setCart(finalCart);
            if (finalCart.items.length === 0 && typeof window !== 'undefined') localStorage.removeItem('cart');
            else saveCartToLocalStorage(finalCart);

            return { success: true, message: "Item removed from cart" };
        } catch (error: any) {
            return { success: false, message: error.message || "Failed to remove item from cart" };
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (productCode: string, productType: string, quantity: number) => {
        setLoading(true);
        try {
            const updatedCart = { ...cart };
            const item = updatedCart.items.find(i => i.productCode === productCode && i.productType === productType);

            if (item && quantity > 0 && quantity <= 10) {
                item.quantity = quantity;
                const finalCart = recalculateTotals(updatedCart);
                setCart(finalCart);
                saveCartToLocalStorage(finalCart);

                if (user && productType !== 'MEDICINE') {
                    const response = await CartApi.updateQuantity(productCode, productType, quantity);
                    processCartResponse(response);
                }
            }
            return { success: true, message: "Quantity updated" };
        } catch (error: any) {
            return { success: false, message: error.message || "Failed to update quantity" };
        } finally {
            setLoading(false);
        }
    };

    const clearCart = async () => {
        setLoading(true);
        try {
            setCart(initialCartState);
            if (typeof window !== 'undefined') localStorage.removeItem('cart');
            if (user) await CartApi.clearCart();
            return { success: true, message: "Cart cleared" };
        } catch (error: any) {
            return { success: false, message: error.message || "Failed to clear cart" };
        } finally {
            setLoading(false);
        }
    };

    const refreshCart = async () => { await loadCart(); };

    // ── Medicine cart operations (synchronous, localStorage only) ───────────────

    const addMedicineToCart = (item: Omit<MedicineCartItem, 'quantity'>) => {
        if (!user) { openAuth(); return; }
        setMedicineCart(prev => {
            const idx = prev.findIndex(i => i.slug === item.slug);
            if (idx > -1) {
                if (prev[idx].quantity >= 10) return prev;
                const updated = [...prev];
                updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
                return updated;
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeMedicineFromCart = (slug: string) => {
        setMedicineCart(prev => prev.filter(i => i.slug !== slug));
    };

    const updateMedicineQty = (slug: string, qty: number) => {
        if (qty < 1 || qty > 10) return;
        setMedicineCart(prev => {
            const idx = prev.findIndex(i => i.slug === slug);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], quantity: qty };
            return updated;
        });
    };

    const clearMedicineCart = () => {
        setMedicineCart([]);
    };

    const value: CartContextType = {
        cart, loading,
        addToCart, removeFromCart, updateQuantity, clearCart, refreshCart,
        medicineCart, medicineCartTotal, medicineCartCount,
        addMedicineToCart, removeMedicineFromCart, updateMedicineQty, clearMedicineCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

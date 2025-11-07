import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "./userContext";
import CartApi from "../api/cartApi";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useUser();
  const [cart, setCart] = useState({
    items: [],
    totalItems: 0,
    subtotal: 0,
    totalDiscount: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, [user]);

  const loadCart = async () => {
    setLoading(true);
    try {
      if (user) {
        const response = await CartApi.getCart();
        if (response.success && response.cart) {
          setCart(response.cart);
        }
      } else {
        loadCartFromLocalStorage();
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      loadCartFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadCartFromLocalStorage = () => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        const localCart = JSON.parse(saved);
        setCart(localCart);
      } catch (err) {
        console.error("Error parsing cart from localStorage:", err);
        setCart({
          items: [],
          totalItems: 0,
          subtotal: 0,
          totalDiscount: 0,
          totalAmount: 0
        });
      }
    }
  };

  // Save cart to localStorage
  const saveCartToLocalStorage = (cartData) => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartData));
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  };

  // Save cart to database (if user is logged in)
  const saveCartToDatabase = async (cartData) => {
    if (!user) return { success: true }; // Skip if not logged in
    
    try {
      // For now, we'll sync each operation individually
      // In a real implementation, you might want to sync the entire cart
      return { success: true };
    } catch (error) {
      console.error("Error saving cart to database:", error);
      return { success: false, error: error.message };
    }
  };

  // Recalculate cart totals
  const recalculateTotals = (cartData) => {
    const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartData.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
    const totalDiscount = cartData.items.reduce((sum, item) => sum + ((item.originalPrice - item.sellingPrice) * item.quantity), 0);
    const totalAmount = cartData.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

    return {
      ...cartData,
      totalItems,
      subtotal,
      totalDiscount,
      totalAmount
    };
  };

  // Add item to cart
  const addToCart = async (item) => {
    setLoading(true);
    
    try {
      const updatedCart = { ...cart };
      const existingItemIndex = updatedCart.items.findIndex(
        cartItem => cartItem.productCode === item.code
      );

      if (existingItemIndex > -1) {
        // Item already exists, update quantity
        updatedCart.items[existingItemIndex].quantity += 1;
      } else {
        // Add new item
        const originalPrice = parseFloat(item.rate?.b2C || 0);
        const sellingPrice = parseFloat(item.rate?.offerRate || 0);
        const discount = originalPrice > sellingPrice ? originalPrice - sellingPrice : 0;
        
        updatedCart.items.push({
          productCode: item.code,
          productType: item.type?.toUpperCase() || 'TEST',
          name: item.name,
          quantity: 1,
          originalPrice: originalPrice,
          sellingPrice: sellingPrice,
          discount: discount
        });
      }

      // Recalculate totals
      const finalCart = recalculateTotals(updatedCart);

      // Update state and localStorage
      setCart(finalCart);
      saveCartToLocalStorage(finalCart);

      // Save to database if user is logged in
      if (user) {
        const itemToAdd = updatedCart.items.find(cartItem => cartItem.productCode === item.code);
        await CartApi.addToCart(
          item.code,
          item.type?.toUpperCase() || 'TEST',
          itemToAdd.quantity
        );
      }

      setLoading(false);
      return { success: true, message: "Item added to cart" };
    } catch (error) {
      console.error("Error adding to cart:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to add item to cart" };
    }
  };

  // Remove item from cart
  const removeFromCart = async (productCode) => {
    setLoading(true);
    
    try {
      const updatedCart = { ...cart };
      const itemToRemove = updatedCart.items.find(item => item.productCode === productCode);
      updatedCart.items = updatedCart.items.filter(item => item.productCode !== productCode);

      // Recalculate totals
      const finalCart = recalculateTotals(updatedCart);

      // Update state and localStorage
      setCart(finalCart);
      saveCartToLocalStorage(finalCart);

      // Remove from database if user is logged in
      if (user && itemToRemove) {
        await CartApi.removeFromCart(
          productCode,
          itemToRemove.productType
        );
      }

      setLoading(false);
      return { success: true, message: "Item removed from cart" };
    } catch (error) {
      console.error("Error removing from cart:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to remove item from cart" };
    }
  };

  // Update item quantity
  const updateQuantity = async (productCode, quantity) => {
    setLoading(true);
    
    try {
      const updatedCart = { ...cart };
      const item = updatedCart.items.find(item => item.productCode === productCode);
      
      if (item && quantity > 0 && quantity <= 10) {
        item.quantity = quantity;
        
        // Recalculate totals
        const finalCart = recalculateTotals(updatedCart);

        // Update state and localStorage
        setCart(finalCart);
        saveCartToLocalStorage(finalCart);

        // Update database if user is logged in
        if (user) {
          await CartApi.updateQuantity(
            productCode,
            item.productType,
            quantity
          );
        }
      }
      
      setLoading(false);
      return { success: true, message: "Quantity updated" };
    } catch (error) {
      console.error("Error updating quantity:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to update quantity" };
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    setLoading(true);
    
    try {
      const emptyCart = {
        items: [],
        totalItems: 0,
        subtotal: 0,
        totalDiscount: 0,
        totalAmount: 0
      };
      
      // Update state and localStorage
      setCart(emptyCart);
      saveCartToLocalStorage(emptyCart);

      // Clear database if user is logged in
      if (user) {
        await CartApi.clearCart();
      }

      setLoading(false);
      return { success: true, message: "Cart cleared" };
    } catch (error) {
      console.error("Error clearing cart:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to clear cart" };
    }
  };

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

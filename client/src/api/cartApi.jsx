import { axiosInstance } from './axiosInstance';

class CartApi {
  // Get cart from backend
  static async getCart(guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.get('/cart', { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cart');
    }
  }

  // Add item to cart
  static async addToCart(productCode, productType, quantity = 1, guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.post('/cart/items', 
        { productCode, productType, quantity },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to add item to cart');
    }
  }

  // Update item quantity
  static async updateQuantity(productCode, productType, quantity, guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.put(`/cart/items/${productCode}`, 
        { productType, quantity },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw new Error(error.response?.data?.message || 'Failed to update cart item');
    }
  }

  // Remove item from cart
  static async removeFromCart(productCode, productType, guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.delete(`/cart/items/${productCode}`, 
        { 
          data: { productType },
          headers 
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove item from cart');
    }
  }

  // Clear entire cart
  static async clearCart(guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.delete('/cart', { headers });
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to clear cart');
    }
  }

}

export default CartApi;

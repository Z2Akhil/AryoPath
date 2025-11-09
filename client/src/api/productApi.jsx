import { axiosInstance } from "./axiosInstance";

/**
 * Fetch products from API
 * @param {string} productType - "ALL", "TESTS", "PROFILE", "OFFER"
 * @returns {Promise<Object[]>} - Array of products
 */
export const getProducts = async (productType) => {
  try {
    const response = await axiosInstance.get(`/client/products?type=${productType}`);

    if (response.data.success) {
      return response.data.products || [];
    } else {
      console.warn("⚠️ Unexpected API response:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

import { axiosInstance } from "./axiosInstance";

/**
 * Fetch products from API with custom pricing
 * @param {string} productType - "ALL", "TEST", "PROFILE", "OFFER"
 * @returns {Promise<Object[]>} - Array of products with combined data
 */
export const getProducts = async (productType) => {
  try {
    console.log(`Fetching products for type: ${productType}`);
    const response = await axiosInstance.post("/admin/products", {
      productType: productType,
    });

    const data = response.data;
    console.log(`API Response for ${productType}:`, data);

    // Handle both old and new API response formats
    if (data.success && data.products) {
      // New format: { success: true, products: [...] }
      console.log(`Returning ${data.products.length} products for ${productType}`);
      return data.products;
    } else if (data.response === "Success" && data.master) {
      // Old format: fallback for compatibility
      console.warn("⚠️ Using legacy API response format");
      let products = [];
      switch (productType.toUpperCase()) {
        case "OFFER":
          products = data.master.offer || [];
          break;
        case "TEST":
          products = data.master.tests || [];
          break;
        case "PROFILE":
          products = data.master.profile || [];
          break;
        case "ALL":
          products = [
            ...(data.master.offer || []),
            ...(data.master.tests || []),
            ...(data.master.profile || []),
          ];
          break;
        default:
          products = [];
      }
      console.log(`Returning ${products.length} products for ${productType} (legacy format)`);
      return products;
    } else {
      console.warn("⚠️ Unexpected API response:", data);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching ${productType} products:`, error);
    return [];
  }
};

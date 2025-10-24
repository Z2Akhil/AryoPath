import { axiosInstance } from "./axiosInstance";

/**
 * Fetch products from API
 * @param {string} productType - "ALL", "TESTS", "PROFILE", "OFFER"
 * @returns {Promise<Object[]>} - Array of products
 */
export const getProducts = async (productType) => {
  try {
    const response = await axiosInstance.post("/productsmaster/Products", {
      ProductType: productType,
    });

    const data = response.data;

    if (data.response === "Success" && data.master) {
      switch (productType.toUpperCase()) {
        case "OFFER":
          return data.master.offer || [];
        case "TEST":
          return data.master.tests || [];
        case "PROFILE":
          return data.master.profile || [];
        case "ALL":
          return [
            ...(data.master.offer || []),
            ...(data.master.tests || []),
            ...(data.master.profile || []),
          ];
        default:
          return [];
      }
    } else {
      console.warn("⚠️ Unexpected API response:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

import { axiosInstance } from "./axiosInstance";

/**
 * checkPincode - checks if a pincode is available through our backend
 * @param {string} pincode - the pincode to check
 * @returns {Promise<object>} - resolves with API response
 */
export const checkPincode = async (pincode) => {
  if (!pincode) throw new Error("Pincode is required");

  try {
    const response = await axiosInstance.get(`/client/pincode/${pincode}`);
    return response.data.data;
  } catch (error) {
    console.error("Pincode check failed:", error);
    throw error;
  }
};

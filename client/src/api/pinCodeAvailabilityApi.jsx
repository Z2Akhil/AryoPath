import { axiosInstance } from "./axiosInstance"; // adjust path

/**
 * checkPincode - checks if a pincode is available
 * @param {string} pincode - the pincode to check
 * @returns {Promise<object>} - resolves with API response
 */
export const checkPincode = async (pincode) => {
  if (!pincode) throw new Error("Pincode is required");

  try {
    const response = await axiosInstance.post("/TechsoApi/PincodeAvailability", {
      Pincode: pincode,
    });
    return response.data;
  } catch (error) {
    console.error("Pincode check failed:", error);
    throw error;
  }
};

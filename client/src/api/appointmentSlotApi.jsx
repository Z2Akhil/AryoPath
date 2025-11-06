import { axiosInstance } from "./axiosInstance";

/**
 * Fetch appointment slots through our backend proxy
 * @param {string} pincode - Pincode of the center
 * @param {string} date - Appointment date in YYYY-MM-DD format
 * @param {Array} patients - Array of patient objects [{ Id, Name, Gender, Age }]
 * @param {Array} items - Array of item objects [{ Id, PatientQuantity, PatientIds }]
 * @returns {Promise} - API response
 */
export const getAppointmentSlots = async ({ pincode, date, patients, items }) => {
  try {
    const response = await axiosInstance.post("/client/appointment-slots", {
      pincode,
      date,
      patients,
      items
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching appointment slots:", error.response?.data || error.message);
    throw error;
  }
};

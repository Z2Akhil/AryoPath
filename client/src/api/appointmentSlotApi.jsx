import { axiosInstance } from "./axiosInstance"; // your axiosInstance file

/**
 * Fetch appointment slots from Thyrocare API
 * @param {string} pincode - Pincode of the center
 * @param {string} date - Appointment date in YYYY-MM-DD format
 * @param {Array} patients - Array of patient objects [{ Id, Name, Gender, Age }]
 * @param {Array} items - Array of item objects [{ Id, PatientQuantity, PatientIds }]
 * @returns {Promise} - API response
 */
export const getAppointmentSlots = async ({ pincode, date, patients, items }) => {
  try {
    const response = await axiosInstance.post("/TechsoApi/GetAppointmentSlots",
      {
        Pincode: pincode,
        Date: date,
        BenCount: patients.length,
        Patients: patients,
        Items: items,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching appointment slots:", error.response?.data || error.message);
    throw error;
  }
};

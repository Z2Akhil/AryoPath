import { axiosInstance } from "./axiosInstance";

const siteSettings = async () => {
  try {
    const response = await axiosInstance.get("/settings");

    if (response.data?.success) {
      return response.data.data; // ✅ directly return the settings object
    } else {
      console.warn("⚠️ Unexpected API response:", response.data);
      return null;
    }
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return null;
  }
};

export default siteSettings;


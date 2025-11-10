import { axiosInstance } from './axiosInstance';

class BeneficiaryApi {
  // Get all beneficiaries for current user
  static async getBeneficiaries() {
    try {
      const response = await axiosInstance.get('/beneficiaries');
      return response.data;
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch beneficiaries');
    }
  }

  // Add new beneficiary
  static async addBeneficiary(beneficiaryData) {
    try {
      const response = await axiosInstance.post('/beneficiaries', beneficiaryData);
      return response.data;
    } catch (error) {
      console.error('Error adding beneficiary:', error);
      throw new Error(error.response?.data?.message || 'Failed to add beneficiary');
    }
  }

  // Update beneficiary
  static async updateBeneficiary(beneficiaryId, beneficiaryData) {
    try {
      const response = await axiosInstance.put(`/beneficiaries/${beneficiaryId}`, beneficiaryData);
      return response.data;
    } catch (error) {
      console.error('Error updating beneficiary:', error);
      throw new Error(error.response?.data?.message || 'Failed to update beneficiary');
    }
  }

  // Delete beneficiary
  static async deleteBeneficiary(beneficiaryId) {
    try {
      const response = await axiosInstance.delete(`/beneficiaries/${beneficiaryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete beneficiary');
    }
  }

  // Set default beneficiary
  static async setDefaultBeneficiary(beneficiaryId) {
    try {
      const response = await axiosInstance.patch(`/beneficiaries/${beneficiaryId}/default`);
      return response.data;
    } catch (error) {
      console.error('Error setting default beneficiary:', error);
      throw new Error(error.response?.data?.message || 'Failed to set default beneficiary');
    }
  }
}

export default BeneficiaryApi;

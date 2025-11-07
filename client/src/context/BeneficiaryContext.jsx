import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "./userContext";
import BeneficiaryApi from "../api/beneficiaryApi";
import { 
  getSavedBeneficiaries, 
  saveBeneficiary, 
  deleteBeneficiary as deleteLocalBeneficiary,
  createBeneficiary as createLocalBeneficiary
} from "../utils/localStorage";

const BeneficiaryContext = createContext();

export const BeneficiaryProvider = ({ children }) => {
  const { user } = useUser();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load beneficiaries on component mount and when user changes
  useEffect(() => {
    loadBeneficiaries();
  }, [user]);

  // Load beneficiaries from appropriate source (localStorage or database)
  const loadBeneficiaries = async () => {
    setLoading(true);
    try {
      if (user) {
        // User is logged in - load from database
        const response = await BeneficiaryApi.getBeneficiaries();
        if (response.success && response.beneficiaries) {
          setBeneficiaries(response.beneficiaries);
          // Also save to localStorage for consistency
          response.beneficiaries.forEach(beneficiary => {
            saveBeneficiary({
              id: beneficiary.id,
              name: beneficiary.name,
              age: beneficiary.age,
              gender: beneficiary.gender,
              relationship: beneficiary.relationship,
              isDefault: beneficiary.isDefault,
              createdAt: beneficiary.createdAt
            });
          });
        }
      } else {
        // Guest user - load from localStorage
        const localBeneficiaries = getSavedBeneficiaries();
        setBeneficiaries(localBeneficiaries);
      }
    } catch (error) {
      console.error("Error loading beneficiaries:", error);
      // Fallback to localStorage if database fails
      const localBeneficiaries = getSavedBeneficiaries();
      setBeneficiaries(localBeneficiaries);
    } finally {
      setLoading(false);
    }
  };

  // Add beneficiary
  const addBeneficiary = async (beneficiaryData) => {
    setLoading(true);
    
    try {
      const newBeneficiary = createLocalBeneficiary(beneficiaryData);

      // Save to localStorage
      if (saveBeneficiary(newBeneficiary)) {
        // Update state
        const updatedBeneficiaries = [...beneficiaries, newBeneficiary];
        setBeneficiaries(updatedBeneficiaries);

        // Save to database if user is logged in
        if (user) {
          await BeneficiaryApi.addBeneficiary({
            name: beneficiaryData.name,
            age: beneficiaryData.age,
            gender: beneficiaryData.gender,
            relationship: beneficiaryData.relationship,
            isDefault: beneficiaryData.isDefault || false
          });
        }

        setLoading(false);
        return { success: true, message: "Beneficiary added successfully" };
      } else {
        setLoading(false);
        return { success: false, message: "Failed to add beneficiary to localStorage" };
      }
    } catch (error) {
      console.error("Error adding beneficiary:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to add beneficiary" };
    }
  };

  // Update beneficiary
  const updateBeneficiary = async (beneficiaryId, beneficiaryData) => {
    setLoading(true);
    
    try {
      const updatedBeneficiary = {
        id: beneficiaryId,
        ...beneficiaryData
      };

      // Update in localStorage
      if (saveBeneficiary(updatedBeneficiary)) {
        // Update state
        const updatedBeneficiaries = beneficiaries.map(beneficiary =>
          beneficiary.id === beneficiaryId ? updatedBeneficiary : beneficiary
        );
        setBeneficiaries(updatedBeneficiaries);

        // Update in database if user is logged in
        if (user) {
          await BeneficiaryApi.updateBeneficiary(beneficiaryId, beneficiaryData);
        }

        setLoading(false);
        return { success: true, message: "Beneficiary updated successfully" };
      } else {
        setLoading(false);
        return { success: false, message: "Failed to update beneficiary in localStorage" };
      }
    } catch (error) {
      console.error("Error updating beneficiary:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to update beneficiary" };
    }
  };

  // Delete beneficiary
  const deleteBeneficiary = async (beneficiaryId) => {
    setLoading(true);
    
    try {
      // Delete from localStorage
      if (deleteLocalBeneficiary(beneficiaryId)) {
        // Update state
        const updatedBeneficiaries = beneficiaries.filter(beneficiary => beneficiary.id !== beneficiaryId);
        setBeneficiaries(updatedBeneficiaries);

        // Delete from database if user is logged in
        if (user) {
          await BeneficiaryApi.deleteBeneficiary(beneficiaryId);
        }

        setLoading(false);
        return { success: true, message: "Beneficiary deleted successfully" };
      } else {
        setLoading(false);
        return { success: false, message: "Failed to delete beneficiary from localStorage" };
      }
    } catch (error) {
      console.error("Error deleting beneficiary:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to delete beneficiary" };
    }
  };

  // Set default beneficiary
  const setDefaultBeneficiary = async (beneficiaryId) => {
    setLoading(true);
    
    try {
      // Update all beneficiaries in localStorage
      const updatedBeneficiaries = beneficiaries.map(beneficiary => ({
        ...beneficiary,
        isDefault: beneficiary.id === beneficiaryId
      }));

      // Save each beneficiary to localStorage
      updatedBeneficiaries.forEach(beneficiary => {
        saveBeneficiary(beneficiary);
      });

      // Update state
      setBeneficiaries(updatedBeneficiaries);

      // Update in database if user is logged in
      if (user) {
        await BeneficiaryApi.setDefaultBeneficiary(beneficiaryId);
      }

      setLoading(false);
      return { success: true, message: "Default beneficiary set successfully" };
    } catch (error) {
      console.error("Error setting default beneficiary:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to set default beneficiary" };
    }
  };

  // Get default beneficiary
  const getDefaultBeneficiary = () => {
    return beneficiaries.find(beneficiary => beneficiary.isDefault) || beneficiaries[0] || null;
  };

  const value = {
    beneficiaries,
    loading,
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    setDefaultBeneficiary,
    getDefaultBeneficiary,
    loadBeneficiaries
  };

  return (
    <BeneficiaryContext.Provider value={value}>
      {children}
    </BeneficiaryContext.Provider>
  );
};

export const useBeneficiary = () => {
  const context = useContext(BeneficiaryContext);
  if (context === undefined) {
    throw new Error('useBeneficiary must be used within a BeneficiaryProvider');
  }
  return context;
};

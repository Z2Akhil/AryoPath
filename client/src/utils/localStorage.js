const SAVED_BENEFICIARIES_KEY = 'aryopath_saved_beneficiaries';
const SAVED_CONTACT_INFO_KEY = 'aryopath_saved_contact_info';

export const createBeneficiary = (data) => ({
  id: data.id || Date.now().toString(),
  name: data.name || '',
  age: data.age || '',
  gender: data.gender || '',
  relationship: data.relationship || 'Self',
  isDefault: data.isDefault || false,
  createdAt: data.createdAt || new Date().toISOString()
});

export const createContactInfo = (data) => ({
  email: data.email || '',
  address: {
    street: data.address?.street || '',
    city: data.address?.city || '',
    state: data.address?.state || '',
    pincode: data.address?.pincode || '',
    landmark: data.address?.landmark || ''
  },
  mobile: data.mobile || '',
  isDefault: data.isDefault || false,
  updatedAt: data.updatedAt || new Date().toISOString()
});

const getUserKey = (baseKey) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id ? `${baseKey}_${user.id}` : baseKey;
};

export const getSavedBeneficiaries = () => {
  try {
    const key = getUserKey(SAVED_BENEFICIARIES_KEY);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading saved beneficiaries:', error);
    return [];
  }
};

export const saveBeneficiary = (beneficiary) => {
  try {
    const key = getUserKey(SAVED_BENEFICIARIES_KEY);
    const beneficiaries = getSavedBeneficiaries();
    
    if (beneficiary.isDefault) {
      beneficiaries.forEach(b => b.isDefault = false);
    }
    
    const existingIndex = beneficiaries.findIndex(b => b.id === beneficiary.id);
    if (existingIndex >= 0) {
      beneficiaries[existingIndex] = beneficiary;
    } else {
      beneficiaries.push(beneficiary);
    }
    
    localStorage.setItem(key, JSON.stringify(beneficiaries));
    return true;
  } catch (error) {
    console.error('Error saving beneficiary:', error);
    return false;
  }
};

export const deleteBeneficiary = (beneficiaryId) => {
  try {
    const key = getUserKey(SAVED_BENEFICIARIES_KEY);
    const beneficiaries = getSavedBeneficiaries().filter(b => b.id !== beneficiaryId);
    localStorage.setItem(key, JSON.stringify(beneficiaries));
    return true;
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    return false;
  }
};

export const getDefaultBeneficiary = () => {
  const beneficiaries = getSavedBeneficiaries();
  return beneficiaries.find(b => b.isDefault) || beneficiaries[0] || null;
};

// Contact Information Management
export const getSavedContactInfo = () => {
  try {
    const key = getUserKey(SAVED_CONTACT_INFO_KEY);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading saved contact info:', error);
    return null;
  }
};

export const saveContactInfo = (contactInfo) => {
  try {
    const key = getUserKey(SAVED_CONTACT_INFO_KEY);
    const existingInfo = getSavedContactInfo();
    
    // Merge with existing data if available
    const mergedInfo = {
      ...(existingInfo || {}),
      ...contactInfo,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(mergedInfo));
    return true;
  } catch (error) {
    console.error('Error saving contact info:', error);
    return false;
  }
};

// Clear all saved data for current user
export const clearUserData = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      localStorage.removeItem(`${SAVED_BENEFICIARIES_KEY}_${user.id}`);
      localStorage.removeItem(`${SAVED_CONTACT_INFO_KEY}_${user.id}`);
    }
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};

// Get initial form data (beneficiaries + contact info)
export const getInitialFormData = () => {
  const defaultBeneficiary = getDefaultBeneficiary();
  const contactInfo = getSavedContactInfo();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return {
    beneficiaries: defaultBeneficiary ? [defaultBeneficiary] : [{ name: '', age: '', gender: '' }],
    contactInfo: {
      email: contactInfo?.email || '',
      mobile: user.mobileNumber || '',
      address: contactInfo?.address || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
      }
    }
  };
};

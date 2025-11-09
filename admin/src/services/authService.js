import axios from 'axios';

const LOGIN_API_URL = `${import.meta.env.VITE_BACKEND_API}/api/admin/login`;

class AuthService {
  /**
   * Login user with external API
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Promise<Object>} Login response with API key
   */
  async login(username, password) {
    try {
      console.log('Attempting login for user:', username);
      const response = await axios.post(LOGIN_API_URL, {
        username,
        password,
        portalType: 'DSAPortal',
        userType: 'DSA'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Login API response:', response.data);

      if (response.data.success && response.data.apiKey) {
        const authData = {
          success: true,
          apiKey: response.data.apiKey,
          respId: response.data.respId,
          timestamp: new Date().toISOString(),
          adminProfile: response.data.adminProfile,
          sessionInfo: response.data.sessionInfo
        };

        console.log('Login successful, storing auth data:', {
          apiKey: authData.apiKey.substring(0, 10) + '...',
          timestamp: authData.timestamp
        });

        return authData;
      } else {
        throw new Error(response.data.error || 'Login failed: Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        throw new Error(error.response.data?.error || 'Login failed: Invalid credentials');
      } else if (error.request) {
        throw new Error('Login failed: Network error. Please check your connection.');
      } else {
        throw new Error('Login failed: An unexpected error occurred.');
      }
    }
  }

  /**
   * Check if API key is expired (expires at 00:00 IST daily)
   * @param {string} timestamp - ISO timestamp of when API key was obtained
   * @returns {boolean} True if expired
   */
  isApiKeyExpired(timestamp) {
    if (!timestamp) {
      console.log('No timestamp provided, considering expired');
      return true;
    }

    const now = new Date();
    const loginTime = new Date(timestamp);
    
    console.log('Checking API key expiration:');
    console.log('Login time:', loginTime);
    console.log('Current time:', now);
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffset);
    const loginTimeIST = new Date(loginTime.getTime() + istOffset);
    
    console.log('Login time IST:', loginTimeIST);
    console.log('Current time IST:', nowIST);
    
    // Check if we've crossed midnight in IST
    // API key expires at 00:00 IST daily, so check if current date is different from login date
    // Also check if the login was from a previous day, month, or year
    const isExpired = nowIST.getDate() !== loginTimeIST.getDate() || 
                     nowIST.getMonth() !== loginTimeIST.getMonth() || 
                     nowIST.getFullYear() !== loginTimeIST.getFullYear();
    
    console.log('API key expired:', isExpired);
    return isExpired;
  }

  /**
   * Store authentication data in localStorage
   * @param {Object} authData - Authentication data
   */
  storeAuthData(authData) {
    try {
      localStorage.setItem('admin_auth', JSON.stringify(authData));
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }
  }

  /**
   * Retrieve authentication data from localStorage
   * @returns {Object|null} Stored authentication data
   */
  getStoredAuthData() {
    try {
      const stored = localStorage.getItem('admin_auth');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve auth data:', error);
      return null;
    }
  }

  /**
   * Clear authentication data from localStorage
   */
  clearAuthData() {
    try {
      localStorage.removeItem('admin_auth');
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Check if user is authenticated and token is valid
   * @returns {boolean} True if authenticated and token is valid
   */
  isAuthenticated() {
    const authData = this.getStoredAuthData();
    
    if (!authData || !authData.apiKey || !authData.timestamp) {
      return false;
    }

    return !this.isApiKeyExpired(authData.timestamp);
  }

  /**
   * Get current API key if valid
   * @returns {string|null} API key or null if expired/invalid
   */
  getCurrentApiKey() {
    if (!this.isAuthenticated()) {
      return null;
    }

    const authData = this.getStoredAuthData();
    return authData?.apiKey || null;
  }
}

// Export singleton instance
export default new AuthService();

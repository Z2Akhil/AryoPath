import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      console.log('Checking auth status...');
      const authenticated = authService.isAuthenticated();
      console.log('Auth status:', authenticated);
      
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const authData = authService.getStoredAuthData();
        console.log('Auth data found:', authData);
        
        setUser({
          username: authData?.username || 'Admin',
          loginTime: authData?.timestamp,
          adminProfile: authData?.adminProfile
        });
      } else {
        console.log('No valid auth data found');
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user with credentials
   * @param {string} username 
   * @param {string} password 
   */
  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login(username, password);

      if (result.success) {
        const authData = {
          apiKey: result.apiKey,
          timestamp: result.timestamp,
          username: username,
          respId: result.respId,
          adminProfile: result.adminProfile,
          sessionInfo: result.sessionInfo
        };

        authService.storeAuthData(authData);

        setIsAuthenticated(true);
        setUser({
          username: username,
          loginTime: result.timestamp,
          adminProfile: result.adminProfile
        });

        return { success: true };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.clearAuthData();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
  };

  /**
   * Get current API key for authenticated requests
   */
  const getApiKey = () => {
    return authService.getCurrentApiKey();
  };

  /**
   * Clear any authentication errors
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    logout,
    getApiKey,
    clearError,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;

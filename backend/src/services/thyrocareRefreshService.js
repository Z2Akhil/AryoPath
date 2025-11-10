import axios from 'axios';
import Admin from '../models/Admin.js';
import AdminSession from '../models/AdminSession.js';

/**
 * Service for automatically refreshing ThyroCare API keys
 */
class ThyrocareRefreshService {
  
  /**
   * Automatically refresh ThyroCare API keys using stored credentials
   * @returns {Promise<Object>} The new session object
   */
  static async refreshApiKeys() {
    try {
      console.log('🔄 Starting automatic API key refresh...');
      
      const username = process.env.THYROCARE_USERNAME;
      const password = process.env.THYROCARE_PASSWORD;
      const thyrocareApiUrl = process.env.THYROCARE_API_URL;
      
      if (!username || !password) {
        throw new Error('ThyroCare credentials not configured in environment variables');
      }
      
      console.log('Making automatic ThyroCare API call...');
      const response = await axios.post(`${thyrocareApiUrl}/api/Login/Login`, {
        username,
        password,
        portalType: 'DSAPortal',
        userType: 'DSA'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Automatic ThyroCare API response:', {
        status: response.status,
        response: response.data.response
      });

      if (response.data.response === 'Success' && response.data.apiKey) {
        const thyrocareData = response.data;
        
        // Find or create admin from ThyroCare data
        const admin = await Admin.findOrCreateFromThyroCare(thyrocareData, username);
        
        // Create single active session (deactivates previous ones)
        const session = await AdminSession.createSingleActiveSession(
          admin._id, 
          thyrocareData, 
          'AUTO_REFRESH', // Special IP for automatic refreshes
          'AUTO_REFRESH_SERVICE'
        );
        
        console.log('✅ Automatic API key refresh successful:', {
          sessionId: session._id,
          apiKey: session.thyrocareApiKey.substring(0, 10) + '...',
          expiresAt: session.apiKeyExpiresAt?.toISOString()
        });
        
        return session;
      } else {
        throw new Error('Automatic refresh failed: ' + (response.data.response || 'Invalid response from ThyroCare'));
      }
      
    } catch (error) {
      console.error('❌ Automatic API key refresh failed:', error);
      
      if (error.response) {
        console.error('ThyroCare API error:', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(`ThyroCare API error: ${error.response.data?.response || error.response.status}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Get or refresh API key - main entry point for client APIs
   * @returns {Promise<string>} The active API key
   */
  static async getOrRefreshApiKey() {
    try {
      // First, try to find an active session
      const activeSession = await AdminSession.findOne({
        isActive: true
      }).sort({ createdAt: -1 });
      
      // If no active session or session is expired, refresh
      if (!activeSession || activeSession.isApiKeyExpired()) {
        console.log('🔄 No valid session found, triggering automatic refresh...');
        const newSession = await this.refreshApiKeys();
        return newSession.thyrocareApiKey;
      }
      
      // Check if session is expiring soon (within 1 hour)
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      if (activeSession.apiKeyExpiresAt < oneHourFromNow) {
        console.log('🔄 Session expiring soon, preemptively refreshing...');
        const newSession = await this.refreshApiKeys();
        return newSession.thyrocareApiKey;
      }
      
      console.log('✅ Using existing active session:', {
        sessionId: activeSession._id,
        apiKey: activeSession.thyrocareApiKey.substring(0, 10) + '...',
        expiresAt: activeSession.apiKeyExpiresAt?.toISOString()
      });
      
      return activeSession.thyrocareApiKey;
      
    } catch (error) {
      console.error('❌ Failed to get or refresh API key:', error);
      throw error;
    }
  }
  
  /**
   * Check if we need to refresh on app startup
   */
  static async checkAndRefreshOnStartup() {
    try {
      console.log('🔍 Checking API key status on app startup...');
      
      const activeSession = await AdminSession.findOne({
        isActive: true
      }).sort({ createdAt: -1 });
      
      if (!activeSession) {
        console.log('🔄 No active session found on startup, refreshing...');
        await this.refreshApiKeys();
        return;
      }
      
      if (activeSession.isApiKeyExpired()) {
        console.log('🔄 Active session expired on startup, refreshing...');
        await this.refreshApiKeys();
        return;
      }
      
      console.log('✅ Active session found on startup:', {
        sessionId: activeSession._id,
        expiresAt: activeSession.apiKeyExpiresAt?.toISOString()
      });
      
    } catch (error) {
      console.error('❌ Startup API key check failed:', error);
      // Don't throw error on startup - we'll handle it when APIs are called
    }
  }
}

export default ThyrocareRefreshService;

import axios from "axios";
import SMSHistory from "../models/SMSHistory.js";
import AdminActivity from "../models/AdminActivity.js";

class SMSAdminController {
  // Get Fast2SMS wallet balance
  static async getWalletBalance(req, res) {
    const startTime = Date.now();
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    try {
      console.log('💰 Fetching Fast2SMS wallet balance');

      // Validate environment variables
      if (!process.env.FAST2SMS_API_KEY) {
        throw new Error('FAST2SMS_API_KEY environment variable is not set');
      }

      // Use GET method to fetch wallet balance as per Fast2SMS documentation
      const response = await axios.get(
        'https://www.fast2sms.com/dev/wallet',
        {
          params: {
            authorization: process.env.FAST2SMS_API_KEY,
          },
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      // Log the raw response for debugging
      console.log('💰 Fast2SMS API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      // Handle different response formats
      let walletBalance = 0;
      let success = false;

      if (response.status === 200) {
        if (typeof response.data === 'object' && response.data !== null) {
          // JSON response
          if (response.data.return === true && response.data.wallet !== undefined) {
            walletBalance = parseFloat(response.data.wallet) || 0;
            success = true;
          } else if (response.data.message) {
            throw new Error(`Fast2SMS API error: ${response.data.message}`);
          }
        } else if (typeof response.data === 'string') {
          // HTML or text response - Fast2SMS might return HTML for errors
          if (response.data.includes('error') || response.data.includes('Error')) {
            throw new Error('Fast2SMS API returned an error page');
          }
          // If it's a string but not an error, try to parse it
          try {
            const parsedData = JSON.parse(response.data);
            if (parsedData.return === true && parsedData.wallet !== undefined) {
              walletBalance = parseFloat(parsedData.wallet) || 0;
              success = true;
            }
          } catch (parseError) {
            console.warn('Could not parse response as JSON:', parseError.message);
          }
        }
      }

      if (!success) {
        throw new Error('Unable to fetch wallet balance from Fast2SMS API');
      }

      console.log(`💰 Wallet balance fetched successfully: ₹${walletBalance}`);

      await AdminActivity.logActivity({
        adminId: req.admin._id,
        sessionId: req.adminSession._id,
        action: 'WALLET_BALANCE_FETCH',
        description: `Admin ${req.admin.name} fetched wallet balance`,
        resource: 'sms',
        endpoint: '/api/admin/sms/wallet',
        method: 'GET',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          balance: walletBalance,
          provider: 'fast2sms'
        }
      });

      res.json({
        success: true,
        balance: walletBalance,
        currency: 'INR',
        provider: 'fast2sms',
        message: 'Wallet balance fetched successfully'
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ Wallet balance fetch failed:', error.message);

      await AdminActivity.logActivity({
        adminId: req.admin._id,
        sessionId: req.adminSession._id,
        action: 'ERROR',
        description: `Failed to fetch wallet balance: ${error.message}`,
        resource: 'sms',
        endpoint: '/api/admin/sms/wallet',
        method: 'GET',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 500,
        responseTime: responseTime,
        errorMessage: error.message,
        metadata: {
          provider: 'fast2sms'
        }
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch wallet balance',
        details: error.message
      });
    }
  }

  // Get SMS statistics
  static async getSMSStatistics(req, res) {
    const startTime = Date.now();
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    try {
      const { startDate, endDate } = req.query;

      console.log('📊 Fetching SMS statistics', { startDate, endDate });

      const stats = await SMSHistory.getStatistics(startDate, endDate);

      await AdminActivity.logActivity({
        adminId: req.admin._id,
        sessionId: req.adminSession._id,
        action: 'SMS_STATISTICS_FETCH',
        description: `Admin ${req.admin.name} fetched SMS statistics`,
        resource: 'sms',
        endpoint: '/api/admin/sms/statistics',
        method: 'GET',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          totalSMS: stats.totalSMS,
          totalCost: stats.totalCost,
          startDate,
          endDate
        }
      });

      res.json({
        success: true,
        statistics: stats,
        message: 'SMS statistics fetched successfully'
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ SMS statistics fetch failed:', error.message);

      await AdminActivity.logActivity({
        adminId: req.admin._id,
        sessionId: req.adminSession._id,
        action: 'ERROR',
        description: `Failed to fetch SMS statistics: ${error.message}`,
        resource: 'sms',
        endpoint: '/api/admin/sms/statistics',
        method: 'GET',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 500,
        responseTime: responseTime,
        errorMessage: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch SMS statistics',
        details: error.message
      });
    }
  }

  // Get paginated SMS history
  static async getSMSHistory(req, res) {
    const startTime = Date.now();
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    try {
      const {
        page = 1,
        limit = 10,
        mobileNumber,
        status,
        messageType,
        purpose,
        startDate,
        endDate
      } = req.query;

      console.log('📋 Fetching SMS history with filters:', {
        page,
        limit,
        mobileNumber,
        status,
        messageType,
        purpose,
        startDate,
        endDate
      });

      const filters = {
        mobileNumber,
        status,
        messageType,
        purpose,
        startDate,
        endDate
      };

      const result = await SMSHistory.getPaginatedHistory(
        parseInt(page),
        parseInt(limit),
        filters
      );

      await AdminActivity.logActivity({
        adminId: req.admin._id,
        sessionId: req.adminSession._id,
        action: 'SMS_HISTORY_FETCH',
        description: `Admin ${req.admin.name} fetched SMS history`,
        resource: 'sms',
        endpoint: '/api/admin/sms/history',
        method: 'GET',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalRecords: result.pagination.totalCount,
          filters
        }
      });

      res.json({
        success: true,
        data: result.records,
        pagination: result.pagination,
        message: 'SMS history fetched successfully'
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ SMS history fetch failed:', error.message);

      await AdminActivity.logActivity({
        adminId: req.admin._id,
        sessionId: req.adminSession._id,
        action: 'ERROR',
        description: `Failed to fetch SMS history: ${error.message}`,
        resource: 'sms',
        endpoint: '/api/admin/sms/history',
        method: 'GET',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 500,
        responseTime: responseTime,
        errorMessage: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch SMS history',
        details: error.message
      });
    }
  }

  // Get SMS details by ID
  static async getSMSDetails(req, res) {
    const startTime = Date.now();
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    try {
      const { id } = req.params;

      console.log('🔍 Fetching SMS details for ID:', id);

      const smsRecord = await SMSHistory.findById(id);

      if (!smsRecord) {
        return res.status(404).json({
          success: false,
          error: 'SMS record not found'
        });
      }

      await AdminActivity.logActivity({
        adminId: req.admin._id,
        sessionId: req.adminSession._id,
        action: 'SMS_DETAILS_FETCH',
        description: `Admin ${req.admin.name} fetched SMS details for ID: ${id}`,
        resource: 'sms',
        endpoint: `/api/admin/sms/history/${id}`,
        method: 'GET',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          smsId: id,
          mobileNumber: smsRecord.mobileNumber,
          status: smsRecord.status
        }
      });

      res.json({
        success: true,
        data: smsRecord,
        message: 'SMS details fetched successfully'
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ SMS details fetch failed:', error.message);

      await AdminActivity.logActivity({
        adminId: req.admin._id,
        sessionId: req.adminSession._id,
        action: 'ERROR',
        description: `Failed to fetch SMS details: ${error.message}`,
        resource: 'sms',
        endpoint: `/api/admin/sms/history/${req.params.id}`,
        method: 'GET',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 500,
        responseTime: responseTime,
        errorMessage: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch SMS details',
        details: error.message
      });
    }
  }

  // Send test SMS (admin only)
  static async sendTestSMS(req, res) {
    const startTime = Date.now();
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    try {
      const { mobileNumber, message, messageType = 'notification' } = req.body;

      if (!mobileNumber || !message) {
        return res.status(400).json({
          success: false,
          error: 'Mobile number and message are required'
        });
      }

      console.log('📱 Admin sending test SMS:', { mobileNumber, messageType });

      // Import SMSService dynamically to avoid circular dependency
      const { default: SMSService } = await import('../utils/smsService.js');

      let result;
      if (messageType === 'otp') {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        result = await SMSService.sendOTP(mobileNumber, otp, { purpose: 'test' });
      } else {
        result = await SMSService.sendNotification(mobileNumber, message, { purpose: 'test' });
      }

      await AdminActivity.logActivity({
        adminId: req.admin._id,
        sessionId: req.adminSession._id,
        action: 'TEST_SMS_SEND',
        description: `Admin ${req.admin.name} sent test SMS to ${mobileNumber}`,
        resource: 'sms',
        endpoint: '/api/admin/sms/test',
        method: 'POST',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          mobileNumber,
          messageType,
          success: result.success,
          requestId: result.requestId
        }
      });

      res.json({
        success: true,
        result,
        message: 'Test SMS sent successfully'
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ Test SMS send failed:', error.message);

      await AdminActivity.logActivity({
        adminId: req.admin._id,
        sessionId: req.adminSession._id,
        action: 'ERROR',
        description: `Failed to send test SMS: ${error.message}`,
        resource: 'sms',
        endpoint: '/api/admin/sms/test',
        method: 'POST',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 500,
        responseTime: responseTime,
        errorMessage: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to send test SMS',
        details: error.message
      });
    }
  }
}

export default SMSAdminController;

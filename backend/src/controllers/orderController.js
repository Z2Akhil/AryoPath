import Order from '../models/Order.js';
import AdminSession from '../models/AdminSession.js';
import axios from 'axios';

class OrderController {
  
  // Create a new order
  static async createOrder(req, res) {
    try {
      const {
        packageId,
        packageName,
        packagePrice,
        originalPrice,
        discountPercentage,
        beneficiaries,
        contactInfo,
        appointment,
        selectedSlot
      } = req.body;

      // Validate required fields
      if (!packageId || !packageName || !packagePrice || !beneficiaries || !contactInfo || !appointment) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Get active admin session for API key
      const activeSession = await AdminSession.findOne({ isActive: true })
        .populate('adminId');
      
      if (!activeSession) {
        return res.status(500).json({
          success: false,
          message: 'No active admin session found'
        });
      }

      // Generate order ID
      const orderId = Order.generateOrderId();

      // Create order in our database first
      const order = new Order({
        orderId,
        userId: req.user._id,
        adminId: activeSession.adminId._id,
        package: {
          code: packageId,
          name: packageName,
          price: packagePrice,
          originalPrice: originalPrice,
          discountPercentage: discountPercentage
        },
        beneficiaries: beneficiaries.map(b => ({
          name: b.name,
          age: parseInt(b.age),
          gender: b.gender
        })),
        contactInfo: {
          email: contactInfo.email,
          mobile: contactInfo.mobile,
          address: {
            street: contactInfo.address.street,
            city: contactInfo.address.city,
            state: contactInfo.address.state,
            pincode: contactInfo.address.pincode,
            landmark: contactInfo.address.landmark || ''
          }
        },
        appointment: {
          date: appointment.date,
          slot: selectedSlot,
          slotId: appointment.slotId
        },
        payment: {
          amount: packagePrice,
          type: 'POSTPAID'
        },
        source: 'AryoPath'
      });
     console.log(order);
     
      await order.save();

      // Now create order in Thyrocare system
      try {
        const thyrocareResponse = await OrderController.createThyrocareOrder(order, activeSession);
        
        // Update order with Thyrocare response
        order.thyrocare.orderNo = thyrocareResponse.order_no;
        order.thyrocare.response = thyrocareResponse;
        
        // Update beneficiary lead IDs if available
        if (thyrocareResponse.ben_data && thyrocareResponse.ben_data.length > 0) {
          thyrocareResponse.ben_data.forEach((benData, index) => {
            if (order.beneficiaries[index]) {
              order.beneficiaries[index].leadId = benData.lead_id;
            }
          });
        }
        
        order.status = 'CREATED';
        await order.save();

        return res.status(201).json({
          success: true,
          message: 'Order created successfully',
          data: {
            orderId: order.orderId,
            thyrocareOrderNo: order.thyrocare.orderNo,
            order: order
          }
        });

      } catch (thyrocareError) {
        // Thyrocare order creation failed, but we still have our order record
        order.thyrocare.error = thyrocareError.message;
        order.status = 'FAILED';
        await order.save();

        return res.status(500).json({
          success: false,
          message: 'Order created in our system but failed in Thyrocare',
          data: {
            orderId: order.orderId,
            error: thyrocareError.message
          }
        });
      }

    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error.message
      });
    }
  }

  // Create order in Thyrocare system
  static async createThyrocareOrder(order, adminSession) {
    try {
      const payload = {
        api_key: adminSession.thyrocareApiKey,
        ref_order_id: order.orderId,
        email: order.contactInfo.email,
        mobile: order.contactInfo.mobile,
        address: `${order.contactInfo.address.street}, ${order.contactInfo.address.city}, ${order.contactInfo.address.state}`,
        appt_date: `${order.appointment.date} ${order.appointment.slot.split(' - ')[0]}`,
        order_by: order.beneficiaries[0]?.name || 'Customer',
        passon: 0,
        pay_type: 'POSTPAID',
        pincode: order.contactInfo.address.pincode,
        products: order.package.code,
        ref_code: adminSession.adminId.mobile,
        reports: 'Y',
        service_type: 'HOME',
        ben_data: order.beneficiaries.map(beneficiary => ({
          name: beneficiary.name,
          age: beneficiary.age,
          gender: beneficiary.gender === 'Male' ? 'M' : beneficiary.gender === 'Female' ? 'F' : 'O'
        })),
        coupon: '',
        order_mode: 'DSA-BOOKING-API',
        collection_type: 'Home Collection',
        source: 'AryoPath',
        phlebo_notes: ''
      };

      console.log('Creating Thyrocare order with payload:', {
        orderId: order.orderId,
        package: order.package.code,
        beneficiaries: order.beneficiaries.length
      });
      console.log(payload);
      
      const response = await axios.post(
        'https://dx-dsa-service.thyrocare.com/api/booking-master/v2/create-order',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.response_status === 1) {
        console.log('Thyrocare order created successfully:', {
          orderId: order.orderId,
          thyrocareOrderNo: response.data.order_no
        });
        return response.data;
      } else {
        throw new Error(response.data.response || 'Thyrocare order creation failed');
      }

    } catch (error) {
      console.error('Thyrocare order creation failed:', {
        orderId: order.orderId,
        error: error.response?.data || error.message
      });
      throw new Error(error.response?.data?.response || error.message || 'Thyrocare API error');
    }
  }

  // Get user orders
  static async getUserOrders(req, res) {
    try {
      const orders = await Order.findByUser(req.user._id);
      
      return res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  }

  // Get order by ID
  static async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      
      const order = await Order.findOne({ orderId })
        .populate('userId adminId');
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if user has permission to view this order
      if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      return res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: error.message
      });
    }
  }

  // Retry failed order
  static async retryOrder(req, res) {
    try {
      const { orderId } = req.params;
      
      const order = await Order.findOne({ orderId })
        .populate('adminId');
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check permissions
      if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get active admin session
      const activeSession = await AdminSession.findOne({ isActive: true })
        .populate('adminId');
      
      if (!activeSession) {
        return res.status(500).json({
          success: false,
          message: 'No active admin session found'
        });
      }

      // Retry Thyrocare order creation
      try {
        const thyrocareResponse = await OrderController.createThyrocareOrder(order, activeSession);
        
        order.thyrocare.orderNo = thyrocareResponse.order_no;
        order.thyrocare.response = thyrocareResponse;
        order.thyrocare.error = null;
        order.thyrocare.retryCount += 1;
        order.thyrocare.lastRetryAt = new Date();
        order.status = 'CREATED';
        
        await order.save();

        return res.json({
          success: true,
          message: 'Order retried successfully',
          data: {
            orderId: order.orderId,
            thyrocareOrderNo: order.thyrocare.orderNo
          }
        });

      } catch (thyrocareError) {
        order.thyrocare.error = thyrocareError.message;
        order.thyrocare.retryCount += 1;
        order.thyrocare.lastRetryAt = new Date();
        await order.save();

        return res.status(500).json({
          success: false,
          message: 'Order retry failed',
          error: thyrocareError.message
        });
      }

    } catch (error) {
      console.error('Error retrying order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retry order',
        error: error.message
      });
    }
  }
}

export default OrderController;

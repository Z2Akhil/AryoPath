import { axiosInstance } from './axiosInstance';
import { MedicineOrder, ShippingAddress, CourierEvent } from '@/types/medicineOrder';

interface OrderItem {
  slug: string;
  name: string;
  mrp: number;
  offerPrice: number;
  quantity: number;
}

const medicineOrderApi = {
  createRazorpayOrder: async (amount: number, receipt?: string) => {
    const res = await axiosInstance.post('/payment/razorpay/create', { amount, currency: 'INR', receipt });
    return res.data as { success: boolean; data: { orderId: string; amount: number; currency: string; keyId: string } };
  },

  verifyPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    medicineOrderId: string;
  }) => {
    const res = await axiosInstance.post('/payment/razorpay/verify', payload);
    return res.data as { success: boolean; data: { orderId: string; status: string } };
  },

  createOrder: async (payload: {
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    grandTotal: number;
    prescriptions?: { url: string; publicId: string }[];
  }) => {
    const res = await axiosInstance.post('/orders/medicine', payload);
    return res.data as { success: boolean; data: { _id: string; orderId: string } };
  },

  getByOrderId: async (orderId: string) => {
    const res = await axiosInstance.get(`/orders/medicine/${orderId}`);
    return res.data as { success: boolean; data: MedicineOrder };
  },

  getUserOrders: async (page = 1, limit = 10) => {
    const res = await axiosInstance.get('/orders/medicine', { params: { page, limit } });
    return res.data as {
      success: boolean;
      data: MedicineOrder[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  },

  addPrescription: async (orderId: string, prescriptions: { url: string; publicId: string }[]) => {
    const res = await axiosInstance.post(`/orders/medicine/${orderId}/prescription`, { prescriptions });
    return res.data as { success: boolean; message: string; data?: { prescriptions: any[] } };
  },

  getTracking: async (orderId: string) => {
    const res = await axiosInstance.get(`/orders/medicine/${orderId}/tracking`);
    return res.data as {
      success: boolean;
      data: {
        courierStatus: string;
        courierStatusHistory: CourierEvent[];
        courierStatusUpdatedAt: string | null;
        trackingUrl: string;
      };
    };
  },

  uploadPrescription: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post('/user/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data as { success: boolean; data: { url: string; publicId: string } };
  },
};

export default medicineOrderApi;

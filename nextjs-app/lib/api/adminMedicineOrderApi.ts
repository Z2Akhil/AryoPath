import { adminAxios } from './adminAxios';
import type { MedicineOrder, MedicineOrderStatus } from '@/types/medicineOrder';

export interface AdminMedicineOrdersResponse {
  success: boolean;
  orders: (MedicineOrder & { userId: { firstName: string; lastName: string; mobileNumber: string; email?: string } })[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  statusCounts: Record<string, number>;
}

const adminMedicineOrderApi = {
  getOrders: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AdminMedicineOrdersResponse> => {
    const res = await adminAxios.get('/admin/orders/medicine', { params });
    return res.data;
  },

  updateOrder: async (orderId: string, data: {
    status?: MedicineOrderStatus;
    notes?: string;
    cancellationReason?: string;
    awb?: string;
  }): Promise<{ success: boolean; order: MedicineOrder }> => {
    const res = await adminAxios.patch(`/admin/orders/medicine/${orderId}`, data);
    return res.data;
  },

  returnAction: async (orderId: string, action: 'approve' | 'reject' | 'received' | 'mark_refunded', adminNotes?: string): Promise<{ success: boolean; order: MedicineOrder }> => {
    const res = await adminAxios.post(`/admin/orders/medicine/${orderId}/return-action`, { action, adminNotes });
    return res.data;
  },
};

export default adminMedicineOrderApi;

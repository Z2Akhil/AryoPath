import { adminAxios } from './adminAxios';

export interface PrescriptionFile {
  url: string;
  publicId: string;
  uploadedAt: string;
}

export interface AdminPrescription {
  _id: string;
  userId: { _id: string; firstName: string; lastName: string; mobileNumber: string; email?: string } | null;
  files: PrescriptionFile[];
  contactMobile: string;
  contactEmail?: string;
  note?: string;
  status: 'pending' | 'done';
  handledAt?: string;
  createdOrderIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminPrescriptionsResponse {
  success: boolean;
  prescriptions: AdminPrescription[];
  pendingCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

const adminPrescriptionApi = {
  list: async (params: { page?: number; limit?: number; status?: 'pending' | 'done' } = {}): Promise<AdminPrescriptionsResponse> => {
    const res = await adminAxios.get('/admin/prescriptions', { params });
    return res.data;
  },

  get: async (id: string): Promise<{ success: boolean; prescription: AdminPrescription }> => {
    const res = await adminAxios.get(`/admin/prescriptions/${id}`);
    return res.data;
  },

  update: async (
    id: string,
    action: 'mark_done' | 'reopen' | 'attach_order',
    orderId?: string,
  ): Promise<{ success: boolean; prescription: AdminPrescription }> => {
    const res = await adminAxios.patch(`/admin/prescriptions/${id}`, { action, orderId });
    return res.data;
  },
};

export default adminPrescriptionApi;

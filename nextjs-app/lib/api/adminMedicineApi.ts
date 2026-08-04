import { adminAxios } from './adminAxios';
import { Medicine, MedicineFormValues, MedicineImage } from '@/types/medicine';

export interface CreateMedicinePayload extends MedicineFormValues {
  images: MedicineImage[];
  thumbnail: MedicineImage | null;
  discountPercentage: number;
}

export interface MedicineListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  madeBy?: string;
  isPublished?: boolean | '';
  inStock?: boolean | '';
  lowStock?: boolean | '';
}

export interface MedicineListResponse {
  data: Medicine[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const adminMedicineApi = {
  list: async (params: MedicineListParams = {}): Promise<MedicineListResponse> => {
    const res = await adminAxios.get('/admin/medicines', { params });
    return res.data;
  },

  // Distinct company names, for the Company filter dropdown.
  brands: async (): Promise<string[]> => {
    const res = await adminAxios.get('/admin/medicines/brands');
    return res.data?.data ?? [];
  },

  getById: async (id: string): Promise<{ data: Medicine }> => {
    const res = await adminAxios.get(`/admin/medicines/${id}`);
    return res.data;
  },

  create: async (payload: CreateMedicinePayload): Promise<{ data: Medicine }> => {
    const res = await adminAxios.post('/admin/medicines', payload);
    return res.data;
  },

  update: async (id: string, payload: Partial<CreateMedicinePayload>): Promise<{ data: Medicine }> => {
    const res = await adminAxios.put(`/admin/medicines/${id}`, payload);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await adminAxios.delete(`/admin/medicines/${id}`);
  },

  togglePublish: async (id: string, isPublished: boolean): Promise<{ data: Medicine }> => {
    const res = await adminAxios.put(`/admin/medicines/${id}`, { isPublished, isDraft: !isPublished });
    return res.data;
  },
};

export default adminMedicineApi;

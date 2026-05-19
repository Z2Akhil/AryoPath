import { adminAxios } from './adminAxios';
import { Doctor, DoctorFormValues, DoctorImage } from '@/types/doctor';

export interface CreateDoctorPayload extends DoctorFormValues {
  profilePhoto: DoctorImage | null;
}

export interface DoctorListParams {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
  isPublished?: boolean | '';
}

export interface DoctorListResponse {
  data: Doctor[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const adminDoctorApi = {
  list: async (params: DoctorListParams = {}): Promise<DoctorListResponse> => {
    const res = await adminAxios.get('/admin/doctors', { params });
    return res.data;
  },

  getById: async (id: string): Promise<{ data: Doctor }> => {
    const res = await adminAxios.get(`/admin/doctors/${id}`);
    return res.data;
  },

  create: async (payload: CreateDoctorPayload): Promise<{ data: Doctor }> => {
    const res = await adminAxios.post('/admin/doctors', payload);
    return res.data;
  },

  update: async (id: string, payload: Partial<CreateDoctorPayload>): Promise<{ data: Doctor }> => {
    const res = await adminAxios.put(`/admin/doctors/${id}`, payload);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await adminAxios.delete(`/admin/doctors/${id}`);
  },

  togglePublish: async (id: string, isPublished: boolean): Promise<{ data: Doctor }> => {
    const res = await adminAxios.put(`/admin/doctors/${id}`, {
      isPublished,
      isDraft: !isPublished,
    });
    return res.data;
  },
};

export default adminDoctorApi;

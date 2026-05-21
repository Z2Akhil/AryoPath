import { adminAxios } from './adminAxios';
import { CreateStaffPayload, StaffProfile, UpdateStaffPayload } from '@/types/staff';

export const adminStaffApi = {
    list: async (params?: { page?: number; limit?: number }) => {
        const { data } = await adminAxios.get('/admin/staff', { params });
        return data as { success: boolean; staff: StaffProfile[]; total: number; page: number; limit: number };
    },

    create: async (payload: CreateStaffPayload) => {
        const { data } = await adminAxios.post('/admin/staff', payload);
        return data as { success: boolean; staff: StaffProfile };
    },

    getById: async (id: string) => {
        const { data } = await adminAxios.get(`/admin/staff/${id}`);
        return data as { success: boolean; staff: StaffProfile };
    },

    update: async (id: string, payload: UpdateStaffPayload) => {
        const { data } = await adminAxios.patch(`/admin/staff/${id}`, payload);
        return data as { success: boolean; staff: StaffProfile };
    },

    resetPassword: async (id: string, password: string) => {
        const { data } = await adminAxios.patch(`/admin/staff/${id}`, { password });
        return data as { success: boolean };
    },

    delete: async (id: string) => {
        const { data } = await adminAxios.delete(`/admin/staff/${id}`);
        return data as { success: boolean; message: string };
    },
};

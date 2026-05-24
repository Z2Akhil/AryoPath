import { adminAxios } from './adminAxios';

export interface AppointmentListParams {
    page?: number;
    limit?: number;
    status?: string;
    doctorId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}

const adminAppointmentApi = {
    list: async (params: AppointmentListParams = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') query.set(k, String(v)); });
        const res = await adminAxios.get(`/admin/appointments?${query.toString()}`);
        return res.data;
    },

    getById: async (id: string) => {
        const res = await adminAxios.get(`/admin/appointments/${id}`);
        return res.data;
    },

    updateStatus: async (id: string, status: 'confirmed' | 'completed' | 'cancelled') => {
        const res = await adminAxios.patch(`/admin/appointments/${id}`, { status });
        return res.data;
    },

    getStats: async () => {
        const res = await adminAxios.get('/admin/appointments/stats');
        return res.data;
    },
};

export default adminAppointmentApi;

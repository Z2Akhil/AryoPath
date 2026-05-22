import { doctorAxios } from './doctorAxios';
import { DoctorPortalAppointment } from '@/types/doctor';

export const doctorApi = {
    getProfile: async () => {
        const { data } = await doctorAxios.get('/doctor/profile');
        return data;
    },

    getAppointments: async (params?: { page?: number; limit?: number; status?: string; date?: string }) => {
        const { data } = await doctorAxios.get('/doctor/appointments', { params });
        return data as { success: boolean; appointments: DoctorPortalAppointment[]; total: number; page: number; limit: number };
    },

    getAppointment: async (id: string) => {
        const { data } = await doctorAxios.get(`/doctor/appointments/${id}`);
        return data as { success: boolean; appointment: DoctorPortalAppointment };
    },

    updateAppointmentStatus: async (id: string, status: string) => {
        const { data } = await doctorAxios.patch(`/doctor/appointments/${id}`, { status });
        return data as { success: boolean; appointment: DoctorPortalAppointment };
    },

    savePrescription: async (id: string, prescription: { medicines: any[]; notes: string }) => {
        const { data } = await doctorAxios.patch(`/doctor/appointments/${id}`, { prescription });
        return data as { success: boolean; appointment: DoctorPortalAppointment };
    },
};

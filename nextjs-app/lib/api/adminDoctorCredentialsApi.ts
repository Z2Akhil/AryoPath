import { adminAxios } from './adminAxios';

export const adminDoctorCredentialsApi = {
    setCredentials: async (doctorId: string, payload: { username: string; password: string }) => {
        const { data } = await adminAxios.post(`/admin/doctors/${doctorId}/credentials`, payload);
        return data as { success: boolean; message: string; loginUsername: string };
    },

    removeCredentials: async (doctorId: string) => {
        const { data } = await adminAxios.delete(`/admin/doctors/${doctorId}/credentials`);
        return data as { success: boolean; message: string };
    },
};

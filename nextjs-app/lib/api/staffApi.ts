import { staffAxios } from './staffAxios';
import { StaffProfile } from '@/types/staff';

export const staffApi = {
    getProfile: async () => {
        const { data } = await staffAxios.get('/staff/profile');
        return data as { success: boolean; staff: StaffProfile };
    },
};

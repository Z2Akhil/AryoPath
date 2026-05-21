import { Permission } from '@/lib/constants/permissions';

export interface StaffProfile {
  _id: string;
  username: string;
  name: string;
  email: string;
  mobile: string;
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffAuthData {
  token: string;
  expiresAt: number;
  staff: StaffProfile;
}

export interface StaffLoginResponse {
  success: boolean;
  token?: string;
  staff?: StaffProfile;
  error?: string;
}

export interface CreateStaffPayload {
  username: string;
  password: string;
  name: string;
  email: string;
  mobile: string;
  permissions: Permission[];
}

export interface UpdateStaffPayload {
  name?: string;
  email?: string;
  mobile?: string;
  permissions?: Permission[];
  isActive?: boolean;
  password?: string;
}

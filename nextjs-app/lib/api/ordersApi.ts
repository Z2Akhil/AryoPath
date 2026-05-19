import { axiosInstance } from "./axiosInstance";

export interface OrderPackage {
    name: string;
    price: number;
}

export interface OrderAppointment {
    date: string;
    time?: string;
    slot?: string;
}

export interface OrderContactInfo {
    name?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
}

export interface OrderReport {
    beneficiaryName: string;
    reportUrl?: string;
}

export interface OrderThyrocare {
    status?: string;
    orderNo?: string;
    referenceId?: string;
    lastSyncedAt?: string;
}

export interface OrderPayment {
    amount: number;
    type: string;
    status: string;
}

export interface Order {
    orderId: string;
    status: string;
    package: OrderPackage;
    appointment?: OrderAppointment;
    contactInfo?: OrderContactInfo;
    thyrocare?: OrderThyrocare;
    reports?: OrderReport[];
    reportsHardcopy?: 'Y' | 'N';
    beneficiaries?: any[];
    payment?: OrderPayment;
    createdAt?: string;
    updatedAt?: string;
}

export const fetchUserOrders = async (): Promise<Order[]> => {
    try {
        const response = await axiosInstance.get("/orders/user");

        if (response.data?.success) {
            return response.data.data;
        } else {
            console.warn("Unexpected API response:", response.data);
            return [];
        }
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return [];
    }
};

export const downloadReport = async (orderId: string, beneficiaryIndex: number = 0) => {
    const response = await axiosInstance.get(`/orders/${orderId}/reports/download`, {
        params: { beneficiaryIndex }
    });
    return response.data;
};

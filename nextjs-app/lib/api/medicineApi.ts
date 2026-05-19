import { axiosInstance } from './axiosInstance';
import { Medicine } from '@/types/medicine';

export interface MedicineListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: string;
  rxOnly?: boolean | '';
  inStock?: boolean;
  hasDiscount?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface MedicineListResponse {
  success: boolean;
  data: Medicine[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const medicineApi = {
  list: async (params: MedicineListParams = {}): Promise<MedicineListResponse> => {
    const query: Record<string, any> = {};
    if (params.page)       query.page       = params.page;
    if (params.limit)      query.limit      = params.limit;
    if (params.search)     query.search     = params.search;
    if (params.category)   query.category   = params.category;
    if (params.type)       query.type       = params.type;
    if (params.rxOnly !== undefined && params.rxOnly !== '') query.rxOnly = params.rxOnly;
    if (params.inStock)    query.inStock    = true;
    if (params.hasDiscount) query.hasDiscount = true;
    if (params.minPrice)   query.minPrice   = params.minPrice;
    if (params.maxPrice)   query.maxPrice   = params.maxPrice;

    const res = await axiosInstance.get('/medicines', { params: query });
    return res.data;
  },

  getBySlug: async (slug: string): Promise<{ success: boolean; data: Medicine; related: Medicine[] }> => {
    const res = await axiosInstance.get(`/medicines/${slug}`);
    return res.data;
  },

  suggestions: async (query: string): Promise<Medicine[]> => {
    if (query.trim().length < 2) return [];
    const res = await axiosInstance.get('/medicines', {
      params: { search: query, limit: 6, page: 1 },
    });
    return res.data?.data ?? [];
  },
};

export default medicineApi;

import { adminAxios } from './adminAxios';

export const adminProductApi = {
    /**
     * Fetch products from database without syncing
     * @param productType 'OFFER' | 'TEST' | 'PROFILE' | 'ALL'
     */
    fetchProducts: async (productType: string) => {
        try {
            const response = await adminAxios.get(`/admin/products?type=${productType}`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching products:', error);
            throw error.response?.data || { success: false, error: 'Failed to fetch products' };
        }
    },

    /**
     * Fetch products and sync with Thyrocare
     * @param productType 'OFFER' | 'TEST' | 'PROFILE' | 'ALL'
     */
    syncProducts: async (productType: string) => {
        try {
            const response = await adminAxios.post('/admin/products', { productType });
            return response.data;
        } catch (error: any) {
            console.error('Error syncing products:', error);
            throw error.response?.data || { success: false, error: 'Failed to sync products' };
        }
    },

    /**
     * Update product custom pricing
     * @param code Product code
     * @param discount Custom discount amount
     */
    updatePricing: async (code: string, discount: number) => {
        try {
            const response = await adminAxios.put('/admin/products/pricing', { code, discount });
            return response.data;
        } catch (error: any) {
            console.error('Error updating pricing:', error);
            throw error.response?.data || { success: false, error: 'Failed to update pricing' };
        }
    },

    /**
     * Activate a product
     * @param code Product code
     */
    activateProduct: async (code: string) => {
        try {
            const response = await adminAxios.put(`/admin/products/${code}/activate`);
            return response.data;
        } catch (error: any) {
            console.error('Error activating product:', error);
            throw error.response?.data || { success: false, error: 'Failed to activate product' };
        }
    },

    /**
     * Deactivate a product
     * @param code Product code
     */
    deactivateProduct: async (code: string) => {
        try {
            const response = await adminAxios.put(`/admin/products/${code}/deactivate`);
            return response.data;
        } catch (error: any) {
            console.error('Error deactivating product:', error);
            throw error.response?.data || { success: false, error: 'Failed to deactivate product' };
        }
    },

    /**
     * Upload or replace custom image for a package (PROFILE type only)
     * @param code Product code
     * @param file Image file
     */
    uploadPackageImage: async (code: string, file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const response = await adminAxios.patch(`/admin/products/${code}/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { success: false, error: 'Image upload failed' };
        }
    },

    /**
     * Remove custom image for a package
     * @param code Product code
     */
    removePackageImage: async (code: string) => {
        try {
            const response = await adminAxios.delete(`/admin/products/${code}/image`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { success: false, error: 'Image removal failed' };
        }
    },
};

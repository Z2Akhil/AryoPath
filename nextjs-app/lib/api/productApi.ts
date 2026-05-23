import { Product } from "@/types";

export interface GetProductsResponse {
    products: Product[];
    totalCount: number;
    hasMore: boolean;
}

// Helper to get correct base URL depending on client/server context
const getBaseUrl = () => {
    if (typeof window !== 'undefined') return '';
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

export const getProductsFromBackend = async (productType: string, options: { limit?: number; skip?: number; search?: string } = {}): Promise<GetProductsResponse> => {
    try {
        const { limit, skip, search } = options;
        let url = `${getBaseUrl()}/api/products?type=${productType}`;

        if (limit) url += `&limit=${limit}`;
        if (skip)  url += `&skip=${skip}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            return {
                products: data.products || [],
                totalCount: data.totalCount || 0,
                hasMore: data.hasMore || false
            };
        } else {
            console.warn("⚠️ Unexpected API response:", data);
            return { products: [], totalCount: 0, hasMore: false };
        }
    } catch (error) {
        console.error("Error fetching products from backend:", error);
        return { products: [], totalCount: 0, hasMore: false };
    }
};

export interface HomePageData {
    offers: Product[];
    profiles: Product[];
    tests: Product[];
}

export const getHomePageData = async (): Promise<HomePageData | null> => {
    try {
        const response = await fetch(`${getBaseUrl()}/api/homepage`);
        const data = await response.json();
        
        if (data.success) {
            return {
                offers: data.offers || [],
                profiles: data.profiles || [],
                tests: data.tests || []
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching homepage data:", error);
        return null;
    }
};

export const getProductByCode = async (code: string): Promise<Product | null> => {
    try {
        const response = await fetch(`${getBaseUrl()}/api/products/${code}`);
        const data = await response.json();

        if (data.success) {
            return data.product || null;
        } else {
            console.warn("⚠️ Product not found:", data);
            return null;
        }
    } catch (error) {
        console.error("Error fetching product by code:", error);
        return null;
    }
};

export const getProductDisplayPrice = (product: Product) => {
    if (!product) {
        return { displayPrice: 0, originalPrice: 0, hasDiscount: false, discountPercentage: 0, discountAmount: 0 };
    }

    let thyrocarePrice = 0;
    if (product.type === 'OFFER') {
        thyrocarePrice = product.rate?.offerRate || 0;
    } else {
        thyrocarePrice = product.rate?.b2C || 0;
    }

    const sellingPrice = product.sellingPrice || thyrocarePrice;
    const discountAmount = thyrocarePrice - sellingPrice;
    const hasDiscount = sellingPrice < thyrocarePrice && thyrocarePrice > 0;
    const discountPercentage = hasDiscount
        ? Math.round(((thyrocarePrice - sellingPrice) / thyrocarePrice) * 100)
        : 0;

    return {
        displayPrice: sellingPrice,
        originalPrice: thyrocarePrice,
        hasDiscount,
        discountPercentage,
        discountAmount,
    };
};
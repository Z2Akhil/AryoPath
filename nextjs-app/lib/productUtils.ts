// Get the display price for a product
export const getProductDisplayPrice = (product: any) => {
  if (!product) {
    return { displayPrice: 0, originalPrice: 0, hasDiscount: false, discountPercentage: 0 };
  }

  // Use sellingPrice if available and lower than ThyroCare price
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

export const getImageUrl = (product: any) => {
  if (!product) return "/packagePic.webp";

  // Priority: custom uploaded image → Thyrocare image → fallback
  if (product.customImage?.url) return product.customImage.url;

  // Get raw path from various possible fields
  let rawPath = product.imageLocation || product.thyrocareData?.imageLocation ||
    product.imageMaster?.[0]?.imgLocations ||
    product.thyrocareData?.imageMaster?.[0]?.imgLocations;



  if (!rawPath) return "/packagePic.webp";

  // Handle string paths
  if (typeof rawPath !== 'string') return "/packagePic.webp";

  // If it's a Thyrocare URL
  if (rawPath.includes("thyrocare.com")) {
    // Force HTTPS for mixed content issues and encode spaces
    let secureUrl = rawPath.replace(/^http:\/\//, "https://");
    return encodeURI(secureUrl);
  }

  // If it's already a full URL
  if (rawPath.startsWith("http")) {
    return encodeURI(rawPath);
  }

  // If it's a root-relative path that exists in public
  if (rawPath.startsWith("/") && !rawPath.startsWith("/uploads")) {
    return rawPath;
  }

  // Remove leading slash for safe concatenation
  const cleanPath = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;

  // Use relative path so the browser uses the correct domain in production
  // We don't want to use NEXT_PUBLIC_API_URL if it is hardcoded to localhost
  const apiBase = typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_API_URL || '');
  
  if (!apiBase) {
    return `/${cleanPath}`;
  }

  return `${apiBase}/${cleanPath}`;
};



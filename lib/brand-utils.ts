const BRANDS_CACHE_KEY = 'windor_brands_cache';
const CACHE_EXPIRY_KEY = 'windor_brands_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; 
const BRANDS_FETCH_STATUS_KEY = 'windor_brands_fetch_status';

export function getBrandsFromCache(category?: string): { id: string; name: string }[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = category ? `${BRANDS_CACHE_KEY}_${category.toUpperCase()}` : BRANDS_CACHE_KEY;
    const cached = localStorage.getItem(key);
    const expiry = localStorage.getItem(category ? `${CACHE_EXPIRY_KEY}_${category.toUpperCase()}` : CACHE_EXPIRY_KEY);

    if (cached && expiry && Date.now() < parseInt(expiry)) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Failed to read brands from cache:', error);
  }

  return null;
}

export function setBrandsCache(brands: { id: string; name: string }[], category?: string): void {
  if (typeof window === 'undefined') return;

  try {
    const key = category ? `${BRANDS_CACHE_KEY}_${category.toUpperCase()}` : BRANDS_CACHE_KEY;
    localStorage.setItem(key, JSON.stringify(brands));
    localStorage.setItem(category ? `${CACHE_EXPIRY_KEY}_${category.toUpperCase()}` : CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    localStorage.setItem(category ? `${BRANDS_FETCH_STATUS_KEY}_${category.toUpperCase()}` : BRANDS_FETCH_STATUS_KEY, 'success');
  } catch (error) {
    console.warn('Failed to cache brands:', error);
  }
}

export function getOfflineBrands(category?: string): { id: string; name: string }[] {
  const cached = getBrandsFromCache(category);
  if (cached && cached.length > 0) {
    return cached;
  }

  const statusKey = category ? `${BRANDS_FETCH_STATUS_KEY}_${category.toUpperCase()}` : BRANDS_FETCH_STATUS_KEY;
  const fetchStatus = localStorage.getItem(statusKey);
  if (fetchStatus !== 'success') {
    console.warn(`API brands ${category ? `for ${category} ` : ''}not available offline`);
    return [];
  }

  console.warn(`Brand cache ${category ? `for ${category} ` : ''}expired - need to refetch from API`);
  return [];
}

export async function fetchAndCacheBrands(category?: string): Promise<{ id: string; name: string }[]> {
  if (typeof window === 'undefined') return [];

  try {
    const { getBrands } = await import('@/lib/actions');
    const response = await getBrands(0, 0, category);

    const brands = response?.data || response;

    if (brands && Array.isArray(brands)) {
      setBrandsCache(brands, category);
      return brands;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(`Failed to fetch brands ${category ? `for ${category} ` : ''}from API:`, error);

    const statusKey = category ? `${BRANDS_FETCH_STATUS_KEY}_${category.toUpperCase()}` : BRANDS_FETCH_STATUS_KEY;
    localStorage.setItem(statusKey, 'failed');

    const cached = getBrandsFromCache(category);
    return cached || [];
  }
}

export async function initBrandCache(): Promise<void> {
  if (typeof window === 'undefined') return;

  const cached = getBrandsFromCache();
  if (cached && cached.length > 0) {
    return;
  }

  if (navigator.onLine) {
    await fetchAndCacheBrands();
  }
}

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

export interface SubBrand {
  id: string;
  name: string;
}

export interface BrandItem {
  id: string;
  name: string;
  category?: string;
  description?: string | null;
  sub_brands?: SubBrand[] | null;
  created_at?: string;
  updated_at?: string;
}

export function parseBrandValue(brandValue?: string | null): {
  brand_id: string | null;
  other_brand: string | null;
} {
  if (!brandValue || typeof brandValue !== "string") {
    return { brand_id: null, other_brand: null };
  }

  if (brandValue.startsWith("__custom__:")) {
    return {
      brand_id: null,
      other_brand: brandValue.slice("__custom__:".length),
    };
  }

  if (brandValue.startsWith("__subbrand__:")) {
    const parts = brandValue.split(":");
    const brandId = parts[1] || null;
    return {
      brand_id: brandId,
      other_brand: null,
    };
  }

  return {
    brand_id: brandValue,
    other_brand: null,
  };
}

export function transformBrandsToOptions(brands: BrandItem[]): {
  id: string;
  name: string;
  disabled?: boolean;
  isHeader?: boolean;
  isSubBrand?: boolean;
  parentName?: string;
}[] {
  const options: {
    id: string;
    name: string;
    disabled?: boolean;
    isHeader?: boolean;
    isSubBrand?: boolean;
    parentName?: string;
  }[] = [];

  if (!Array.isArray(brands)) return options;

  const seenKeys = new Set<string>();

  brands.forEach((brand) => {
    if (!brand || !brand.name) return;

    const hasSubBrands = Array.isArray(brand.sub_brands) && brand.sub_brands.length > 0;

    if (!hasSubBrands) {
      const brandKey = `brand:${brand.id}`;
      if (!seenKeys.has(brandKey)) {
        seenKeys.add(brandKey);
        options.push({
          id: brand.id,
          name: brand.name,
        });
      }
    } else {
      const headerKey = `header:${brand.id}`;
      if (!seenKeys.has(headerKey)) {
        seenKeys.add(headerKey);
        options.push({
          id: `__header__:${brand.id}`,
          name: brand.name,
          disabled: true,
          isHeader: true,
        });
      }

      brand.sub_brands!.forEach((sub: any) => {
        const subName = typeof sub === "string" ? sub : sub?.name || "";
        const subBrandId = typeof sub === "object" && sub?.id ? sub.id : brand.id;
        if (subName) {
          const subKey = `sub:${brand.id}:${subName}`;
          if (!seenKeys.has(subKey)) {
            seenKeys.add(subKey);
            options.push({
              id: `__subbrand__:${subBrandId}:${subName}`,
              name: subName,
              isSubBrand: true,
              parentName: brand.name,
            });
          }
        }
      });
    }
  });

  return options;
}
// Note: Fallback brands removed as only backend-created brands work during posting.

const BRANDS_CACHE_KEY = 'windor_brands_cache';
const CACHE_EXPIRY_KEY = 'windor_brands_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
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

  // Only use fallback brands if we never successfully fetched from API
  const statusKey = category ? `${BRANDS_FETCH_STATUS_KEY}_${category.toUpperCase()}` : BRANDS_FETCH_STATUS_KEY;
  const fetchStatus = localStorage.getItem(statusKey);
  if (fetchStatus !== 'success') {
    console.warn(`API brands ${category ? `for ${category} ` : ''}not available offline`);
    return [];
  }

  // If we previously had success but cache expired, return empty to force refetch
  console.warn(`Brand cache ${category ? `for ${category} ` : ''}expired - need to refetch from API`);
  return [];
}

/**
 * Fetch brands from API and cache them
 * This should be called when the app starts and user is online
 */
export async function fetchAndCacheBrands(category?: string): Promise<{ id: string; name: string }[]> {
  if (typeof window === 'undefined') return [];

  try {
    // Dynamic import to avoid circular dependencies
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

    // Mark fetch as failed
    const statusKey = category ? `${BRANDS_FETCH_STATUS_KEY}_${category.toUpperCase()}` : BRANDS_FETCH_STATUS_KEY;
    localStorage.setItem(statusKey, 'failed');

    // Return cached brands if available
    const cached = getBrandsFromCache(category);
    return cached || [];
  }
}

/**
 * Initialize brand caching - call this when app starts
 */
export async function initBrandCache(): Promise<void> {
  if (typeof window === 'undefined') return;

  const cached = getBrandsFromCache();
  if (cached && cached.length > 0) {
    return;
  }

  // Only fetch if online
  if (navigator.onLine) {
    await fetchAndCacheBrands();
  }
}

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}
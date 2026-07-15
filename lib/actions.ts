'use server';

// Server actions for property and installation management

import { cookies } from 'next/headers';

/**
 * Converts a component type string to its API endpoint segment.
 * - Replaces all underscores with hyphens (e.g. garage_doors â†’ garage-doors)
 * - Special case: window_door â†’ windows-doors
 */
function toEndpointType(type: string): string {
    if (type === 'window_door') return 'windows-doors';
    return type.replace(/_/g, '-');
}

// Type definitions
type FetchApiParams = {
    url: string;
    data?: any;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    tags?: string[];
    isAuth?: boolean;
    responseType?: 'json' | 'blob' | 'text';
    /** Request timeout in milliseconds. Defaults to 120000ms (2 min) for blobs, 30000ms for others. */
    timeout?: number;
};

type FetchApiResponse<T = any> = {
    status: number;
    data: T | null;
    type: 'success' | 'error';
    messages?: string | string[] | null;
    error?: any;
};

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

function normalizeMsg(messages: string | string[] | null | undefined, fallback: string): string {
    return Array.isArray(messages) ? messages.join(', ') : typeof messages === 'string' ? messages : fallback;
}

export type ActionResult<T = any> =
    | { success: true; data: T }
    | { success: false; message: string };

/**
 * Generic API fetch utility
 * - Handles base URL and token authentication
 * - Automatically parses JSON responses
 * - Provides standardized success/error response format
 */
export async function fetchApi<T = any>({
    url,
    data,
    method = 'GET',
    tags,
    isAuth = true,
    responseType = 'json',
    timeout,
}: FetchApiParams): Promise<FetchApiResponse<T>> {
    const _url = API_URL + url;
    const cookieStore = await cookies();
    let token = cookieStore.get('auth-token')?.value;
    const refreshTokenValue = cookieStore.get('refresh-token')?.value;
    const isFormData = data instanceof FormData;

    // Blob responses (e.g. PDF) can take much longer — default 2 min; others 30s
    const timeoutMs = timeout ?? (responseType === 'blob' ? 120_000 : 30_000);

    // Helper function to make the actual request
    async function makeRequest() {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(_url, {
                method,
                headers: {
                    ...(!isFormData && { 'Content-Type': 'application/json' }),
                    ...(isAuth && token && { 'Authorization': `Bearer ${token}` }),
                },
                ...(method !== 'GET' && data && {
                    body: isFormData ? data : JSON.stringify(data),
                }),
                ...(tags && { next: { tags } }),
                cache: 'no-store',
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timer);
        }
    }

    try {
        // First attempt
        let response = await makeRequest();


        console.log("status", response.status);
        console.log("content-length", response.headers.get("content-length"));
        console.log("content-type", response.headers.get("content-type"));
        console.log("transfer-encoding", response.headers.get("transfer-encoding"));

        // If Unauthorized and we have a refresh token, try to refresh
        if (response.status === 401 && refreshTokenValue && isAuth) {
            try {
                const syncResult = await refreshAndSyncSession(refreshTokenValue);

                // Update token for retry
                token = syncResult.idToken;

                // Retry the original request
                response = await makeRequest();
            } catch (refreshError) {
                // Refresh failed, just return the 401
                return {
                    status: 401,
                    data: null,
                    type: 'error',
                    messages: 'Authentication failed. Please try logging in again.',
                };
            }
        }

        // Handle error response
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const rawMsg = errorData?.message || errorData?.error || errorData?.errors || `Fetch failed: ${response.status} ${response.statusText}`;
            const normalizedMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : typeof rawMsg === 'object' && rawMsg !== null ? JSON.stringify(rawMsg) : String(rawMsg);
            return { status: response.status, data: null, type: 'error', messages: normalizedMsg };
        }

        // Handle different response types
        let responseData;
        if (responseType === 'blob') {
            console.log("Starting blob conversion...");

            responseData = await response.blob();

            console.log("Blob conversion complete");
            console.log("Blob size:", responseData.size);
            console.log("Blob type:", responseData.type);
        } else if (responseType === 'text') {
            responseData = await response.text();
        } else {
            // Default to JSON
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                return {
                    status: response.status,
                    data: null,
                    type: 'error',
                    messages: 'Expected JSON but received non-JSON response',
                };
            }
        }

        return {
            status: response.status,
            data: responseData,
            type: 'success',
            messages: null,
        };
    } catch (e: any) {
        const isAbort = e?.name === 'AbortError';
        return {
            status: isAbort ? 408 : 500,
            data: null,
            type: 'error',
            messages: isAbort
                ? `Request timed out after ${timeoutMs / 1000}s. The server is taking too long to respond.`
                : e.message || 'Something went wrong.',
        };
    }
}

// Auth
export async function loginUser(body: any): Promise<ActionResult<{
    idToken: string;
    refreshToken: string;
    user: { id: string; name: string; email: string; role: string; sub_account: boolean; has_membership: boolean };
}>> {
    try {
        const { rememberMe, ...loginData } = body;
        const response = await fetchApi({
            url: '/api/auth/login',
            method: 'POST',
            data: loginData,
            isAuth: false,
        });

        if (response.type === 'error') {
            const msg = Array.isArray(response.messages)
                ? response.messages.join(', ')
                : typeof response.messages === 'string'
                    ? response.messages
                    : 'Login failed';
            return { success: false, message: msg };
        }

        // Determine cookie expiration based on rememberMe
        const authTokenMaxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60;
        const refreshTokenMaxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60;
        const otherCookiesMaxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60;

        const cookieStore = await cookies();
        cookieStore.set('auth-token', response.data.tokens.idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: authTokenMaxAge
        });
        cookieStore.set('refresh-token', response.data.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: refreshTokenMaxAge
        });
        cookieStore.set('user-role', response.data.role.toLowerCase(), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: otherCookiesMaxAge
        });
        cookieStore.set('sub-account', String(response.data.sub_account), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: otherCookiesMaxAge
        });
        cookieStore.set('has-membership', String(response.data.has_membership), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: otherCookiesMaxAge
        });

        return {
            success: true,
            data: {
                idToken: response.data.tokens.idToken,
                refreshToken: response.data.tokens.refreshToken,
                user: {
                    id: response.data.uid,
                    name: response.data.email.split('@')[0],
                    email: response.data.email,
                    role: response.data.role.toLowerCase(),
                    sub_account: response.data.sub_account,
                    has_membership: response.data.has_membership,
                },
            },
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Something went wrong during login',
        };
    }
}

export async function googleLogin(idToken: string): Promise<ActionResult> {
    try {
        const response = await fetchApi({
            url: '/api/auth/google',
            method: 'POST',
            data: { idToken },
            isAuth: false,
        });

        if (response.type === 'error') {
            const msg = Array.isArray(response.messages)
                ? response.messages.join(', ')
                : typeof response.messages === 'string'
                    ? response.messages
                    : 'Google login failed';
            return { success: false, message: msg };
        }

        // requiresRoleSelection is only present when true â€” treat absence as false
        const requiresRoleSelection = response.data.requiresRoleSelection === true;

        const cookieStore = await cookies();
        cookieStore.set('auth-token', response.data.tokens.idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60,
        });
        cookieStore.set('refresh-token', response.data.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
        });
        cookieStore.set('user-role', requiresRoleSelection ? 'guest' : response.data.role.toLowerCase(), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
        });
        cookieStore.set('sub-account', String(response.data.sub_account ?? false), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
        });
        cookieStore.set('has-membership', String(response.data.has_membership ?? false), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
        });

        return {
            success: true,
            data: {
                idToken: response.data.tokens.idToken,
                refreshToken: response.data.tokens.refreshToken,
                requiresRoleSelection,
                isNewUser: response.data.isNewUser ?? false,
                user: {
                    id: response.data.userId,
                    uid: response.data.uid,
                    name: response.data.display_name || `${response.data.first_name} ${response.data.last_name}`.trim(),
                    firstName: response.data.first_name,
                    lastName: response.data.last_name,
                    email: response.data.email,
                    role: requiresRoleSelection ? 'guest' : response.data.role?.toLowerCase(),
                    sub_account: response.data.sub_account,
                    has_membership: response.data.has_membership,
                    company_name: response.data.company_name,
                    city: response.data.city,
                },
            },
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Something went wrong during Google login',
        };
    }
}

/**
 * Assign a role to a new Google user who completed role selection.
 * Swaps the 'guest' cookie for the real role.
 */
export async function assignUserRole(roleId: string, roleName: string, extraFields: Record<string, any> = {}) {
    const response = await fetchApi({
        url: '/api/auth/assign-role',
        method: 'PUT',
        data: { role_id: roleId, ...extraFields },
    });

    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to assign role') };
    }

    const cookieStore = await cookies();
    cookieStore.set('user-role', roleName.toLowerCase(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
    });

    return { success: true, data: response.data };


}

export async function refreshToken(refreshToken: string) {
    const response = await fetchApi({
        url: '/api/auth/refresh-token',
        method: 'POST',
        data: { refresh_token: refreshToken },
        isAuth: false,
    });

    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to refresh token'));
    }

    return response.data;
}

export async function refreshAndSyncSession(refreshTokenValue: string) {
    const response = await fetchApi({
        url: '/api/auth/refresh-token',
        method: 'POST',
        data: { refresh_token: refreshTokenValue },
        isAuth: false,
    });

    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to refresh token'));
    }

    const { idToken, refreshToken: newRefreshToken } = response.data.tokens;

    // Fetch user profile using the new idToken
    const profileResponse = await fetch(`${API_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile during session sync');
    }

    const profileData = await profileResponse.json();
    const userProfile = profileData.data || profileData;

    const cookieStore = await cookies();
    const existingRole = cookieStore.get('user-role')?.value;
    const existingSubAccount = cookieStore.get('sub-account')?.value === 'true';
    const existingHasMembership = cookieStore.get('has-membership')?.value === 'true';

    const role = (userProfile.role ? userProfile.role.toLowerCase() : null) || existingRole || 'guest';
    const subAccount = String(userProfile.sub_account ?? existingSubAccount);
    const hasMembership = String(userProfile.has_membership ?? existingHasMembership);

    cookieStore.set('auth-token', idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
    });

    if (newRefreshToken) {
        cookieStore.set('refresh-token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });
    }

    cookieStore.set('user-role', role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    cookieStore.set('sub-account', subAccount, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    cookieStore.set('has-membership', hasMembership, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return {
        idToken,
        refreshToken: newRefreshToken || refreshTokenValue,
        role,
        subAccount,
        hasMembership,
    };
}


export async function registerUser(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/auth/register',
        method: 'POST',
        data: body,
        isAuth: false,
    });

    if (response.type === 'error') {
        const msg = Array.isArray(response.messages)
            ? response.messages.join(', ')
            : typeof response.messages === 'string'
                ? response.messages
                : 'Registration failed';
        return { success: false, message: msg };
    }

    return { success: true, data: response.data };
}

export async function forgotPassword(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/auth/forgot-password',
        method: 'POST',
        data: body,
        isAuth: false,
    });

    if (response.type === 'error') {
        const msg = Array.isArray(response.messages)
            ? response.messages.join(', ')
            : typeof response.messages === 'string'
                ? response.messages
                : 'Failed to send reset link';
        return { success: false, message: msg };
    }

    return { success: true, data: response.data };
}

export async function verifyOtp(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/auth/verify-otp',
        method: 'POST',
        data: body,
        isAuth: false,
    });

    if (response.type === 'error') {
        const msg = Array.isArray(response.messages)
            ? response.messages.join(', ')
            : typeof response.messages === 'string'
                ? response.messages
                : 'Failed to verify OTP';
        return { success: false, message: msg };
    }

    return { success: true, data: response.data };
}

export async function verifyRegisterOtp(body: { email: string; otp: string }): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/auth/register/verify',
        method: 'POST',
        data: body,
        isAuth: false,
    });

    if (response.type === 'error') {
        const msg = Array.isArray(response.messages)
            ? response.messages.join(', ')
            : typeof response.messages === 'string'
                ? response.messages
                : 'Failed to verify OTP';
        return { success: false, message: msg };
    }

    return { success: true, data: response.data };
}

export async function resendRegisterOtp(body: { email: string }): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/auth/register/resend-otp',
        method: 'POST',
        data: body,
        isAuth: false,
    });

    if (response.type === 'error') {
        const msg = Array.isArray(response.messages)
            ? response.messages.join(', ')
            : typeof response.messages === 'string'
                ? response.messages
                : 'Failed to resend OTP';
        return { success: false, message: msg };
    }

    return { success: true, data: response.data };
}


export async function resetPassword(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/auth/reset-password',
        method: 'POST',
        data: body,
        isAuth: false,
    });

    if (response.type === 'error') {
        const msg = Array.isArray(response.messages)
            ? response.messages.join(', ')
            : typeof response.messages === 'string'
                ? response.messages
                : 'Failed to reset password';
        return { success: false, message: msg };
    }

    return { success: true, data: response.data };
}

export async function changePassword(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/auth/change-password',
        method: 'POST',
        data: body,
    });

    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to change password') };
    }

    return { success: true, data: response.data };
}

export async function signout() {
    try {
        const response = await fetchApi({
            url: '/api/auth/logout',
            method: 'POST',
            data: { "action": "LOGOUT" },
        });
        if (response.type === 'error') {
            return await logout();
        }
        const cookieStore = await cookies();
        cookieStore.delete('auth-token');
        cookieStore.delete('refresh-token');
        cookieStore.delete('user-role');
        cookieStore.delete('sub-account');
        cookieStore.delete('has-membership');
        return { success: true };
    } catch (error) {

        return await logout();
    }
}
export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    cookieStore.delete('refresh-token');
    cookieStore.delete('user-role');
    cookieStore.delete('sub-account');
    cookieStore.delete('has-membership');
    return { success: true };
}

export async function postProperty(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/properties',
        method: 'POST',
        data: body,
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to add property') };
    }
    return { success: true, data: response.data };
}

export async function postInstallation(propertyId: string, type: string, body: any): Promise<ActionResult> {
    const endpoint = `/api/properties/${propertyId}/${toEndpointType(type)}`;

    const response = await fetchApi({
        url: endpoint,
        method: 'POST',
        data: body,
    });

    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, `Failed to submit ${type} installation`) };
    }

    return { success: true, data: response.data };
}

export async function deleteProperty(id: string) {
    const response = await fetchApi({
        url: `/api/properties/${id}`,
        method: 'DELETE',
    });

    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, `Failed to delete property`) };
    }

    return { success: true, data: response.data };
}

export async function uploadInstallationImages(type: string, id: string, files: File[] | Record<string, File | null>): Promise<ActionResult> {
    const formData = new FormData();

    if (Array.isArray(files)) {
        const key = normalizeCategoryKey(type);
        files.forEach((file) => {
            formData.append(key || 'files', file);
        });
    } else {
        Object.entries(files).forEach(([fieldName, file]) => {
            if (file) {
                formData.append(fieldName, file);
            }
        });
    }

    const response = await fetchApi({
        url: `/api/${toEndpointType(type)}/${id}/images`,
        method: 'POST',
        data: formData,
    });

    if (response.type === 'error') {
        const message =
            typeof response.messages === 'string'
                ? response.messages
                : Array.isArray(response.messages)
                    ? response.messages.join(', ')
                    : 'Failed to upload images';
        return { success: false, message };
    }

    return { success: true, data: response.data };
}

export async function postReport(propertyId: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/properties/${propertyId}/generate-report`,
        method: 'POST',
    });

    if (response.type === 'error') {
        const message =
            typeof response.messages === 'string'
                ? response.messages
                : Array.isArray(response.messages)
                    ? response.messages.join(', ')
                    : 'Failed to generate report';
        return { success: false, message };
    }

    return { success: true, data: response.data };
}

export async function getPropertyById(id: any) {
    const response = await fetchApi({
        url: `/api/properties/components/summary?id=${id}`,
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get property details'));
    }
    const data = response.data;
    return Array.isArray(data) ? data[0] : data;
}

export type PropertyFilters = {
    id?: string;
    search?: string;
    brandName?: string;
    style?: string;
    color?: string;
    state?: string;
    city?: string;
    state_id?: string;
    city_id?: string;
    zip?: string;
    has_report?: boolean;
    property_type?: string;
    page?: number;
    limit?: number;
    is_purchased?: boolean;
    isPropertyOwner?: boolean;
};

function buildPropertyFilterParams(filters: PropertyFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.id) params.append('id', filters.id);
    if (filters.search) params.append('search', filters.search);
    if (filters.brandName) params.append('brandName', filters.brandName);
    if (filters.style) params.append('style', filters.style);
    if (filters.color) params.append('color', filters.color);
    if (filters.state && filters.state !== 'all') params.append('state', filters.state);
    if (filters.city && filters.city !== 'all') params.append('city', filters.city);
    if (filters.state_id) params.append('state_id', filters.state_id);
    if (filters.city_id) params.append('city_id', filters.city_id);
    if (filters.zip) params.append('zip', filters.zip);
    if (filters.has_report !== undefined) params.append('has_report', filters.has_report.toString());
    if (filters.property_type) params.append('property_type', filters.property_type);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.is_purchased !== undefined) params.append('is_purchased', filters.is_purchased.toString());
    return params;
}

export async function getPropertyListAll(filters?: PropertyFilters) {
    let url = (filters && filters.isPropertyOwner)
        ? '/api/properties/user/all-details'
        : '/api/properties/components/summary';

    if (filters) {
        const { isPropertyOwner, ...cleanFilters } = filters;
        const query = buildPropertyFilterParams(cleanFilters).toString();
        if (query) url += `?${query}`;
    }
    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get property list'));
    }
    return response.data;
}

export async function getPropertyLocations(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    zoomLevel?: number,
    filters?: PropertyFilters
) {
    let url = `/api/properties/location?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`;
    if (zoomLevel !== undefined) {
        url += `&zoomLevel=${zoomLevel}`;
    }
    if (filters) {
        const query = buildPropertyFilterParams(filters).toString();
        if (query) {
            url += `&${query}`;
        }
    }
    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get property locations'));
    }
    return response.data;
}

export async function getPropertyListUser() {
    const response = await fetchApi({
        url: '/api/properties/user/with-components',
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get property list'));
    }
    return response.data;
}

export async function getUserProfile() {
    const response = await fetchApi({
        url: "/api/users/profile",
        method: "GET",
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get user profile'));
    }
    return response.data.data;
}

export async function updateUserProfile(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: "/api/users/profile",
        method: "PUT",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update user profile') };
    }
    return { success: true, data: response.data?.data ?? response.data };
}

export async function getUserList(page: number = 1, limit: number = 10, role?: string, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    const response = await fetchApi({
        url: `/api/users/all?${params.toString()}`,
        method: "GET",
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get user list'));
    }
    return response.data;
}

export async function getUserById(id: string) {
    const response = await fetchApi({
        url: `/api/users/all?id=${id}`,
        method: "GET",
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get user'));
    }
    return response.data.data;
}

export async function updateUser(id: string, body: any) {
    const response = await fetchApi({
        url: `/api/auth/admin/update-user?id=${id}`,
        method: "PUT",
        data: body,
    });

    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update user') };
    }

    return { success: true, data: response.data };
}

// Brand Management
export async function getBrands(page: number = 1, limit: number = 10, category?: string, search?: string) {
    try {
        const params = new URLSearchParams();

        if (page > 0 && limit > 0) {
            params.append("page", page.toString());
            params.append("limit", limit.toString());
        }

        if (category) {
            params.append("category", category.toUpperCase());
        }

        if (search) {
            params.append("search", search);
        }

        const url = `/api/brands${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetchApi({
            url: url,
            method: "GET",
        });
        if (response.type === "error") {
            throw new Error(normalizeMsg(response.messages, 'Failed to get brands'));
        }
        return response.data;
    } catch (error) {

        throw error;
    }
}

export async function createBrand(body: { brand_name: string; description: string; is_active?: boolean }): Promise<ActionResult> {
    const response = await fetchApi({
        url: "/api/brands",
        method: "POST",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to create brand') };
    }
    return { success: true, data: response.data };
}

export async function updateBrand(id: string, body: { brand_name?: string; description?: string; is_active?: boolean }): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/brands/${id}`,
        method: "PUT",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update brand') };
    }
    return { success: true, data: response.data };
}

export async function deleteBrand(id: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/brands/${id}`,
        method: "DELETE",
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete brand') };
    }
    return { success: true, data: response.data };
}

export async function createMembership(body: any) {
    const response = await fetchApi({
        url: "/api/membership-plans",
        method: "POST",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to create membership') };
    }
    return { success: true, data: response.data };
}

export async function getMembership(id?: string, role?: string) {
    let url = id ? `/api/membership-plans?id=${id}` : "/api/membership-plans";

    if (role && !id) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}role=${role}`;
    }

    const response = await fetchApi({
        url,
        method: "GET",
    });

    if (response.type === "error") {
        throw new Error(
            normalizeMsg(response.messages, 'Failed to get membership')
        );
    }

    return response.data;
}

export async function updateMembership(body: any, id: string) {
    const response = await fetchApi({
        url: `/api/membership-plans/${id}`,
        method: "PUT",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update membership') };
    }
    return { success: true, data: response.data };
}

export async function deleteMembership(id: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/membership-plans/${id}`,
        method: "DELETE",
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete membership') };
    }
    return { success: true, data: response.data };
}

export async function cancelMembership(): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/membership-plans/cancel`,
        method: "PUT",
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to cancel membership') };
    }
    const cookieStore = await cookies();
    cookieStore.set('has-membership', 'false', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60
    });
    return { success: true, data: response.data };
}

export async function updateProperties(id: string, body: any) {
    const response = await fetchApi({
        url: `/api/properties/admin/${id}`,
        method: "PUT",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete membership') };
    }
    return { success: true, data: response.data };

}

export async function updateInstallation(type: string, id: string, body: any) {
    const payload = { ...body };

    const response = await fetchApi({
        url: `/api/admin/${toEndpointType(type)}/${id}`,
        method: 'PUT',
        data: payload,
    });

    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, `Failed to update ${type} installation`) };
    }
    return { success: true, data: response.data };
}

export async function generatePdfReport(id: string, type?: string, userRole?: string) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    let url = `${basePath}/api/reports/${id}/download`;
    if (type) {
        url += `?project_type=${encodeURIComponent(type)}`;
    }
    return url;
}

export async function generateProjectPdfReport(id: string) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return `${basePath}/api/project/${id}/pdf`;
}

export async function getReportUsage() {
    const response = await fetchApi({
        url: '/api/reports/usage',
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get report usage'));
    }
    return response.data;
}

export async function purchaseReport(reportId: string) {
    let url = `/api/reports/${reportId}/purchase`
    const response = await fetchApi({
        url: url,
        method: 'POST',
    });
    if (response.type === 'error') {
        const msg = Array.isArray(response.messages) ? response.messages.join(', ') : typeof response.messages === 'string' ? response.messages : 'Failed to upload permit';
        return { success: false, message: msg };
    }
    return { success: true, data: response.data, url: url };
}

export async function purchaseAllContractorReports(propertyId: string): Promise<ActionResult> {
    let url = `/api/stripe/purchase/property/${propertyId}`
    const response = await fetchApi({
        url: url,
        method: 'POST',
    });
    console.log("hit turl:", url)
    if (response.type === 'error') {
        const msg = Array.isArray(response.messages)
            ? response.messages.join(', ')
            : typeof response.messages === 'string'
                ? response.messages
                : 'Failed to purchase all contractor reports';
        return { success: false, message: msg };
    }
    return { success: true, data: response.data };
}

export async function generateAllContractorPdfReport(propertyId: string) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return `${basePath}/api/properties/${propertyId}/all-contractor-projects/pdf`;
}

export async function generateContractorProjectPdfReport(projectId: string) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return `${basePath}/api/properties/${projectId}/contractor-projects/pdf`;
}

export async function generateOwnerProjectPdfReport(projectId: string) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return `${basePath}/api/properties/${projectId}/owner-projects/pdf`;
}

export async function purchaseProject(projectId: string | string[], propertyId: string): Promise<ActionResult> {
    const ids = Array.isArray(projectId) ? projectId : [projectId];
    const data = {
        projectId: ids[0],
        projectIds: ids,
        propertyId
    };
    const response = await fetchApi({
        url: '/api/stripe/purchase/project',
        method: 'POST',
        data,
    });
    if (response.type === 'error') {
        const msg = Array.isArray(response.messages)
            ? response.messages.join(', ')
            : typeof response.messages === 'string'
                ? response.messages
                : 'Failed to purchase project';
        return { success: false, message: msg };
    }
    return { success: true, data: response.data };
}

export async function updateInstallationImagesAdmin(type: string, id: string, files: File[]) {
    const formData = new FormData();
    const key = normalizeCategoryKey(type);
    files.forEach((file) => {
        formData.append(key || 'files', file);
    });

    const response = await fetchApi({
        url: `/api/admin/${toEndpointType(type)}/${id}/images`,
        method: 'PUT',
        data: formData,
    });

    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update images') };
    }
    return { success: true, data: response.data };
}

function normalizeCategoryKey(value?: string) {
    return (value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export async function updateInstallationImagesByCategory(type: string, id: string, categoryFiles: Record<string, File>) {
    const formData = new FormData();
    Object.entries(categoryFiles).forEach(([categoryName, file]) => {
        const normalizedCategoryName = normalizeCategoryKey(categoryName);
        if (normalizedCategoryName) {
            formData.append(normalizedCategoryName, file);
        }
    });

    const response = await fetchApi({
        url: `/api/admin/${toEndpointType(type)}/${id}/images`,
        method: 'PUT',
        data: formData,
    });

    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update images') };
    }
    return { success: true, data: response.data };
}

export async function createCity(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: "/api/cities",
        method: "POST",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to create city') };
    }
    return { success: true, data: response.data };
}

export async function updateCity(id: string, body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/cities/${id}`,
        method: "PUT",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update city') };
    }
    return { success: true, data: response.data };
}

export async function deleteCity(id: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/cities/${id}`,
        method: "DELETE",
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete city') };
    }
    return { success: true, data: response.data };
}

export async function getCities(page: number = 1, limit?: number, id?: string, name?: string, state_id?: string, isAdmin: boolean = false) {
    let url = id ? `/api/cities/${id}` : "/api/cities";

    const params = new URLSearchParams();
    if (!id) {
        params.append("page", page.toString());
        if (name) {
            params.append("name", name);
        }
        if (state_id) params.append("state_id", state_id);
        if (typeof limit === 'number' && isAdmin) {
            params.append("limit", limit.toString());
        }
    }

    const query = params.toString();
    if (query) {
        url += `?${query}`;
    }

    const response = await fetchApi({
        url,
        method: "GET",
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get city list'));
    }
    return response.data;
}



export async function addUser(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/auth/admin/add-user',
        method: 'POST',
        data: body,
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Registration failed') };
    }
    return { success: true, data: response.data };
}

export async function getAuditLogs(page: number = 1, limit: number = 15, search?: string) {
    let url = `/api/audit-logs?page=${page}&limit=${limit}`;
    if (search) {
        url += `&search=${search}`;
    }
    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get audit logs'));
    }
    return response.data;
}

export async function getAuditReports(page: number = 1, limit: number = 15, search?: string) {
    let url = `/api/audit-reports?page=${page}&limit=${limit}`;
    if (search) {
        url += `&search=${search}`;
    }
    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get report logs'));
    }
    return response.data;
}

export async function createContractorProfile(formData: FormData) {
    const response = await fetchApi({
        url: '/api/contractor-directory-profile',
        method: 'POST',
        data: formData,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to create contractor profile') };
    }
    return { success: true, data: response.data };
}

export async function getContractorDirectory(params?: { city_id?: string; service?: string; keyword?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.city_id) queryParams.append('city_id', params.city_id);
    if (params?.service) queryParams.append('service', params.service);
    if (params?.keyword) queryParams.append('keyword', params.keyword);

    const url = `/api/contractor-directory${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get contractor directory'));
    }
    return response.data;
}

export async function getContractorProfile(id: string) {
    const response = await fetchApi({
        url: `/api/contractor-directory?id=${id}`,
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get contractor profile'));
    }
    return response.data;
}

export async function updateContractorProfile(id: string, formData: FormData, role?: string) {
    const isAdmin = role?.toLowerCase() === 'admin';
    const url = isAdmin ? `/api/admin/contractor-directory-profile/${id}` : `/api/contractor-directory-profile`;

    const response = await fetchApi({
        url,
        method: 'PUT',
        data: formData,
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update contractor profile') };
    }
    return { success: true, data: response.data };
}

export async function deleteContractorProfile(id?: string, role?: any) {
    const isAdmin = role?.toLowerCase() === 'admin';
    const url = isAdmin ? `/api/admin/contractor-directory-profile/${id}` : '/api/contractor-directory-profile';

    const response = await fetchApi({
        url,
        method: 'DELETE',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete contractor profile') };
    }
    return { success: true, data: response.data };
}

export async function getComponentTypes() {
    const response = await fetchApi({
        url: '/api/reports/types',
        method: 'GET'
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get component types'));
    }
    return response.data;
}

export async function addStaff(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/auth/add-staff',
        method: 'POST',
        data: body,
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Adding staff failed') };
    }
    return { success: true, data: response.data };
}

export async function getStates(page: number = 1, limit: number = 10, name?: string) {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (name) params.append("name", name);

    const response = await fetchApi({
        url: `/api/states?${params.toString()}`,
        method: "GET",
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get states'));
    }
    return response.data;
}

export async function editStates(id: string, body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/states/${id}`,
        method: "PUT",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update state') };
    }
    return { success: true, data: response.data };
}

export async function deleteStates(id: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/states/${id}`,
        method: "DELETE",
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete state') };
    }
    return { success: true, data: response.data };
}

export async function createStates(body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: "/api/states",
        method: "POST",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to create state') };
    }
    return { success: true, data: response.data };
}

export async function subscribeToMembership(body: { plan_id: string; billing_cycle: string }): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/membership-plans/subscribe',
        method: 'POST',
        data: body,
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to create subscription') };
    }
    return { success: true, data: response.data };
}

export async function getSubAccounts(page: number = 1, limit: number = 10) {
    const response = await fetchApi({
        url: `/api/auth/staff?page=${page}&limit=${limit}`,
        method: "GET",
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get users'));
    }
    return response.data;
}

export async function getSpecificSubAccounts(id: string) {
    const response = await fetchApi({
        url: `/api/auth/staff?id=${id}`,
        method: "GET",
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get users'));
    }
    return response.data;
}


export async function getPropertyOwners() {
    const response = await fetchApi({
        url: "/api/auth/property-owners",
        method: "GET",
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get property owners'));
    }
    return response.data;
}
export async function uploadPropertOwnerImages(type: string, id: string, files: File[]): Promise<ActionResult> {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    let url = `/api/${toEndpointType(type)}/${id}/property-owner/images`
    console.log("sss", url)

    const response = await fetchApi({
        url: url,
        method: 'POST',
        data: formData,
    });

    if (response.type === 'error') {
        const message =
            typeof response.messages === 'string'
                ? response.messages
                : Array.isArray(response.messages)
                    ? response.messages.join(', ')
                    : 'Failed to upload images';
        return { success: false, message };
    }

    return { success: true, data: response.data };
}

export async function updateImagesofPropertyOwnersAdmin(type: string, id: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    const response = await fetchApi({
        url: `/api/${toEndpointType(type)}/${id}/property-owner/images`,
        method: 'PUT',
        data: formData,
    });

    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update images') };
    }

    return { success: true, data: response.data };
}

export async function postComments(body: any, id: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/properties/${id}/comments`,
        method: "POST",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to post comment') };
    }
    return { success: true, data: response.data };
}

export async function getComments(id: string) {
    const response = await fetchApi({
        url: `/api/properties/${id}/comments`,
        method: "GET",
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get comments'));
    }
    return response.data;
}

export async function editUserAdmin(id: string, body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/users/${id}`,
        method: "PUT",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to edit user') };
    }
    return { success: true, data: response.data };
}

export async function deleteUserAdmin(id: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/users/${id}`,
        method: "DELETE",
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete user') };
    }
    return { success: true, data: response.data };
}

export async function editStaff(id: string, body: any): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/auth/update-staff/${id}`,
        method: "PUT",
        data: body,
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to edit user') };
    }
    return { success: true, data: response.data };
}

export async function deleteStaff(id: string) {
    const response = await fetchApi({
        url: `/api/auth/delete-staff/${id}`,
        method: "DELETE",
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update contractor profile') };
    }
    return { success: true, data: response.data };
}

export async function getComponentType() {
    const response = await fetchApi({
        url: "/api/reports/types",
        method: "GET",
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get component types'));
    }
    return response.data;
}

export async function confirmPayment(sessionId: string) {
    const response = await fetchApi({
        url: '/api/stripe/confirm-payment',
        method: 'POST',
        data: { sessionId },
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to confirm payment') };
    }
    return { success: true, data: response.data };
}

export async function updateMembershipCookie(hasMembership: boolean) {
    const cookieStore = await cookies();
    cookieStore.set('has-membership', String(hasMembership), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
    });
}

export async function uploadPropertyImages(propertyId: string, frontImage?: File, otherImage?: File) {
    const formData = new FormData();
    if (frontImage) formData.append('front_image', frontImage);
    if (otherImage) formData.append('other_image', otherImage);

    const response = await fetchApi({
        url: `/api/properties/${propertyId}/images`,
        method: 'POST',
        data: formData,
    });

    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to upload property images') };
    }

    return { success: true, data: response.data };
}

export async function getPropertyDetail(id: string) {
    const response = await fetchApi({
        url: `/api/properties/components/summary?id=${id}`,
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get property detail'));
    }
    return response.data;
}


export async function generateMultipleReports(filters?: PropertyFilters) {
    // Returns the Next.js API route URL so the browser streams the PDF directly.
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    let url = `${basePath}/api/reports/multiple/download`;
    if (filters) {
        const query = buildPropertyFilterParams(filters).toString();
        if (query) url += `?${query}`;
    }
    return url;
}

export async function checkoutReports(filters: PropertyFilters) {
    const { page: _page, limit: _limit, is_purchased: _is_purchased, ...checkoutFilters } = filters;
    const response = await fetchApi({
        url: '/api/reports/checkout',
        method: 'POST',
        data: {
            ...(checkoutFilters.brandName && { brandName: checkoutFilters.brandName }),
            ...(checkoutFilters.color && { color: checkoutFilters.color }),
            ...(checkoutFilters.style && { style: checkoutFilters.style }),
            ...(checkoutFilters.search && { search: checkoutFilters.search }),
            ...(checkoutFilters.zip && { zip: checkoutFilters.zip }),
            ...(checkoutFilters.state_id && { state_id: checkoutFilters.state_id }),
            ...(checkoutFilters.city_id && { city_id: checkoutFilters.city_id }),
        },
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to initiate checkout') };
    }
    return { success: true, data: response.data };
}

export async function getPropertyTypeOption() {
    let url = '/api/properties/property-types'
    const response = await fetchApi({
        url,
        method: 'GET'
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get component types'));
    }
    return response.data;
}

export async function getPropertyTypeOptions(page?: number, limit?: number, search?: string) {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', String(page));
    if (limit !== undefined) params.append('limit', String(limit));
    if (search) params.append('search', search);
    let url = `/api/property-types${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetchApi({
        url,
        method: 'GET'
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get component types'));
    }
    return response.data;
}

export async function createPropertyType(body: any) {
    let url = '/api/property-types'
    const response = await fetchApi({
        url,
        method: 'POST',
        data: body
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to create property type') };
    }

    return { success: true, data: response.data };
}

export async function editPropertyType(id: string, body: any) {
    let url = `/api/property-types/${id}`;
    const response = await fetchApi({
        url,
        method: 'PUT',
        data: body
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to edit property type') };
    }
    return { success: true, data: response.data };
}

export async function deletePropertyType(id: string) {
    let url = `/api/property-types/${id}`;
    const response = await fetchApi({
        url,
        method: 'DELETE'
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete property type') };
    }
    return { success: true, data: response.data };
}

export async function createServiceProvided(body: any) {
    let url = '/api/services-provided'
    const response = await fetchApi({
        url,
        method: 'POST',
        data: body
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to create service provided') };
    }
    return { success: true, data: response.data };
}


export async function editServiceProvided(id: string, body: any) {
    let url = `/api/services-provided/${id}`;
    const response = await fetchApi({
        url,
        method: 'PUT',
        data: body
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to edit service provided') };
    }
    return { success: true, data: response.data };
}

export async function deleteServiceProvided(id: string) {
    let url = `/api/services-provided/${id}`;
    const response = await fetchApi({
        url,
        method: 'DELETE'
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete service provided') };
    }
    return { success: true, data: response.data };
}

export async function getServiceProvided(page?: number, limit?: number, search?: string) {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', String(page));
    if (limit !== undefined) params.append('limit', String(limit));
    if (search) params.append('search', search);
    let url = `/api/services-provided${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetchApi({
        url,
        method: 'GET'
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get service provided'));
    }
    return response.data;
}

export async function createRoles(body: any) {
    let url = '/api/roles'
    const response = await fetchApi({
        url,
        method: 'POST',
        data: body
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to create role') };
    }
    return { success: true, data: response.data };
}


export async function editRoles(id: string, body: any) {
    let url = `/api/roles/${id}`;
    const response = await fetchApi({
        url,
        method: 'PUT',
        data: body
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to edit role') };
    }
    return { success: true, data: response.data };
}

export async function deleteRoles(id: string) {
    let url = `/api/roles/${id}`;
    const response = await fetchApi({
        url,
        method: 'DELETE'
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete role') };
    }
    return { success: true, data: response.data };
}

export async function getRoles(page?: number, limit?: number, search?: string) {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', String(page));
    if (limit !== undefined) params.append('limit', String(limit));
    if (search) params.append('search', search);

    let url = `/api/roles`;
    const queryString = params.toString();
    if (queryString) {
        url += `?${queryString}`;
    }
    const response = await fetchApi({
        url,
        method: 'GET'
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get roles'));
    }
    return response.data;
}


export async function createImageCategory(body: any) {
    let url = '/api/admin/component-image-categories'
    const response = await fetchApi({
        url,
        method: 'POST',
        data: body
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to create image category') };
    }
    return { success: true, data: response.data };
}


export async function editImageCategory(id: string, body: any) {
    let url = `/api/admin/component-image-categories/${id}`;
    const response = await fetchApi({
        url,
        method: 'PUT',
        data: body
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to edit image category') };
    }
    return { success: true, data: response.data };
}

export async function deleteImageCategory(id: string) {
    let url = `/api/admin/component-image-categories/${id}`;
    const response = await fetchApi({
        url,
        method: 'DELETE'
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete image category') };
    }
    return { success: true, data: response.data };
}

export async function getImageCategory(page: number | string = 1, limit: number = 10, search?: string, component_type?: any) {
    let actualPage = 1;
    let actualLimit = limit;
    let actualComponentType = component_type;

    if (typeof page === 'string' && isNaN(Number(page))) {
        actualComponentType = page;
        actualPage = 1;
        actualLimit = limit === 10 ? 1000 : limit;
    } else {
        actualPage = Number(page) || 1;
    }

    const params = new URLSearchParams({ page: String(actualPage), limit: String(actualLimit) });
    if (search) params.append('search', search);
    if (actualComponentType) params.append('component_type', actualComponentType);

    let url = `/api/admin/component-image-categories?${params.toString()}`;
    console.log("url", url);
    const response = await fetchApi({
        url,
        method: 'GET'
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get image categories'));
    }
    return response.data;
}


export async function addProject(propertyId: any, body: any): Promise<ActionResult> {
    let url = `/api/property-projects/${propertyId}`;
    const response = await fetchApi({
        url,
        method: "POST",
        data: body
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to add project') };
    }
    return { success: true, data: response.data };
}

export async function editProject(propertyId: any, projectId: any, body: any): Promise<ActionResult> {
    const url = `/api/property-projects/${projectId}`;
    const response = await fetchApi({
        url,
        method: 'PUT',
        data: body,
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to update project') };
    }
    return { success: true, data: response.data };
}

export async function getReportPrice() {
    let url = `/api/app-settings`
    const response = await fetchApi({
        url,
        method: 'GET'
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get report price'));
    }
    return response.data;
}

export async function editReportPrice(id: any, body: any) {
    let url = `/api/app-settings/${id}`;
    const response = await fetchApi({
        url,
        method: 'PUT',
        data: body
    });
    if (response.type === "error") {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to edit report price') };
    }
    return { success: true, data: response.data };
}

export async function getProjectTypesforPropertyOwner() {
    let url = `/api/owner-project/types`;
    const response = await fetchApi({
        url,
        method: 'GET'
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get project types'));
    }
    return response.data;
}

export async function postPropertyOwnerInstallations(id: any, body: any): Promise<ActionResult> {
    let url = `/api/owner-project/${id}`;
    const response = await fetchApi({
        url,
        method: 'POST',
        data: body
    });
    if (response.type === 'error') {
        const msg = Array.isArray(response.messages) ? response.messages.join(', ') : typeof response.messages === 'string' ? response.messages : 'Failed to post installation';
        return { success: false, message: msg };
    }
    return { success: true, data: response.data };
}

export async function uploadOwnerProjectImage(installationId: string, file: File): Promise<ActionResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchApi({
        url: `/api/owner-project/${installationId}/upload`,
        method: 'POST',
        data: formData,
    });

    if (response.type === 'error') {
        const message =
            typeof response.messages === 'string'
                ? response.messages
                : Array.isArray(response.messages)
                    ? response.messages.join(', ')
                    : 'Failed to upload image';
        return { success: false, message };
    }

    return { success: true, data: response.data };
}


export async function verifyInstallation(permitId: string, payload: any, projectId?: string) {
    let url = projectId ? `/api/owner-project/${projectId}/verify` : `/api/permit/${permitId}/verify`;
    const response = await fetchApi({
        url,
        method: 'POST',
        data: payload,
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to verify installation') };
    }
    return { success: true, data: response.data };
}


export async function uploadPermit(projectId: string, file: File, description?: string, notes?: string): Promise<ActionResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    if (notes) formData.append('notes', notes);

    const response = await fetchApi({
        url: `/api/project/${projectId}/permit`,
        method: 'POST',
        data: formData,
    });
    if (response.type === 'error') {
        const msg = Array.isArray(response.messages) ? response.messages.join(', ') : typeof response.messages === 'string' ? response.messages : 'Failed to upload permit';
        return { success: false, message: msg };
    }
    return { success: true, data: response.data };
}

export async function purchaseExtraUsers(numberOfUsers: number): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/users/purchase',
        method: 'POST',
        data: { numberOfUsers },
    });
    if (response.type === 'error') {
        const msg = Array.isArray(response.messages)
            ? response.messages.join(', ')
            : typeof response.messages === 'string'
                ? response.messages
                : 'Failed to purchase users';
        return { success: false, message: msg };
    }
    return { success: true, data: response.data };
}

export async function postAddtionalUserForm(userId: string, body: any) {

    let url = `/api/auth/form/${userId}`;
    const response = await fetchApi({
        url,
        method: 'POST',
        data: body
    });
    if (response.type === 'error') {
        const msg = Array.isArray(response.messages)
            ? response.messages.join(', ')
            : typeof response.messages === 'string'
                ? response.messages
                : 'Failed to save profile';
        return { success: false, message: msg };
    }

    try {
        const cookieStore = await cookies();
        const data = response.data;
        if (data && data.tokens) {
            cookieStore.set('auth-token', data.tokens.idToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: data.tokens.expiresIn ? Number(data.tokens.expiresIn) : 3600
            });
            cookieStore.set('refresh-token', data.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 // 30 days
            });
            cookieStore.set('user-role', data.role.toLowerCase(), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60
            });
            cookieStore.set('sub-account', String(data.sub_account ?? false), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60
            });
            cookieStore.set('has-membership', String(data.has_membership ?? false), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60
            });
        }
    } catch (cookieError) {
        console.error('Error setting cookies in postAddtionalUserForm:', cookieError);
    }

    return { success: true, data: response.data };
}

export async function getprojectTypesInProperty(propertyId: any) {
    let url = `/api/property-projects/property/${propertyId}/types`;
    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get project types'));
    }
    return response.data;
}
export async function getprojectListingOfProperty(propertyId: any, projectType?: any, addedBy?: string, projectId?: string) {
    const params = new URLSearchParams();
    if (projectType) {
        params.append('project_type', projectType);
    }
    if (addedBy) {
        params.append('added_by', addedBy);
    }
    if (projectId) {
        params.append('project_id', projectId);
    }
    const queryString = params.toString();
    const url = `/api/property-projects/property/${propertyId}/full${queryString ? `?${queryString}` : ''}`;
    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get projects'));
    }
    return response.data;
}
export async function getMyProjects(page: number = 1, limit: number = 9, search?: string, isAdmin?: boolean) {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search) {
        params.append('search', search);
    }
    if (isAdmin) {
        params.append('created_by', 'ADMIN');
    }
    let url = `/api/property-projects/user/properties/full?${params.toString()}`;
    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get projects'));
    }
    return response.data;
}

export async function getAllProjects(page: number = 1, limit: number = 9, search?: string) {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search) {
        params.append('search', search);
    }
    let url = `/api/property-projects/user/properties/full?${params.toString()}`;
    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get projects'));
    }
    return response.data;
}


export async function getProjectByIdNew(projectId: string) {
    const url = `/api/property-projects/user/properties/full?project_id=${projectId}`;
    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get project'));
    }
    return response.data;
}

export async function confirmProject(projectId: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/project/${projectId}/confirm`,
        method: 'PUT',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to confirm project') };
    }
    return { success: true, data: response.data };
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/project/${projectId}`,
        method: 'DELETE',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete project') };
    }
    return { success: true, data: response.data };
}

export async function getPurchasedReports(page: number = 1, limit: number = 9, search?: string) {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search) {
        params.append('search', search);
    }
    const url = `/api/properties/user/purchases?${params.toString()}`;
    const response = await fetchApi({
        url,
        method: 'GET',
    });
    if (response.type === "error") {
        throw new Error(normalizeMsg(response.messages, 'Failed to get purchased reports'));
    }
    return response.data;
}

export async function getMyNotifications(page: number = 1, limit: number = 10): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/notifications/my?page=${page}&limit=${limit}`,
        method: 'GET',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to fetch notifications') };
    }
    return { success: true, data: response.data };
}

export async function getUnreadNotificationsCount(): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/notifications/unread-count',
        method: 'GET',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to fetch unread count') };
    }
    return { success: true, data: response.data };
}

export async function markNotificationAsRead(id: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/notifications/${id}/read`,
        method: 'PUT',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to mark notification as read') };
    }
    return { success: true, data: response.data };
}

export async function deleteNotification(id: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/notifications/${id}`,
        method: 'DELETE',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to delete notification') };
    }
    return { success: true, data: response.data };
}

export async function bulkDeleteNotifications(ids: string[]): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/notifications/bulk',
        method: 'DELETE',
        data: { ids },
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to bulk delete notifications') };
    }
    return { success: true, data: response.data };
}

export async function getImportFields(): Promise<ActionResult<{
    required_fields: string[];
    optional_fields: string[];
}>> {
    const response = await fetchApi({
        url: '/api/properties/import-fields',
        method: 'GET',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to fetch import fields') };
    }
    return { success: true, data: response.data?.data || response.data };
}

export async function importPropertiesFile(formData: FormData): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/properties/import',
        method: 'POST',
        data: formData,
        timeout: 600_000, // 10 minutes timeout for large files (5-10MB)
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to import properties file') };
    }
    return { success: true, data: response.data };
}

export async function getImportJobs(): Promise<ActionResult> {
    const response = await fetchApi({
        url: '/api/properties/import-jobs',
        method: 'GET',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to fetch import jobs') };
    }
    return { success: true, data: response.data?.data || response.data };
}

export async function getImportJobStatus(jobId: string): Promise<ActionResult> {
    const response = await fetchApi({
        url: `/api/properties/import-jobs/${jobId}`,
        method: 'GET',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to fetch job status') };
    }
    return { success: true, data: response.data?.data || response.data };
}

export async function getPermitsForProperty(propertyId: string) {
    const response = await fetchApi({
        url: `/api/permit?id=${propertyId}`,
        method: 'GET',
    });
    if (response.type === 'error') {
        throw new Error(normalizeMsg(response.messages, 'Failed to get permits'));
    }
    return response.data;
}

export async function getAddedPropertiesListing(params?: { page?: number; limit?: number; search?: string }): Promise<ActionResult> {
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const search = params?.search || '';
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
    }).toString();
    const response = await fetchApi({
        url: `/api/properties/approvals/listing?${query}`,
        method: 'GET',
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, 'Failed to fetch added properties') };
    }
    return { success: true, data: response.data?.data || response.data };
}

export async function updatePropertyApproval(propertyId: string, status: 'APPROVE' | 'REJECT'): Promise<ActionResult> {
    console.log("api runned")
    const response = await fetchApi({
        url: `/api/properties/approvals/${propertyId}`,
        method: 'PUT',
        data: { status },
    });
    if (response.type === 'error') {
        return { success: false, message: normalizeMsg(response.messages, `Failed to ${status.toLowerCase()} property`) };
    }
    return { success: true, data: response.data };
}
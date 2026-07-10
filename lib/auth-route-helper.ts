import { cookies } from 'next/headers';
import { refreshAndSyncSession } from '@/lib/actions';

export async function getValidAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    let token = cookieStore.get('auth-token')?.value;
    const refreshTokenValue = cookieStore.get('refresh-token')?.value;

    if (!token && refreshTokenValue) {
        // Auth token is missing but we have a refresh token, try to refresh
        try {
            const syncResult = await refreshAndSyncSession(refreshTokenValue);
            token = syncResult.idToken;
        } catch (error) {
            console.error('Failed to refresh token in route helper:', error);
            return null;
        }
    }

    return token || null;
}

export async function handleApiRouteRefresh(
    backendRequest: (token: string) => Promise<Response>
): Promise<{ response: Response; tokenUsed: string } | { errorResponse: Response }> {
    const token = await getValidAuthToken();
    if (!token) {
        return {
            errorResponse: new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
        };
    }

    const startTime = Date.now();
    let response = await backendRequest(token);
    const duration = Date.now() - startTime;
    console.log(`[API Route Proxy] GET ${response.url || 'backend endpoint'} took ${duration}ms (status: ${response.status})`);

    if (response.status === 401) {
        const cookieStore = await cookies();
        const refreshTokenValue = cookieStore.get('refresh-token')?.value;
        if (refreshTokenValue) {
            console.log('[API Route Proxy] Token expired, attempting auto-refresh...');
            try {
                const syncResult = await refreshAndSyncSession(refreshTokenValue);
                const newToken = syncResult.idToken;

                // Retry with new token
                const retryStartTime = Date.now();
                response = await backendRequest(newToken);
                const retryDuration = Date.now() - retryStartTime;
                console.log(`[API Route Proxy] RETRY GET ${response.url || 'backend endpoint'} took ${retryDuration}ms (status: ${response.status})`);
                return { response, tokenUsed: newToken };
            } catch (error) {
                console.error('Failed to refresh token on 401 in route helper:', error);
            }
        }
    }

    return { response, tokenUsed: token };
}

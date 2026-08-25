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

    if (response.status === 401) {
        const cookieStore = await cookies();
        const refreshTokenValue = cookieStore.get('refresh-token')?.value;
        if (refreshTokenValue) {
            try {
                const syncResult = await refreshAndSyncSession(refreshTokenValue);
                const newToken = syncResult.idToken;

                // Retry with new token
                const retryStartTime = Date.now();
                response = await backendRequest(newToken);
                const retryDuration = Date.now() - retryStartTime;

                return { response, tokenUsed: newToken };
            } catch (error) {
                console.error('Failed to refresh token on 401 in route helper:', error);
            }
        }
    }

    return { response, tokenUsed: token };
}

/**
 * Determines whether to attach the Bearer token header to a download URL.
 * Only sends Bearer token to internal backend API endpoints; strips it for external S3 / CloudFront / CDN URLs.
 */
export function shouldAttachAuthHeader(targetUrl: string, backendApiUrl?: string): boolean {
    if (!targetUrl) return false;
    try {
        const targetHost = new URL(targetUrl).host.toLowerCase();
        if (backendApiUrl) {
            const backendHost = new URL(backendApiUrl).host.toLowerCase();
            return targetHost === backendHost;
        }
        if (targetHost.includes('s3.') || targetHost.includes('amazonaws.com') || targetHost.includes('cloudfront.net')) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, limit: number = 30, windowMs: number = 60_000): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: limit - 1 };
    }

    if (record.count >= limit) {
        return { allowed: false, remaining: 0 };
    }

    record.count += 1;
    return { allowed: true, remaining: limit - record.count };
}

interface ProxyPdfOptions {
    backendUrl: string;
    fallbackFilename: string;
    rateLimitKey?: string;
}

export async function proxyPdfDownload({ backendUrl, fallbackFilename, rateLimitKey }: ProxyPdfOptions): Promise<Response> {
    const { NextResponse } = await import('next/server');
    const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

    if (rateLimitKey) {
        const rateLimitResult = checkRateLimit(rateLimitKey, 30, 60_000);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': '60' } }
            );
        }
    }

    const result = await handleApiRouteRefresh((token) =>
        fetch(backendUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        })
    );

    if ('errorResponse' in result) {
        return result.errorResponse;
    }

    const { response: backendResponse, tokenUsed: token } = result;

    if (!backendResponse.ok) {
        let errorData;
        try {
            errorData = await backendResponse.json();
        } catch {
            const text = await backendResponse.text().catch(() => '');
            const detail = process.env.NODE_ENV === 'production' ? undefined : text;
            errorData = { error: 'Report generation failed', ...(detail && { detail }) };
        }
        return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const contentType = backendResponse.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        let data;
        try {
            data = await backendResponse.json();
        } catch (err: any) {
            const detail = process.env.NODE_ENV === 'production' ? undefined : err?.message;
            return NextResponse.json(
                { error: 'Failed to parse JSON response from server', ...(detail && { detail }) },
                { status: 502 }
            );
        }

        if (data && data.downloadUrl) {
            let secureResponse: Response;
            try {
                const attachAuth = shouldAttachAuthHeader(data.downloadUrl, API_URL);
                secureResponse = await fetch(data.downloadUrl, {
                    method: 'GET',
                    headers: {
                        ...(attachAuth && { Authorization: `Bearer ${token}` }),
                    },
                    cache: 'no-store',
                });
            } catch (err: any) {
                const detail = process.env.NODE_ENV === 'production' ? undefined : err?.message;
                return NextResponse.json(
                    { error: 'Failed to reach secure download server', ...(detail && { detail }) },
                    { status: 502 }
                );
            }

            if (!secureResponse.ok) {
                let errorData;
                try {
                    errorData = await secureResponse.json();
                } catch {
                    const text = await secureResponse.text().catch(() => '');
                    const detail = process.env.NODE_ENV === 'production' ? undefined : text;
                    errorData = { error: 'Secure report download failed', ...(detail && { detail }) };
                }
                return NextResponse.json(errorData, { status: secureResponse.status });
            }

            const secureContentType = secureResponse.headers.get('content-type') ?? 'application/pdf';
            const secureContentDisposition = secureResponse.headers.get('content-disposition') ??
                `attachment; filename="${fallbackFilename}"`;

            return new NextResponse(secureResponse.body, {
                status: 200,
                headers: {
                    'Content-Type': secureContentType,
                    'Content-Disposition': secureContentDisposition,
                    'Cache-Control': 'no-store',
                },
            });
        } else {
            return NextResponse.json(
                { error: 'Download URL not found in server response', data },
                { status: 500 }
            );
        }
    }

    const contentDisposition =
        backendResponse.headers.get('content-disposition') ??
        `attachment; filename="${fallbackFilename}"`;

    return new NextResponse(backendResponse.body, {
        status: 200,
        headers: {
            'Content-Type': contentType || 'application/pdf',
            'Content-Disposition': contentDisposition,
            'Cache-Control': 'no-store',
        },
    });
}


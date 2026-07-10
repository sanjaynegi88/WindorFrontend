import { NextRequest, NextResponse } from 'next/server';
import { handleApiRouteRefresh } from '@/lib/auth-route-helper';

const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const routeStartTime = Date.now();
    const { id } = await params;
    const backendUrl = `${API_URL}/api/project/${id}/pdf`;

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
        console.log(`[PDF Route] Unauthorized or failed token refresh for project ${id} after ${Date.now() - routeStartTime}ms`);
        return result.errorResponse;
    }

    const { response: backendResponse, tokenUsed: token } = result;

    if (!backendResponse.ok) {
        let errorData;
        try {
            errorData = await backendResponse.json();
        } catch {
            const text = await backendResponse.text().catch(() => '');
            errorData = { error: 'Project report generation failed', detail: text };
        }
        console.log(`[PDF Route] Backend returned error status ${backendResponse.status} for project ${id} after ${Date.now() - routeStartTime}ms`);
        return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const contentType = backendResponse.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        let data;
        try {
            data = await backendResponse.json();
        } catch (err: any) {
            return NextResponse.json(
                { error: 'Failed to parse JSON response from server', detail: err?.message },
                { status: 502 }
            );
        }

        if (data && data.downloadUrl) {
            let secureResponse: Response;
            const secureFetchStartTime = Date.now();
            try {
                secureResponse = await fetch(data.downloadUrl, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: 'no-store',
                });
            } catch (err: any) {
                return NextResponse.json(
                    { error: 'Failed to reach secure download server', detail: err?.message },
                    { status: 502 }
                );
            }
            console.log(`[PDF Route] Secure S3 fetch took ${Date.now() - secureFetchStartTime}ms (status: ${secureResponse.status})`);

            if (!secureResponse.ok) {
                let errorData;
                try {
                    errorData = await secureResponse.json();
                } catch {
                    const text = await secureResponse.text().catch(() => '');
                    errorData = { error: 'Secure report download failed', detail: text };
                }
                return NextResponse.json(errorData, { status: secureResponse.status });
            }

            const secureContentType = secureResponse.headers.get('content-type') ?? 'application/pdf';
            const secureContentDisposition = secureResponse.headers.get('content-disposition') ??
                `attachment; filename="project-report-${id}.pdf"`;

            console.log(`[PDF Route] Successfully proxying S3 stream for project ${id} in ${Date.now() - routeStartTime}ms`);
            return new NextResponse(secureResponse.body, {
                status: 200,
                headers: {
                    'Content-Type': secureContentType,
                    'Content-Disposition': secureContentDisposition,
                    'Transfer-Encoding': 'chunked',
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

    // Fallback: stream original body if not JSON (direct PDF blob)
    const contentDisposition =
        backendResponse.headers.get('content-disposition') ??
        `attachment; filename="project-report-${id}.pdf"`;

    console.log(`[PDF Route] Successfully proxying fallback PDF stream for project ${id} in ${Date.now() - routeStartTime}ms`);
    return new NextResponse(backendResponse.body, {
        status: 200,
        headers: {
            'Content-Type': contentType || 'application/pdf',
            'Content-Disposition': contentDisposition,
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-store',
        },
    });
}

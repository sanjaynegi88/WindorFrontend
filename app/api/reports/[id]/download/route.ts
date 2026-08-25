import { NextRequest, NextResponse } from 'next/server';
import { proxyPdfDownload } from '@/lib/auth-route-helper';

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const backendUrl = `${API_URL}/api/reports/${id}/download${qs ? `?${qs}` : ''}`;

    return proxyPdfDownload({
        backendUrl,
        fallbackFilename: `report-${id}.pdf`,
    });
}

import { NextRequest, NextResponse } from 'next/server';
import { proxyPdfDownload } from '@/lib/auth-route-helper';

const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return NextResponse.json({ error: 'Invalid property/project ID' }, { status: 400 });
    }

    const backendUrl = `${API_URL}/api/properties/${id}/owner-projects/pdf`;

    return proxyPdfDownload({
        backendUrl,
        fallbackFilename: `owner-project-report-${id}.pdf`,
    });
}

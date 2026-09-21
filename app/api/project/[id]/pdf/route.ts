import { NextRequest, NextResponse } from 'next/server';
import { proxyPdfDownload } from '@/lib/auth-route-helper';

const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const backendUrl = `${API_URL}/api/project/${id}/pdf`;

    return proxyPdfDownload({
        backendUrl,
        fallbackFilename: `project-report-${id}.pdf`,
    });
}

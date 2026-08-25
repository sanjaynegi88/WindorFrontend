import { NextRequest } from 'next/server';
import { proxyPdfDownload } from '@/lib/auth-route-helper';

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const backendUrl = `${API_URL}/api/properties/components/summary/pdf${qs ? `?${qs}` : ''}`;

    return proxyPdfDownload({
        backendUrl,
        fallbackFilename: 'top-10-properties-report.pdf',
    });
}

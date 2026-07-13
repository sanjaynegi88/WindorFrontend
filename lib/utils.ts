import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats an image URL for the application.
 * Supports absolute URLs (Google images etc.) and relative paths (appends base URL).
 */
export function getAppImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const path = url.startsWith('/') ? url : `/${url}`;

  return `${baseUrl}${path}`;
}

/**
 * Formats a resource file URL for the application.
 * Supports absolute URLs and relative paths (appends base URL).
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[_\s\-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}


export function getResourceFileUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const path = url.startsWith('/') ? url : `/${url}`;

  return `${baseUrl}${path}`;
}

export async function downloadPdfFromUrl(url: string, filename: string) {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Accept: 'application/pdf',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    let errorMessage = `Failed to download PDF (${response.status})`;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.message || parsed.detail || parsed.error || errorMessage;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed || fallback;
  }

  if (error instanceof Error) {
    const message = error.message?.trim();
    return message || fallback;
  }

  if (Array.isArray(error)) {
    const messages = error
      .map((item) => getErrorMessage(item, ''))
      .filter(Boolean);
    return messages.length ? messages.join(', ') : fallback;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, any>;
    const candidates = [
      record.message,
      record.error,
      record.error?.message,
      record.response?.data?.message,
      record.response?.data?.error,
      record.response?.data?.errors,
      record.response?.data?.detail,
      record.response?.messages,
      record.detail,
      record.msg,
      record.errors,
    ];

    for (const candidate of candidates) {
      const message = getErrorMessage(candidate, '');
      if (message) {
        return message;
      }
    }

    const nestedMessages = Object.values(record)
      .map((value) => getErrorMessage(value, ''))
      .filter(Boolean);

    return nestedMessages.length ? nestedMessages.join(', ') : fallback;
  }

  return fallback;
}

/**
 * Asynchronously tests if an image URL is valid and opens.
 */
export function testImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(true); // Don't do network calls on server side
      return;
    }
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Resolves the first working image URL from a list of AWS S3 folders.
 */
export async function getWorkingAwsImageUrl(
  imageName: string | null | undefined,
  folders: string[] = ['ramsey', 'hennepin', 'scott', 'dakota', 'washington', 'carver', 'anoka']
): Promise<string> {
  const fallback = '/assets/prop_placeholder.png';
  if (!imageName) return fallback;

  const trimmed = imageName.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_AWS_IMAGE_BASE_URL ||
    'https://windor-verifications-images.s3.eu-north-1.amazonaws.com';

  if (typeof window === 'undefined') {
    // On server, return the first guess
    return `${baseUrl}/${folders[0]}/${trimmed}`;
  }

  for (const folder of folders) {
    const url = `${baseUrl}/${folder}/${trimmed}`;
    const exists = await testImageUrl(url);
    if (exists) {
      return url;
    }
  }

  return fallback;
}


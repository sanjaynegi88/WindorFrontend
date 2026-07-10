import { useState, useEffect } from 'react';
import { getWorkingAwsImageUrl } from '@/lib/utils';

/**
 * A custom hook to handle loading images from AWS S3 with support for multiple folder locations.
 * Returns the resolved working image URL.
 */
export function useAwsImage(
  imageName: string | null | undefined,
  folders: string[] = ['Ramsey', 'Kitie', 'Opera']
): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_AWS_IMAGE_BASE_URL ||
    'https://windor-verifications-images.s3.eu-north-1.amazonaws.com';

  const getInitialUrl = () => {
    if (!imageName) return '/assets/prop_placeholder.png';
    const trimmed = imageName.trim();
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed;
    }
    const defaultFolder = folders[0] || 'Ramsey';
    return `${baseUrl}/${defaultFolder}/${trimmed}`;
  };

  const [src, setSrc] = useState<string>(getInitialUrl);

  useEffect(() => {
    let active = true;
    getWorkingAwsImageUrl(imageName, folders).then((resolvedUrl) => {
      if (active) {
        setSrc(resolvedUrl);
      }
    });
    return () => {
      active = false;
    };
  }, [imageName, JSON.stringify(folders)]);

  return src;
}

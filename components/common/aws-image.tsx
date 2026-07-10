'use client';

import React, { useState, useEffect, ImgHTMLAttributes } from 'react';
import { getWorkingAwsImageUrl } from '@/lib/utils';

interface AwsImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  folders?: string[];
  fallbackSrc?: string;
}

export function AwsImage({
  src,
  folders = ['Ramsey'],
  fallbackSrc = '/assets/prop_placeholder.png',
  alt = '',
  ...props
}: AwsImageProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_AWS_IMAGE_BASE_URL;

  const getInitialUrl = () => {
    if (!src) return fallbackSrc;
    const trimmed = src.trim();
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

  const [currentSrc, setCurrentSrc] = useState<string>(getInitialUrl);

  useEffect(() => {
    let active = true;
    getWorkingAwsImageUrl(src, folders).then((resolvedUrl) => {
      if (active) {
        setCurrentSrc(resolvedUrl);
      }
    });
    return () => {
      active = false;
    };
  }, [src, JSON.stringify(folders)]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={(e) => {
        e.currentTarget.src = fallbackSrc;
      }}
      {...props}
    />
  );
}

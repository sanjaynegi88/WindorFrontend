'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { getWorkingAwsImageUrl } from '@/lib/utils';

interface AwsImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  folders?: string[];
  fallbackSrc?: string;
}

export function AwsImage({
  src,
  folders = ['ramsey', 'hennepin', 'scott', 'dakota', 'washington', 'carver', 'anoka'],
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

  const hasDimension = props.width !== undefined || props.height !== undefined;
  const isFill = props.fill === true;
  const layoutProps = (!hasDimension && !isFill) ? { fill: true } : {};

  return (
    <Image
      src={currentSrc}
      alt={alt}
      onError={() => {
        setCurrentSrc(fallbackSrc);
      }}
      {...layoutProps}
      {...props}
    />
  );
}

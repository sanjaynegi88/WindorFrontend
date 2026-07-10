'use client';

import { useRef, useCallback } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
      }) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
      ready: (callback: () => void) => void;
    };
  }
}

export function useRecaptchaV2(siteKey: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  const initializeRecaptcha = useCallback(() => {
    if (!containerRef.current || !siteKey) return;

    // Load reCAPTCHA script if not already loaded
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        window.grecaptcha.ready(() => {
          renderRecaptcha();
        });
      };
    } else {
      window.grecaptcha.ready(() => {
        renderRecaptcha();
      });
    }
  }, [siteKey]);

  const renderRecaptcha = useCallback(() => {
    if (!containerRef.current || !window.grecaptcha) return;

    // Clear existing widget
    containerRef.current.innerHTML = '';

    try {
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
      });
    } catch (error) {
      console.error('Error rendering reCAPTCHA:', error);
    }
  }, [siteKey]);

  const getToken = useCallback((): string => {
    if (!window.grecaptcha || widgetIdRef.current === null) {
      throw new Error('reCAPTCHA not initialized');
    }
    
    const token = window.grecaptcha.getResponse(widgetIdRef.current);
    if (!token) {
      throw new Error('reCAPTCHA not completed');
    }
    
    return token;
  }, []);

  const resetCaptcha = useCallback(() => {
    if (window.grecaptcha && widgetIdRef.current !== null) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch (error) {
        console.error('Error resetting reCAPTCHA:', error);
      }
    }
  }, []);

  return {
    containerRef,
    getToken,
    resetCaptcha,
    initializeRecaptcha,
  };
}
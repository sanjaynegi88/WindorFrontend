'use client';

import { useEffect } from 'react';

/**
 * Enhanced Layout Shift Prevention Hook
 * This provides additional protection beyond the CSS-only solution
 */
export function useLayoutShiftPrevention() {
  useEffect(() => {
    // Prevent Radix from adding any margin to body
    const preventRadixMargin = () => {
      const style = document.createElement('style');
      style.textContent = `
        /* Force override any Radix scroll-lock margin */
        body[data-scroll-locked] {
          margin-right: 0 !important;
          padding-right: 0 !important;
        }
        
        /* Ensure body scrollbar remains overlay */
        body {
          scrollbar-width: none !important;
        }
        
        body::-webkit-scrollbar {
          width: 0px !important;
        }
        
        /* Prevent any width changes on containers */
        .container, [class*="container"] {
          max-width: 100% !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    };

    const cleanup = preventRadixMargin();

    // Watch for any attempts to modify body styles
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement;
          if (target === document.body) {
            // If something tries to add margin-right to body, remove it
            if (target.style.marginRight) {
              console.warn('Layout shift prevention: Removing margin-right from body');
              target.style.marginRight = '';
            }
            if (target.style.paddingRight) {
              console.warn('Layout shift prevention: Removing padding-right from body');
              target.style.paddingRight = '';
            }
          }
        }
      });
    });

    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['style'] 
    });

    return () => {
      cleanup();
      observer.disconnect();
    };
  }, []);
}

/**
 * Layout Shift Prevention Component
 * Add this to your root layout or any page where you experience layout shift
 */
export function LayoutShiftPrevention() {
  useLayoutShiftPrevention();
  return null;
}
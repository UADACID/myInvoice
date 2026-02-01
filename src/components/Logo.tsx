import { useState, useEffect } from 'react';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    // Create a MutationObserver to watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`flex items-center ${className}`} aria-label="MyInvoice">
      <img
        src={isDark ? logoDark : logoLight}
        alt="MyInvoice Logo"
        className="h-8 sm:h-10 w-auto"
      />
    </div>
  );
}

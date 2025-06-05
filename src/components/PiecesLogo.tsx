import React, { useEffect, useState } from 'react';

interface PiecesLogoProps {
  className?: string;
  alt?: string;
  variant?: 'filled' | 'os';
}

export const PiecesLogo: React.FC<PiecesLogoProps> = ({ 
  className = "w-8 h-8", 
  alt = "Pieces",
  variant = 'filled'
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    // Initial check
    checkDarkMode();

    // Create observer to watch for class changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Determine which logo to use
  let logoSrc: string;
  
  if (variant === 'os') {
    // Core Dependencies logo
    logoSrc = isDark 
      ? "/assets/icons/pieces_os_dark.png" 
      : "/assets/icons/pieces_os_light_logo.png";
  } else {
    // Regular Pieces logo
    if (isDark) {
      logoSrc = "/assets/icons/white_circle.png";
    } else {
      logoSrc = "/assets/icons/pieces_filled.svg";
    }
  }

  return (
    <img 
      src={logoSrc} 
      alt={alt} 
      className={className}
    />
  );
};
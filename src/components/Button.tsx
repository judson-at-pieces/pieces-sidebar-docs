import React from 'react';

interface ButtonProps {
  label: string;
  linkHref?: string;
  openLinkInNewTab?: boolean;
  align?: 'left' | 'center' | 'right';
  lightColor?: string;
  darkColor?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  label,
  linkHref,
  openLinkInNewTab = false,
  align = 'center',
  lightColor = '#2c3344',
  darkColor = '#5a6b92',
  onClick,
}) => {
  const getAlignmentClass = () => {
    switch (align) {
      case 'left':
        return 'justify-start';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-center';
    }
  };

  const buttonStyles = {
    backgroundColor: lightColor,
    color: '#FFFFFF',
  } as React.CSSProperties;

  const hoverStyles = {
    '--hover-bg': lightColor === '#2c3344' ? '#565c69' : lightColor,
    '--dark-bg': darkColor,
    '--dark-hover-bg': darkColor === '#5a6b92' ? '#7b89a8' : darkColor,
  } as React.CSSProperties;

  const buttonContent = (
    <span
      className="rounded-full flex items-center gap-2 font-medium text-sm px-3 py-2 h-10 transition-colors hover:opacity-90"
      style={{ ...buttonStyles, ...hoverStyles }}
    >
      {label}
    </span>
  );

  return (
    <div className={`flex my-4 not-prose [&>_img]:!rounded-none ${getAlignmentClass()}`}>
      {linkHref ? (
        <a
          href={linkHref}
          target={openLinkInNewTab ? '_blank' : '_self'}
          rel={openLinkInNewTab ? 'noopener noreferrer' : ''}
          className="inline-block"
        >
          {buttonContent}
        </a>
      ) : (
        <button
          onClick={onClick}
          className="inline-block bg-transparent border-none p-0 cursor-pointer"
        >
          {buttonContent}
        </button>
      )}
    </div>
  );
};

export default Button;
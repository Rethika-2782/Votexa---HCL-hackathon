import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32, showText = true }) => {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div 
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-pulse-teal shadow-md shadow-brand-500/20"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 text-white"
        >
          {/* Distinctive dynamic voice/pulse soundwave */}
          <path
            d="M6 16C6 14.5 7 13.5 8 13.5C9 13.5 10 14.5 10 16V16C10 17.5 9 18.5 8 18.5C7 18.5 6 17.5 6 16Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
          <path
            d="M12 16C12 11 13.5 9 15 9C16.5 9 18 11 18 16V16C18 21 16.5 23 15 23C13.5 23 12 21 12 16Z"
            fill="currentColor"
          />
          <path
            d="M20 16C20 13 21 11.5 22 11.5C23 11.5 24 13 24 16V16C24 19 23 20.5 22 20.5C21 20.5 20 19 20 16Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
          <circle cx="26" cy="7" r="2.5" fill="#14b8a6" className="animate-pulse" />
        </svg>
      </div>

      {showText && (
        <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Votexa<span className="text-pulse-teal font-black">.</span>
        </span>
      )}
    </div>
  );
};

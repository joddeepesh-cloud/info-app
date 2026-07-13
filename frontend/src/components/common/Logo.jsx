import React from "react";

export default function Logo({ size = "large", showText = true }) {
  const isSmall = size === "small";

  return (
    <div className={`flex ${isSmall ? "flex-row items-center gap-2.5" : "flex-col items-center mb-8"}`}>
      
      {/* Abstract Secure Chat Lock Bubble SVG with Cyan/Indigo gradient */}
      <svg 
        className={`${isSmall ? "w-7 h-7" : "w-18 h-18"} filter drop-shadow-md`} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        {/* Lock Shackle */}
        <path 
          d="M32 45V30C32 20.0589 40.0589 12 50 12C59.9411 12 68 20.0589 68 30V45" 
          stroke="url(#logoGradient)" 
          strokeWidth="10" 
          strokeLinecap="round"
        />

        {/* Main Chat Bubble Body */}
        <path 
          d="M15 45C15 39.4772 19.4772 35 25 35H75C80.5228 35 85 39.4772 85 45V75C85 80.5228 80.5228 85 75 85H40L20 95V85H25C19.4772 85 15 80.5228 15 75V45Z" 
          fill="url(#logoGradient)"
        />

        {/* Keyhole indicator inside chat bubble */}
        <circle cx="50" cy="55" r="5" fill="#FFFFFF" />
        <path d="M47 55H53L52 68H48L47 55Z" fill="#FFFFFF" />
      </svg>

      {showText && (
        <div className={isSmall ? "text-left" : "text-center mt-4"}>
          <h1 className={`${isSmall ? "text-sm font-black tracking-tight" : "text-3xl font-black tracking-tight"} text-white`}>
            INFO WORKSPACE
          </h1>
          {!isSmall && (
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Secure Communications Node
            </p>
          )}
        </div>
      )}

    </div>
  );
}
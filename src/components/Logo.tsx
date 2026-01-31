interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} aria-label="MyInvoice">
      {/* Document icon with folded corner + checkmark */}
      <svg
        width="36"
        height="40"
        viewBox="0 0 36 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <filter id="checkShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Document body */}
        <path
          d="M2 4a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v28a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z"
          fill="url(#docGradient)"
        />
        {/* Folded corner */}
        <path
          d="M24 4v8h8L24 4z"
          fill="#2563eb"
          fillOpacity="0.9"
        />
        {/* Text lines */}
        <rect x="6" y="12" width="14" height="2" rx="1" fill="#1e40af" fillOpacity="0.8" />
        <rect x="6" y="18" width="10" height="2" rx="1" fill="#1e40af" fillOpacity="0.6" />
        {/* Green checkmark */}
        <path
          d="M18 26l4 4 10-12"
          stroke="#22c55e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#checkShadow)"
        />
      </svg>
      {/* Brand text: My (blue) + Invoice (dark) */}
      <span className="text-lg font-semibold tracking-tight">
        <span className="text-blue-600">My</span>
        <span className="text-slate-700">Invoice</span>
      </span>
    </div>
  );
}

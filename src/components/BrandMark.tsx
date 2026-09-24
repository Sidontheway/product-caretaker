import type { SVGProps } from "react";

export function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="40" height="40" rx="11" fill="currentColor" />
      <path d="M11 11.5V29L20 24.5L29 29V11.5L20 16L11 11.5Z" fill="white" fillOpacity="0.96" />
      <path d="M20 16V24.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 8.5L21.15 11.1L24 11.5L21.9 13.3L22.45 16L20 14.55L17.55 16L18.1 13.3L16 11.5L18.85 11.1L20 8.5Z" fill="#9DE8D0" />
    </svg>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark className={compact ? "size-8 text-ink" : "size-9 text-ink"} />
      <div className="leading-none">
        <div className="text-[13px] font-semibold font-display">Lexicon</div>
        <div className="text-[11px] text-ink/55">Admin</div>
      </div>
    </div>
  );
}

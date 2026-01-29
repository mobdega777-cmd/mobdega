import * as React from "react";
import { cn } from "@/lib/utils";

interface HookahIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

const HookahIcon = React.forwardRef<SVGSVGElement, HookahIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width={size}
        height={size}
        className={cn("", className)}
        {...props}
      >
        {/* Base do narguile */}
        <ellipse cx="12" cy="20" rx="5" ry="2" />
        {/* Corpo/vaso de vidro */}
        <path d="M9 18c0-3 -2-4 -2-7c0-3 3-5 5-5c2 0 5 2 5 5c0 3 -2 4 -2 7" />
        {/* Haste central */}
        <line x1="12" y1="6" x2="12" y2="3" />
        {/* Fornilho/cabeça (onde vai o carvão) */}
        <rect x="10" y="1" width="4" height="2" rx="0.5" />
        {/* Mangueira */}
        <path d="M17 11c3 0 4 2 4 4c0 2 -1 3 -2 4" />
        {/* Ponteira da mangueira */}
        <circle cx="19" cy="19.5" r="0.75" fill="currentColor" />
        {/* Fumaça estilizada */}
        <path d="M10 0.5c0.5-0.5 1.5-0.5 2 0" strokeWidth="1" opacity="0.5" />
      </svg>
    );
  }
);

HookahIcon.displayName = "HookahIcon";

export { HookahIcon };

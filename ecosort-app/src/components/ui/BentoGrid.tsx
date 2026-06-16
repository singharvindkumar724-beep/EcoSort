"use client";

import { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BentoGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  gap?: number;
  className?: string;
}

interface BentoCardProps {
  children: ReactNode;
  span?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  variant?: "glass" | "solid" | "accent" | "outlined";
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

// ─── BentoGrid Container ──────────────────────────────────────────────────────

export function BentoGrid({
  children,
  columns = 3,
  gap = 16,
  className = "",
}: BentoGridProps) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        width: "100%",
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .bento-root-${columns} {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .bento-root-${columns} {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 900px) {
          .bento-span-2, .bento-span-3 {
            grid-column: span 1 !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}

// ─── BentoCard ────────────────────────────────────────────────────────────────

const variantStyles: Record<NonNullable<BentoCardProps["variant"]>, React.CSSProperties> = {
  glass: {
    background: "var(--eco-glass)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid var(--eco-border)",
    boxShadow:
      "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.4)",
  },
  solid: {
    background: "var(--eco-surface)",
    border: "1px solid var(--eco-border)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  },
  accent: {
    background: "var(--eco-structure)",
    border: "none",
    boxShadow: "0 8px 32px rgba(26,48,32,0.25)",
    color: "var(--eco-bg)",
  },
  outlined: {
    background: "transparent",
    border: "1.5px solid var(--eco-border)",
    boxShadow: "none",
  },
};

export function BentoCard({
  children,
  span = 1,
  rowSpan = 1,
  variant = "glass",
  className = "",
  style = {},
  id,
}: BentoCardProps) {
  const spanClass = span > 1 ? `bento-span-${span}` : "";

  return (
    <div
      id={id}
      className={`${spanClass} ${className}`}
      style={{
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        gridColumn: `span ${span}`,
        gridRow: `span ${rowSpan}`,
        transition:
          "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms ease",
        overflow: "hidden",
        position: "relative",
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

import React from "react";

const UI_FONT = "font-[family-name:var(--font-geist)]";

interface GlossyPillProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  newTab?: boolean;
  size?: "sm" | "md";
}

export const GlossyPill: React.FC<GlossyPillProps> = ({
  href,
  icon,
  label,
  newTab,
  size = "md",
}) => {
  const sizeClasses = size === "sm" 
    ? "px-4 py-2 text-xs" 
    : "px-5 py-2.5 text-sm";

  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className={`glossy-pill inline-flex items-center gap-2 rounded-full bg-[#FAFAF8] text-[#1a1a1a] transition-all border border-[#e8e7e0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${UI_FONT} ${sizeClasses}`}
    >
      {icon}
      {label}
    </a>
  );
};

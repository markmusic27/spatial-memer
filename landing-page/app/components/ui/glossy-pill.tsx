import React from "react";

const UI_FONT = "font-[family-name:var(--font-geist)]";

interface GlossyPillProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  mobileLabel?: string;
  newTab?: boolean;
  size?: "sm" | "md";
  hideOnMobile?: boolean;
}

export const GlossyPill: React.FC<GlossyPillProps> = ({
  href,
  icon,
  label,
  mobileLabel,
  newTab,
  size = "md",
  hideOnMobile = false,
}) => {
  const sizeClasses = size === "sm" 
    ? "px-4 py-2 text-xs" 
    : "px-[18px] py-[9px] text-[14px]";

  const displayClass = hideOnMobile 
    ? "hidden md:inline-flex" 
    : "inline-flex";

  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className={`glossy-pill ${displayClass} items-center gap-2 rounded-full bg-[#FAFAF8] text-[#1a1a1a] transition-all border border-[#e8e7e0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${UI_FONT} ${sizeClasses}`}
    >
      {icon}
      {mobileLabel ? (
        <>
          <span className="md:hidden">{mobileLabel}</span>
          <span className="hidden md:inline">{label}</span>
        </>
      ) : (
        label
      )}
    </a>
  );
};

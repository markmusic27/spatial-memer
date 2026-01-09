import React from "react";

interface SectionHeadingProps {
  icon?: React.ReactNode;
  title: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ icon, title }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {icon && <span className="text-[#1a1a1a]">{icon}</span>}
      <h2 className="text-3xl font-medium text-[#1a1a1a] text-center">{title}</h2>
    </div>
  );
};

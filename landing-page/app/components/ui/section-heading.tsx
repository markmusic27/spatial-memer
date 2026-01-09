import React from "react";

interface SectionHeadingProps {
  icon?: React.ReactNode;
  title: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      <h2 className="text-3xl font-medium text-[#1a1a1a] text-center">{title}</h2>
    </div>
  );
};

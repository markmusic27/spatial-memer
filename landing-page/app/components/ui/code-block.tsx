import React from "react";

interface CodeBlockProps {
  children: string;
  centered?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, centered = false }) => {
  return (
    <pre
      className={`overflow-x-auto p-5 bg-[#FAFAF8] border border-[#e8e7e0] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] rounded-lg font-mono text-sm leading-relaxed text-[#1a1a1a] ${
        centered ? "text-center" : ""
      }`}
    >
      <code>{children}</code>
    </pre>
  );
};

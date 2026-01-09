import React from "react";

interface CodeBlockProps {
  children: string;
  centered?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, centered = false }) => {
  return (
    <pre
      className={`overflow-x-auto p-5 rounded-lg font-mono text-sm leading-relaxed ${
        centered ? "text-center" : ""
      }`}
      style={{
        background: "#F5F0E8",
        color: "#443221",
        border: "1px solid #EAE0DA",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0)",
      }}
    >
      <code>{children}</code>
    </pre>
  );
};

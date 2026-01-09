"use client";

import React from "react";
import { GlossyPill } from "./ui";
import { GithubIcon, DocsIcon, PaperIcon, PlayCircleIcon } from "./icons";

export type ActionLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  newTab?: boolean;
};

export const actionLinks: ActionLink[] = [
  {
    href: "https://github.com/markmusic27/spatial-memer",
    label: "Code",
    newTab: true,
    icon: <GithubIcon />,
  },
  {
    href: "#data-collection",
    label: "Data Collection",
    icon: <DocsIcon />,
  },
  {
    href: "#implementation",
    label: "Implement with MemER",
    icon: <PaperIcon />,
  },
  {
    href: "#demo",
    label: "Demo",
    icon: <PlayCircleIcon />,
  },
];

interface StickyNavProps {
  isVisible: boolean;
}

export const StickyNav: React.FC<StickyNavProps> = ({ isVisible }) => {
  return (
    <nav className={`sticky-nav ${isVisible ? "is-visible" : ""}`}>
      <div className="max-w-3xl mx-auto px-6">
        <div 
          className="sticky-nav-surface"
          style={{
            WebkitBackdropFilter: 'saturate(180%) blur(10px)',
            backdropFilter: 'saturate(180%) blur(10px)',
          }}
        >
          <div className="flex flex-wrap justify-center gap-3 px-3 py-2">
            {actionLinks.map((link) => (
              <GlossyPill
                key={link.label}
                href={link.href}
                icon={link.icon}
                label={link.label}
                newTab={link.newTab}
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

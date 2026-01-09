import React from "react";
import { GithubIcon, LinkIcon, LinkedInIcon } from "./icons";

const UI_FONT = "font-[family-name:var(--font-geist)]";

interface SocialLink {
  href: string;
  icon: React.ReactNode;
}

interface AuthorCardProps {
  name: string;
  imageUrl: string;
  linkedInUrl: string;
  school: string;
  schoolLogo: string;
  schoolYear: string;
  major: string;
  websiteUrl?: string;
  githubUrl?: string;
}

export const AuthorCard: React.FC<AuthorCardProps> = ({
  name,
  imageUrl,
  linkedInUrl,
  school,
  schoolLogo,
  schoolYear,
  major,
  websiteUrl,
  githubUrl,
}) => {
  const socialLinks: SocialLink[] = [];
  
  if (websiteUrl) {
    socialLinks.push({ href: websiteUrl, icon: <LinkIcon /> });
  }
  if (githubUrl) {
    socialLinks.push({ href: githubUrl, icon: <GithubIcon className="h-4 w-4" /> });
  }
  socialLinks.push({ href: linkedInUrl, icon: <LinkedInIcon /> });

  return (
    <div
      className={`glossy-card group w-[162px] sm:w-[180px] rounded-2xl bg-[#FAFAF8] border border-[#e3e1d6] shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${UI_FONT} transition-transform`}
    >
      <a
        href={githubUrl || linkedInUrl}
        target="_blank"
        rel="noreferrer"
        className="block px-4 pt-4 pb-3 text-center"
      >
        <img
          src={imageUrl}
          alt={name}
          className="mx-auto mb-2 h-10 w-10 rounded-full object-cover border border-[#d8d6cb] bg-[#fafaf8] transition-transform duration-300 group-hover:scale-105"
        />
        <div className="text-[#1a1a1a] text-sm font-medium tracking-wide">
          {name}
        </div>
        <div className="mt-2 flex flex-col items-center gap-1 text-xs text-[#6a6a6a]">
          <div className={`inline-flex items-center ${school === "Stanford" ? "gap-[10px]" : "gap-[2px]"}`}>
            <img
              src={schoolLogo}
              alt={`${school} logo`}
              className={`object-contain ${school === "Stanford" ? "h-[16px]" : "h-[14px]"}`}
            />
            <span>
              {school} &apos;{schoolYear}
            </span>
          </div>
          <span className="text-xs text-[#7a7a7a]">{major}</span>
        </div>
      </a>
      <div className="flex justify-center gap-3 pb-3 text-[#7a7a7a]">
        {socialLinks.map((link, index) => (
          <a
            key={index}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#1a1a1a] transition-colors"
          >
            {link.icon}
          </a>
        ))}
      </div>
    </div>
  );
};

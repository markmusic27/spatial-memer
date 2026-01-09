import React from "react";

const UI_FONT = "font-[family-name:var(--font-geist)]";

interface GlossyCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlossyCard: React.FC<GlossyCardProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`glossy-card bg-[#FAFAF8] border border-[#e8e7e0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${UI_FONT} rounded-lg ${className}`}
    >
      {children}
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="glossy-card bg-[#FAFAF8] border border-[#e8e7e0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] rounded-lg p-5 font-[family-name:var(--font-eb-garamond)]">
      <div className="flex items-start gap-3 mb-2">
        <span className="mt-0.5 shrink-0 text-[#1a1a1a]">{icon}</span>
        <h3 className="text-base font-medium text-[#1a1a1a]">{title}</h3>
      </div>
      <p className="text-sm text-[#4a4a4a] font-light leading-relaxed ml-8">
        {description}
      </p>
    </div>
  );
};

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({ icon, title, children }) => {
  return (
    <div className="glossy-card bg-[#FAFAF8] border border-[#e8e7e0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] rounded-lg p-5 font-[family-name:var(--font-eb-garamond)]">
      <div className="flex items-start gap-3 mb-3">
        <span className="mt-0.5 shrink-0 text-[#1a1a1a]">{icon}</span>
        <div>
          <h3 className="text-xl font-medium mb-2 text-[#1a1a1a]">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
};

interface UseCaseCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const UseCaseCard: React.FC<UseCaseCardProps> = ({ icon, title, description }) => {
  return (
    <div className="glossy-card bg-[#FAFAF8] border border-[#e8e7e0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] rounded-lg p-5 font-[family-name:var(--font-eb-garamond)]">
      <div className="flex items-start gap-3 mb-2">
        <span className="mt-0.5 shrink-0 text-[#1a1a1a]">{icon}</span>
        <div>
          <h3 className="text-base font-medium text-[#1a1a1a]">{title}</h3>
          <p className="text-sm text-[#4a4a4a] font-light leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

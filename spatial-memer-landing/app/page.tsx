"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

type ActionLink = {
  href: string;
  label: string;
  icon: JSX.Element;
  newTab?: boolean;
};

const actionLinks: ActionLink[] = [
  {
    href: "https://github.com/markmusic27/spatial-memer",
    label: "Code",
    newTab: true,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    href: "https://github.com/markmusic27/spatial-memer/tree/main/docs",
    label: "Docs",
    newTab: true,
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Paper (Soon)",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    href: "#demo",
    label: "Demo",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export default function Home() {
  const [showStickyNav, setShowStickyNav] = useState(false);
  const linkRowRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const updateStickyNav = () => {
      if (!linkRowRef.current) {
        return;
      }
      const { bottom } = linkRowRef.current.getBoundingClientRect();
      setShowStickyNav(bottom <= 0);
    };

    updateStickyNav();
    window.addEventListener("scroll", updateStickyNav, { passive: true });
    window.addEventListener("resize", updateStickyNav);
    return () => {
      window.removeEventListener("scroll", updateStickyNav);
      window.removeEventListener("resize", updateStickyNav);
    };
  }, []);

  const formatTime = (timeSeconds: number) => {
    if (!Number.isFinite(timeSeconds)) {
      return "0:00";
    }
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = Math.floor(timeSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) {
      return;
    }
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) {
      return;
    }
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) {
      return;
    }
    const nextTime = Number(event.target.value);
    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const handleFullscreen = () => {
    if (!videoRef.current) {
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className={`sticky-nav ${showStickyNav ? "is-visible" : ""}`}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="sticky-nav-surface">
            <div className="flex flex-wrap justify-center gap-3 px-3 py-2">
              {actionLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.newTab ? "_blank" : undefined}
                  rel={link.newTab ? "noreferrer" : undefined}
                  className="glossy-pill inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAFAF8] text-[#1a1a1a] text-xs shadow-[2px_2px_5px_rgba(0,0,0,0.08),-2px_-2px_5px_rgba(255,255,255,0.7)]"
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section data-reveal className="pt-16 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-medium mb-4 text-[#1a1a1a] tracking-tight leading-[1.1]">
            Spatial-MemER
          </h1>
          <h2 className="text-2xl md:text-3xl font-light mb-6 text-[#4a4a4a] leading-[1.3]">
            Spatial Memory for Embodied Robots
          </h2>
          <p className="text-lg md:text-xl text-[#2a2a2a] mb-4 leading-relaxed font-light">
            Adding spatial awareness to vision-language robot policies through
            egocentric mapping and forward kinematics.
          </p>
          <p className="text-base text-[#6a6a6a] mb-8 italic">
            Extending{" "}
            <a
              href="https://jen-pan.github.io/memer/"
              className="text-[#1a1a1a] underline hover:text-[#4a4a4a] transition-colors"
            >
              MemER: Memory-Enhanced Robot Policies
            </a>
          </p>

          {/* Authors */}
          <div className="flex flex-wrap justify-center gap-5 mb-8 text-base">
            <div className="glossy-card group w-[180px] rounded-2xl bg-[#FAFAF8] border border-[#e3e1d6] shadow-[2px_2px_6px_rgba(0,0,0,0.08),-2px_-2px_6px_rgba(255,255,255,0.7)] transition-transform">
              <a
                href="https://www.linkedin.com/in/markmusic27/"
                target="_blank"
                rel="noreferrer"
                className="block px-4 pt-4 pb-3 text-center"
              >
                <img
                  src="https://markmusic.notion.site/image/attachment%3Aa0fd4fee-5d6a-4c90-b9e0-b69387933ebd%3AFrame_2.png?id=1ceb37de-b65d-801a-ac5c-d1c7314f1a35&table=block&spaceId=1836a043-9d61-47b3-af19-484cf61d0f91&width=250&userId=&cache=v2"
                  alt="Mark Music"
                  className="mx-auto mb-2 h-10 w-10 rounded-full object-cover border border-[#d8d6cb] bg-[#fafaf8] transition-transform duration-300 group-hover:scale-105"
                />
                <div className="text-[#1a1a1a] text-xs font-medium tracking-wide">
                  Mark Music
                </div>
                <div className="mt-2 flex flex-col items-center gap-1 text-[11px] text-[#6a6a6a]">
                  <div className="inline-flex items-center gap-2">
                    <img
                      src="/stanfordlogo.jpg"
                      alt="Stanford logo"
                      className="h-4 w-4 rounded-full border border-[#d8d6cb] bg-[#fafaf8] p-0.5 object-contain"
                    />
                    <span>Stanford &apos;28</span>
                  </div>
                  <span className="text-[11px] text-[#7a7a7a]">CS + Math</span>
                </div>
              </a>
              <div className="flex justify-center gap-3 pb-3 text-[#7a7a7a]">
                <a
                  href="https://markmusic.io"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#1a1a1a] transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.5 2.5-6.5 0-9m0 9c-2.5-2.5-2.5-6.5 0-9m-7.5 4.5h15" />
                  </svg>
                </a>
                <a
                  href="https://github.com/markmusic27"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#1a1a1a] transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/markmusic27/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#1a1a1a] transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.98 3.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM3 8.98h3.96V21H3V8.98zM9.5 8.98h3.8v1.64h.05c.53-1 1.84-2.05 3.8-2.05 4.07 0 4.82 2.68 4.82 6.16V21h-3.96v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9.5V8.98z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="glossy-card group w-[180px] rounded-2xl bg-[#FAFAF8] border border-[#e3e1d6] shadow-[2px_2px_6px_rgba(0,0,0,0.08),-2px_-2px_6px_rgba(255,255,255,0.7)] transition-transform">
              <a
                href="https://www.linkedin.com/in/filippo-fonseca/"
                target="_blank"
                rel="noreferrer"
                className="block px-4 pt-4 pb-3 text-center"
              >
                <img
                  src="https://media.licdn.com/dms/image/v2/D4E03AQEH1X4IRGyrFg/profile-displayphoto-scale_400_400/B4EZkh595hGYAg-/0/1757210469401?e=1769040000&v=beta&t=3ccs1IKb0FroocoUoj0fw-G53q4pp12148kShhGlH90"
                  alt="Filippo Fonseca"
                  className="mx-auto mb-2 h-10 w-10 rounded-full object-cover border border-[#d8d6cb] bg-[#fafaf8] transition-transform duration-300 group-hover:scale-105"
                />
                <div className="text-[#1a1a1a] text-xs font-medium tracking-wide">
                  Filippo Fonseca
                </div>
                <div className="mt-2 flex flex-col items-center gap-1 text-[11px] text-[#6a6a6a]">
                  <div className="inline-flex items-center gap-2">
                    <img
                      src="/yalelogo.png"
                      alt="Yale logo"
                      className="h-4 w-4 rounded-full border border-[#d8d6cb] bg-[#fafaf8] p-0.5 object-contain"
                    />
                    <span>Yale &apos;28</span>
                  </div>
                  <span className="text-[11px] text-[#7a7a7a]">
                    MechE (ABET) + EECS
                  </span>
                </div>
              </a>
              <div className="flex justify-center gap-3 pb-3 text-[#7a7a7a]">
                <a
                  href="https://filippofonseca.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#1a1a1a] transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.5 2.5-6.5 0-9m0 9c-2.5-2.5-2.5-6.5 0-9m-7.5 4.5h15" />
                  </svg>
                </a>
                <a
                  href="https://github.com/filippo-fonseca"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#1a1a1a] transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/filippo-fonseca/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#1a1a1a] transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.98 3.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM3 8.98h3.96V21H3V8.98zM9.5 8.98h3.8v1.64h.05c.53-1 1.84-2.05 3.8-2.05 4.07 0 4.82 2.68 4.82 6.16V21h-3.96v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9.5V8.98z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div ref={linkRowRef} className="flex flex-wrap justify-center gap-3">
            {actionLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.newTab ? "_blank" : undefined}
                rel={link.newTab ? "noreferrer" : undefined}
                className="glossy-pill inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FAFAF8] text-[#1a1a1a] transition-all text-sm shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)]"
              >
                {link.icon}
                {link.label}
              </a>
            ))}
          </div>

          {/* Cover Image */}
          <div className="mt-10">
            <div className="glossy-card relative overflow-hidden rounded-2xl bg-[#F1F0EA] border border-[#e3e1d6] shadow-[inset_2px_2px_8px_rgba(0,0,0,0.08),inset_-2px_-2px_8px_rgba(255,255,255,0.7),2px_2px_8px_rgba(0,0,0,0.08)]">
              <img
                src="/cover.png"
                alt="Spatial-MemER cover"
                className="w-full aspect-[16/9] object-contain bg-[#F1F0EA]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="video-shell">
            <video
              ref={videoRef}
              className="video-frame"
              src="/demo.mp4"
              playsInline
              onClick={togglePlay}
              onTimeUpdate={(event) =>
                setCurrentTime(event.currentTarget.currentTime)
              }
              onLoadedMetadata={(event) =>
                setDuration(event.currentTarget.duration)
              }
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="video-controls">
              <button
                type="button"
                className="video-icon-button"
                onClick={togglePlay}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <span className="video-time">{formatTime(currentTime)}</span>
              <input
                className="video-range"
                type="range"
                min={0}
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                style={{
                  background: `linear-gradient(90deg, var(--highlight-yellow) ${progressPercent}%, rgba(214, 212, 202, 0.7) ${progressPercent}%)`,
                }}
              />
              <span className="video-time">{formatTime(duration)}</span>
              <button
                type="button"
                className="video-icon-button"
                onClick={toggleMute}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
              <button
                type="button"
                className="video-icon-button"
                onClick={handleFullscreen}
              >
                ⛶
              </button>
            </div>
          </div>
          <p className="text-center text-[#4a4a4a] text-base font-light max-w-2xl mx-auto leading-relaxed">
            Spatial-MemER enables robots to maintain spatial awareness of where
            they observed objects in 3D space, not just what they saw.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 my-8">
        <div className="border-t border-[#d4d3cb]"></div>
      </div>

      {/* Overview Section */}
      <section data-reveal className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-medium mb-6 text-[#1a1a1a] text-center">
            Overview
          </h2>
          <p className="text-lg text-[#2a2a2a] mb-8 leading-relaxed font-light text-center">
            Spatial-MemER extends vision-language robot policies (like MemER,
            RT-2) with explicit spatial reasoning. By maintaining an egocentric
            bird&apos;s-eye view map of keyframe observations, robots can
            understand <strong className="font-medium">WHERE</strong> they
            observed objects in 3D space, not just{" "}
            <strong className="font-medium">WHAT</strong> they saw.
          </p>

          {/* Key Features */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                <h3 className="text-base font-medium text-[#1a1a1a]">
                  Three-line integration
                </h3>
              </div>
              <p className="text-sm text-[#4a4a4a] font-light leading-relaxed ml-8">
                Add spatial awareness to any robot policy with minimal code
                changes
              </p>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h3 className="text-base font-medium text-[#1a1a1a]">
                  Precise localization
                </h3>
              </div>
              <p className="text-sm text-[#4a4a4a] font-light leading-relaxed ml-8">
                Forward kinematics-based pose estimation (no SLAM needed)
              </p>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <h3 className="text-base font-medium text-[#1a1a1a]">
                  Egocentric maps
                </h3>
              </div>
              <p className="text-sm text-[#4a4a4a] font-light leading-relaxed ml-8">
                Auto-generated BEV visualizations showing robot + keyframe
                locations
              </p>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                <h3 className="text-base font-medium text-[#1a1a1a]">
                  Visual correspondence
                </h3>
              </div>
              <p className="text-sm text-[#4a4a4a] font-light leading-relaxed ml-8">
                Color-coded watermarks link keyframe images to map positions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 my-8">
        <div className="border-t border-[#d4d3cb]"></div>
      </div>

      {/* Why Section */}
      <section data-reveal className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-medium mb-8 text-[#1a1a1a] text-center">
            Why Spatial-MemER?
          </h2>
          <div className="space-y-8">
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <svg
                  className="w-6 h-6 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="text-xl font-medium mb-2 text-[#1a1a1a]">
                    Problem
                  </h3>
                  <p className="text-base text-[#2a2a2a] leading-relaxed font-light">
                    Existing vision-language policies like MemER lack spatial
                    understanding. They see sequential images but don&apos;t
                    know WHERE observations occurred in space.
                  </p>
                </div>
              </div>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <svg
                  className="w-6 h-6 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <div>
                  <h3 className="text-xl font-medium mb-2 text-[#1a1a1a]">
                    Solution
                  </h3>
                  <ul className="space-y-2 text-base text-[#2a2a2a] font-light leading-relaxed">
                    <li>• Spatial map showing robot + keyframe locations</li>
                    <li>• Watermarked keyframes color-coded to map markers</li>
                    <li>• Pose tracking using forward kinematics</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <svg
                  className="w-6 h-6 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <div>
                  <h3 className="text-xl font-medium mb-2 text-[#1a1a1a]">
                    Impact
                  </h3>
                  <p className="text-base text-[#2a2a2a] leading-relaxed font-light">
                    Enables spatial reasoning tasks like &quot;Go back to where
                    you saw the cup&quot; and &quot;Move to the left of the red
                    block&quot;.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 my-8">
        <div className="border-t border-[#d4d3cb]"></div>
      </div>

      {/* Quick Start Code */}
      <section data-reveal className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <svg
              className="w-7 h-7 text-[#1a1a1a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h2 className="text-3xl font-medium text-[#1a1a1a] text-center">
              Quick Start
            </h2>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
              Installation
            </h3>
            <pre className="overflow-x-auto p-5 bg-[#FAFAF8] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg font-mono text-sm leading-relaxed text-[#1a1a1a]">
              <code>{`# Install dependencies
uv sync

# For mobile robots - install DPVO for visual odometry
./scripts/setup_dpvo.sh`}</code>
            </pre>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
              Basic Usage
            </h3>
            <pre className="overflow-x-auto p-5 bg-[#FAFAF8] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg font-mono text-sm leading-relaxed text-[#1a1a1a]">
              <code>{`from spatial_context import SpatialContext

# Initialize
ctx = SpatialContext()

# In your robot policy loop (1 Hz)
robot_joint_angles = robot.get_joint_angles()  # 7-DOF

# 1. Add current frame
frame_id = ctx.add_frame(robot_joint_angles)

# 2. Generate spatial map
map_image, colors = ctx.generate_map()

# 3. Promote important frames to keyframes
ctx.promote_to_keyframe(frame_id)

# Feed map_image + keyframes to your VLM!`}</code>
            </pre>
          </div>

          <p className="text-center text-lg font-light text-[#2a2a2a] italic">
            That&apos;s it! Your policy now has spatial awareness.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 my-8">
        <div className="border-t border-[#d4d3cb]"></div>
      </div>

      {/* Architecture */}
      <section data-reveal className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <svg
              className="w-7 h-7 text-[#1a1a1a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h2 className="text-3xl font-medium text-[#1a1a1a] text-center">
              Architecture
            </h2>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
              For Stationary Robots
            </h3>
            <p className="text-base text-[#4a4a4a] mb-4 font-light leading-relaxed">
              Robots clamped to a table with precise actuators:
            </p>
            <div className="bg-[#FAFAF8] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg p-6 mb-3">
              <pre className="text-center font-mono text-sm overflow-x-auto text-[#2a2a2a] leading-relaxed">
                <code>{`Joint Angles → Forward Kinematics → Camera Pose → Spatial Map
    (7-DOF)         (SE(3) 4×4)        (World)      (Egocentric BEV)`}</code>
              </pre>
            </div>
            <p className="text-sm text-[#6a6a6a] italic font-light leading-relaxed">
              Why no SLAM? Precise actuators + stationary base = forward
              kinematics provides exact pose.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
              For Mobile Robots
            </h3>
            <p className="text-base text-[#4a4a4a] mb-4 font-light leading-relaxed">
              Robots with moving bases:
            </p>
            <div className="bg-[#FAFAF8] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg p-6">
              <pre className="text-center font-mono text-sm overflow-x-auto text-[#2a2a2a] leading-relaxed">
                <code>{`RGB Frames → DPVO (Deep Patch Visual Odometry) → Robot Pose (World) + FK → Spatial Map`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 my-8">
        <div className="border-t border-[#d4d3cb]"></div>
      </div>

      {/* More Code Examples */}
      <section data-reveal className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <svg
              className="w-7 h-7 text-[#1a1a1a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <h2 className="text-3xl font-medium text-[#1a1a1a] text-center">
              Code Examples
            </h2>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
              Stationary Robot Example
            </h3>
            <pre className="overflow-x-auto p-5 bg-[#FAFAF8] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg font-mono text-sm leading-relaxed text-[#1a1a1a]">
              <code>{`from spatial_context import SpatialContext
import numpy as np

# Initialize spatial memory
ctx = SpatialContext()

# Simulate robot motion
for timestep in range(50):
    # Get robot state (joint angles in radians)
    joint_angles = robot.get_joint_angles()  # 7-element array

    # Add frame (computes pose via forward kinematics)
    frame_id = ctx.add_frame(joint_angles)

    # Promote every 10th frame to keyframe
    if timestep % 10 == 0:
        ctx.promote_to_keyframe(frame_id)

# Generate map
map_image, keyframe_colors = ctx.generate_map()

# Show map
import cv2
cv2.imshow("Spatial Map", map_image)
cv2.waitKey(0)`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
              Integration with MemER
            </h3>
            <pre className="overflow-x-auto p-5 bg-[#FAFAF8] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg font-mono text-sm leading-relaxed text-[#1a1a1a]">
              <code>{`# Existing MemER loop (simplified)
for timestep in episode:
    observation = env.get_observation()
    action = policy(observation, memory)

    # === ADD: Spatial-MemER (3 lines) ===
    frame_id = spatial_ctx.add_frame(robot.joint_angles)
    map_image, colors = spatial_ctx.generate_map()
    watermarked_obs = spatial_ctx.watermark_keyframes([observation], colors)
    # === END ===

    # Policy now receives spatially-enhanced observations
    action = policy(watermarked_obs, map_image, memory)`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 my-8">
        <div className="border-t border-[#d4d3cb]"></div>
      </div>

      {/* Use Cases */}
      <section data-reveal className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <svg
              className="w-7 h-7 text-[#1a1a1a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <h2 className="text-3xl font-medium text-[#1a1a1a] text-center">
              Use Cases
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-base font-medium text-[#1a1a1a]">
                    Long-horizon manipulation
                  </h3>
                  <p className="text-sm text-[#4a4a4a] font-light leading-relaxed">
                    Track object locations across multi-step tasks
                  </p>
                </div>
              </div>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-base font-medium text-[#1a1a1a]">
                    Spatial search
                  </h3>
                  <p className="text-sm text-[#4a4a4a] font-light leading-relaxed">
                    &quot;Find the blue ball&quot; (avoid re-searching)
                  </p>
                </div>
              </div>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-base font-medium text-[#1a1a1a]">
                    Navigation
                  </h3>
                  <p className="text-sm text-[#4a4a4a] font-light leading-relaxed">
                    &quot;Return to the start position&quot;
                  </p>
                </div>
              </div>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
                <div>
                  <h3 className="text-base font-medium text-[#1a1a1a]">
                    Geometric reasoning
                  </h3>
                  <p className="text-sm text-[#4a4a4a] font-light leading-relaxed">
                    &quot;Place object between A and B&quot;
                  </p>
                </div>
              </div>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-base font-medium text-[#1a1a1a]">
                    Temporal tracking
                  </h3>
                  <p className="text-sm text-[#4a4a4a] font-light leading-relaxed">
                    &quot;Show me where the cup was 30 seconds ago&quot;
                  </p>
                </div>
              </div>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1a1a1a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <div>
                  <h3 className="text-base font-medium text-[#1a1a1a]">
                    Occluded retrieval
                  </h3>
                  <p className="text-sm text-[#4a4a4a] font-light leading-relaxed">
                    Get objects out of current view using spatial memory
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 my-8">
        <div className="border-t border-[#d4d3cb]"></div>
      </div>

      {/* Testing & Validation */}
      <section data-reveal className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <svg
              className="w-7 h-7 text-[#1a1a1a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-3xl font-medium text-[#1a1a1a] text-center">
              Testing & Validation
            </h2>
          </div>

          <p className="text-lg text-[#2a2a2a] mb-6 leading-relaxed font-light text-center">
            We evaluate Spatial-MemER across controlled table-top setups and
            longer-horizon tasks that stress spatial recall, landmark re-finding,
            and geometric reasoning. Our goal is to make spatial memory tests as
            repeatable as classic manipulation benchmarks.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <h3 className="text-base font-medium text-[#1a1a1a] mb-2">
                Spatial Recall
              </h3>
              <p className="text-sm text-[#4a4a4a] font-light leading-relaxed">
                Return-to-location tasks and occluded object retrieval to
                measure memory persistence and drift.
              </p>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <h3 className="text-base font-medium text-[#1a1a1a] mb-2">
                Map Consistency
              </h3>
              <p className="text-sm text-[#4a4a4a] font-light leading-relaxed">
                Keyframe-map alignment checks and inter-keyframe distance
                stability under repeated viewpoints.
              </p>
            </div>
            <div className="glossy-card p-5 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
              <h3 className="text-base font-medium text-[#1a1a1a] mb-2">
                Policy Impact
              </h3>
              <p className="text-sm text-[#4a4a4a] font-light leading-relaxed">
                Task success and sample efficiency comparisons vs. baselines
                without spatial memory augmentation.
              </p>
            </div>
          </div>

          <div className="glossy-card p-6 bg-[#FAFAF8] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg">
            <h3 className="text-xl font-medium text-[#1a1a1a] mb-3 text-center">
              A Call for Benchmarking
            </h3>
            <p className="text-base text-[#2a2a2a] font-light leading-relaxed text-center">
              Spatial memory needs standardized, community-driven benchmarks.
              We propose suites spanning tabletop manipulation, navigation, and
              long-horizon rearrangement with shared metrics for localization
              drift, revisit accuracy, and memory decay. A concerted effort will
              make results comparable across labs and accelerate reliable
              embodied AI.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 my-8">
        <div className="border-t border-[#d4d3cb]"></div>
      </div>

      {/* BibTeX Citation */}
      <section data-reveal className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <svg
              className="w-7 h-7 text-[#1a1a1a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            <h2 className="text-3xl font-medium text-[#1a1a1a] text-center">
              Citation
            </h2>
          </div>
          <div className="mb-8">
            <p className="text-base text-[#2a2a2a] mb-4 font-light leading-relaxed">
              If you use Spatial-MemER in your research, please cite:
            </p>
            <pre className="overflow-x-auto p-5 bg-[#FAFAF8] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg font-mono text-sm leading-relaxed text-[#1a1a1a]">
              <code>{`@software{spatial_memer_2026,
  title = {Spatial-MemER: Spatial Memory for Embodied Robots},
  author = {Music, Mark and Fonseca, Filippo},
  year = {2026},
  url = {https://github.com/yourusername/spatial-memer}
}`}</code>
            </pre>
          </div>

          <div>
            <p className="text-base text-[#2a2a2a] mb-4 font-light leading-relaxed">
              This work extends{" "}
              <a
                href="https://jen-pan.github.io/memer/"
                className="text-[#1a1a1a] underline hover:text-[#4a4a4a] transition-colors"
              >
                MemER: Memory-Enhanced Robot Policies
              </a>
              :
            </p>
            <pre className="overflow-x-auto p-5 bg-[#FAFAF8] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] rounded-lg font-mono text-sm leading-relaxed text-[#1a1a1a]">
              <code>{`@article{sridhar2024memer,
  title = {MemER: Memory-Enhanced Robot Policies},
  author = {Sridhar, Ajay and Pan, Jennifer and Sharma, Satvik and Finn, Chelsea},
  year = {2024}
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 my-8">
        <div className="border-t border-[#d4d3cb]"></div>
      </div>

      {/* Footer */}
      <footer data-reveal className="py-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-5 text-[#1a1a1a]">
              Contact us.
            </h3>
            <p className="text-base text-[#2a2a2a] mb-4 font-light leading-relaxed">
              We're always down for a chat about our ideas, future iterations,
              or collaboration.
            </p>
            <div className="space-y-2 text-base">
              <div>
                <a
                  href="mailto:mmusic@stanford.edu"
                  className="text-[#1a1a1a] hover:text-[#4a4a4a] transition-colors border-b border-[#1a1a1a]"
                >
                  mmusic@stanford.edu
                </a>{" "}
                ·{" "}
                <a
                  href="https://markmusic.io"
                  className="text-[#1a1a1a] hover:text-[#4a4a4a] transition-colors border-b border-[#1a1a1a]"
                >
                  markmusic.io
                </a>
              </div>
              <div>
                <a
                  href="mailto:filippo.fonseca@yale.edu"
                  className="text-[#1a1a1a] hover:text-[#4a4a4a] transition-colors border-b border-[#1a1a1a]"
                >
                  filippo.fonseca@yale.edu
                </a>{" "}
                ·{" "}
                <a
                  href="https://filippofonseca.com"
                  className="text-[#1a1a1a] hover:text-[#4a4a4a] transition-colors border-b border-[#1a1a1a]"
                >
                  filippofonseca.com
                </a>
              </div>
            </div>
          </div>

          <div className="text-sm text-[#6a6a6a] space-y-2 font-light leading-relaxed">
            <p>
              This project builds on the MemER framework by Ajay Sridhar,
              Jennifer Pan, Satvik Sharma, and Chelsea Finn at Stanford.
            </p>
            <p>
              Apache 2.0 License · Made with ❤️ in Costa Rica 🇨🇷 for the
              physical AI research community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

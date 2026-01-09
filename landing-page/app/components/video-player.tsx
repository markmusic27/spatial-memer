"use client";

import React, { useRef, useState, useEffect, type ChangeEvent } from "react";

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      setIsFullscreen(!!fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
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

    const doc = document as unknown as {
      fullscreenElement?: Element;
      webkitFullscreenElement?: Element;
      exitFullscreen?: () => Promise<void>;
      webkitExitFullscreen?: () => void;
    };

    const video = videoRef.current as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
      webkitRequestFullscreen?: () => Promise<void>;
    };

    const isCurrentlyFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement;

    if (isCurrentlyFullscreen) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    } else {
      // Try standard API first
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } 
      // iOS Safari - video element specific method
      else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
      // Older webkit browsers
      else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      }
    }
  };

  return (
    <div className="video-shell">
      <video
        ref={videoRef}
        className="video-frame"
        src={src}
        playsInline
        autoPlay
        loop
        muted
        onClick={togglePlay}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <div className="video-controls font-(family-name:--font-geist-mono)">
        <button
          type="button"
          className={`video-icon-button ${!isPlaying ? "play-button" : ""}`}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.837891 10.0078C0.28125 10.0078 0 9.7207 0 9.16406V0.837891C0 0.287109 0.287109 0 0.837891 0H2.20898C2.76562 0 3.04688 0.269531 3.04688 0.837891V9.16406C3.04688 9.7207 2.76562 10.0078 2.20898 10.0078H0.837891ZM5.27344 10.0078C4.7168 10.0078 4.43555 9.7207 4.43555 9.16406V0.837891C4.43555 0.287109 4.7168 0 5.27344 0H6.64453C7.19531 0 7.48242 0.269531 7.48242 0.837891V9.16406C7.48242 9.7207 7.19531 10.0078 6.64453 10.0078H5.27344Z" fill="#1A1A1A"/>
            </svg>
          ) : (
            <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 9.22852V0.955078C0 0.310547 0.380859 0 0.832031 0C1.03125 0 1.23633 0.0585938 1.43555 0.169922L8.35547 4.21289C8.85938 4.50586 9.06445 4.72852 9.06445 5.0918C9.06445 5.44922 8.85938 5.67773 8.35547 5.9707L1.43555 10.0078C1.23633 10.1191 1.03125 10.1777 0.832031 10.1777C0.380859 10.1777 0 9.86719 0 9.22852Z" fill="#1A1A1A"/>
            </svg>
          )}
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
          onClick={handleFullscreen}
        >
          {isFullscreen ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.02539 5.32617C0.65625 5.32617 0.386719 5.0625 0.386719 4.6875C0.386719 4.31836 0.662109 4.05469 1.02539 4.05469H1.47656L3.32812 4.17773L1.88672 2.8125L0.1875 1.11914C0.0644531 0.996094 0 0.832031 0 0.65625C0 0.263672 0.28125 0 0.673828 0C0.84375 0 1.00195 0.0585938 1.11914 0.181641L2.80664 1.88086L4.17773 3.32812L4.05469 1.48242V1.06641C4.05469 0.697266 4.32422 0.427734 4.6875 0.427734C5.05664 0.427734 5.33203 0.703125 5.33203 1.06641V4.27148C5.33203 4.93945 4.94531 5.32617 4.27148 5.32617H1.02539ZM6.79688 11.2559C6.42773 11.2559 6.1582 10.9863 6.1582 10.623V7.36523C6.1582 6.69727 6.54492 6.30469 7.21289 6.30469H10.5176C10.8867 6.30469 11.1562 6.57422 11.1562 6.94336C11.1562 7.3125 10.8809 7.57617 10.5176 7.57617H10.0078L8.15625 7.45312L9.60352 8.82422L11.332 10.5469C11.4551 10.6699 11.5195 10.834 11.5195 11.0098C11.5195 11.4023 11.2383 11.6719 10.8457 11.6719C10.6758 11.6719 10.5176 11.6074 10.4004 11.4844L8.67773 9.75L7.30664 8.30859L7.42969 10.1484V10.623C7.42969 10.9922 7.16602 11.2559 6.79688 11.2559Z" fill="#1A1A1A"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.6348 4.89844C10.2715 4.89844 10.002 4.63477 10.002 4.26562V3.84375L10.125 2.00391L8.75391 3.44531L7.06641 5.14453C6.94922 5.27344 6.79102 5.33203 6.62109 5.33203C6.22852 5.33203 5.94727 5.06836 5.94727 4.67578C5.94727 4.49414 6.01172 4.33594 6.13477 4.21289L7.83398 2.51953L9.27539 1.14844L7.42383 1.27148H6.97266C6.60938 1.27148 6.33398 1.00781 6.33398 0.638672C6.33398 0.269531 6.60352 0 6.97266 0H10.2188C10.8926 0 11.2793 0.386719 11.2793 1.06055V4.26562C11.2793 4.62891 11.0039 4.89844 10.6348 4.89844ZM4.30664 11.291H1.05469C0.386719 11.291 0 10.9043 0 10.2305V7.02539C0 6.66211 0.275391 6.39258 0.644531 6.39258C1.00781 6.39258 1.27734 6.65625 1.27734 7.02539V7.44727L1.14844 9.28711L2.51953 7.8457L4.20703 6.14648C4.33008 6.01758 4.48828 5.95898 4.6582 5.95898C5.05078 5.95898 5.33203 6.22266 5.33203 6.61523C5.33203 6.79688 5.26172 6.95508 5.13867 7.07812L3.44531 8.77148L1.99805 10.1426L3.85547 10.0195H4.30664C4.66992 10.0195 4.94531 10.2832 4.94531 10.6523C4.94531 11.0215 4.67578 11.291 4.30664 11.291Z" fill="#1A1A1A"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

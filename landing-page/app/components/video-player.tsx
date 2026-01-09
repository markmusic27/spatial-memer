"use client";

import React, { useRef, useState, type ChangeEvent } from "react";

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
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
          onClick={handleFullscreen}
        >
          ⛶
        </button>
      </div>
    </div>
  );
};

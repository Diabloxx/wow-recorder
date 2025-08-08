import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, RendererVideo } from 'main/types';
import ReactPlayer from 'react-player';
import { OnProgressProps } from 'react-player/base';
import { ConfigurationSchema } from 'config/configSchema';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { Button } from './components/Button/Button';
import { secToMmSs } from './rendererutils';

interface ModernVideoPlayerProps {
  video: RendererVideo;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  config: ConfigurationSchema;
  persistentProgress: React.MutableRefObject<number>;
  onClose: () => void;
}

export const ModernVideoPlayer: React.FC<ModernVideoPlayerProps> = ({
  video,
  appState,
  setAppState,
  config,
  persistentProgress,
  onClose,
}) => {
  const playerRef = useRef<ReactPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const videoPath = video.videoSource;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === 'Escape') {
        onClose();
      } else if (e.code === 'KeyM') {
        setIsMuted(!isMuted);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isMuted, onClose]);

  const handleProgress = useCallback(
    (state: OnProgressProps) => {
      if (!isDragging) {
        setProgress(state.playedSeconds);
        persistentProgress.current = state.playedSeconds;
      }
    },
    [isDragging, persistentProgress],
  );

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
  }, []);

  const handleSeek = (value: number) => {
    const seekTime = (value / 100) * duration;
    setProgress(seekTime);
    playerRef.current?.seekTo(seekTime);
    persistentProgress.current = seekTime;
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    return secToMmSs(Math.floor(seconds));
  };

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Video Player Container */}
      <div className="relative w-full h-full max-w-7xl max-h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex-1">
              <h2 className="text-xl font-semibold truncate">
                {video.videoName}
              </h2>
              <p className="text-sm text-gray-300 truncate">
                {video.zoneName && video.encounterName
                  ? `${video.zoneName} - ${video.encounterName}`
                  : video.zoneName || 'Unknown Zone'}
              </p>
            </div>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 flex items-center justify-center relative">
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <ReactPlayer
            ref={playerRef}
            url={videoPath}
            width="100%"
            height="100%"
            playing={isPlaying}
            muted={isMuted}
            volume={volume}
            playbackRate={playbackRate}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onReady={() => setIsReady(true)}
            onError={(error) => {
              console.error('Video player error:', error);
            }}
            style={{ maxHeight: '100%', maxWidth: '100%' }}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                },
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div
              className="relative h-2 bg-gray-600 rounded-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = (clickX / rect.width) * 100;
                handleSeek(percentage);
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-orange-400 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  left: `${progressPercentage}%`,
                  marginLeft: '-6px',
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-300 mt-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <div
                  className="w-20 h-1 bg-gray-600 rounded-full cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newVolume = clickX / rect.width;
                    setVolume(Math.max(0, Math.min(1, newVolume)));
                    setIsMuted(false);
                  }}
                >
                  <div
                    className="h-full bg-orange-400 rounded-full"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  />
                </div>
              </div>

              {/* Playback Speed */}
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:border-orange-400 focus:outline-none"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              {/* Restart */}
              <Button
                onClick={() => {
                  playerRef.current?.seekTo(0);
                  setProgress(0);
                }}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                title="Restart video"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>

              {/* Fullscreen */}
              <Button
                onClick={toggleFullscreen}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

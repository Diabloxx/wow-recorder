import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface VideoThumbnailProps {
  videoPath: string;
  videoName: string;
  className?: string;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ 
  videoPath, 
  videoName,
  className = ''
}) => {
  const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    generateThumbnail();
  }, [videoPath, videoName]);

  const generateThumbnail = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      // First check if thumbnail already exists
      const existingPath = await window.electron.ipcRenderer.invoke('getThumbnailPath', [videoName]);
      
      if (existingPath) {
        setThumbnailPath(`file://${existingPath}`);
        setIsLoading(false);
        return;
      }

      // Generate new thumbnail
      const newThumbnailPath = await window.electron.ipcRenderer.invoke('generateThumbnail', [videoPath, videoName]);
      
      if (newThumbnailPath) {
        setThumbnailPath(`file://${newThumbnailPath}`);
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`relative aspect-video bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (hasError || !thumbnailPath) {
    return (
      <div className={`relative aspect-video bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-12 h-12 text-orange-600 dark:text-orange-400 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-200 drop-shadow-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
      <img 
        src={thumbnailPath} 
        alt="Video thumbnail"
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 drop-shadow-lg" />
      </div>
    </div>
  );
};

export default VideoThumbnail;

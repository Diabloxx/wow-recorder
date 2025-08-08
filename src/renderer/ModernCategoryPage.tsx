import React, { useMemo } from 'react';
import { AppState, RendererVideo } from 'main/types';
import { VideoCategory } from 'types/VideoCategory';
import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  Video,
  Search,
  Filter,
  Calendar,
  Grid,
  Clock,
  Users,
  Shield,
  Sword,
} from 'lucide-react';
import { getVideoCategoryFilter } from './rendererutils';
import VideoThumbnail from './VideoThumbnail';

interface IProps {
  category: VideoCategory;
  videoState: RendererVideo[];
  setVideoState: Dispatch<SetStateAction<RendererVideo[]>>;
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
  persistentProgress: MutableRefObject<number>;
  playerHeight: MutableRefObject<number>;
  playingVideo: RendererVideo | null;
  setPlayingVideo: Dispatch<SetStateAction<RendererVideo | null>>;
}

const ModernCategoryPage: React.FC<IProps> = ({
  category,
  videoState,
  playingVideo,
  setPlayingVideo,
}) => {
  // Filter videos based on category
  const filteredVideos = useMemo(() => {
    return videoState.filter(getVideoCategoryFilter(category));
  }, [videoState, category]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleVideoClick = (video: RendererVideo) => {
    setPlayingVideo(video);
  };

  const getResultText = (video: RendererVideo) => {
    switch (video.category) {
      case VideoCategory.Raids:
        return video.result ? 'Defeat' : 'Wipe';
      case VideoCategory.MythicPlus:
        return video.result ? 'Timed' : 'Depleted';
      default:
        return video.result ? 'Win' : 'Loss';
    }
  };

  const parseMythicPlusInfo = (videoName: string) => {
    // Parse format with full year timestamp: "YYYY-MM-DD HH-MM-SS - Character - Dungeon Name +Level (+Overrun)"
    const fullTimestampPattern = /^\d{4}-\d{2}-\d{2}\s\d{2}-\d{2}-\d{2}\s*-\s*(.+?)\s*-\s*(.+?)\s*\+(\d+)\s*\(\+(\d+)\)$/;
    const fullTimestampMatch = videoName.match(fullTimestampPattern);
    
    if (fullTimestampMatch) {
      const [, character, dungeon, level, overrun] = fullTimestampMatch;
      return {
        character: character.trim(),
        dungeon: dungeon.trim(),
        level: parseInt(level),
        overrun: parseInt(overrun),
      };
    }
      
    // Parse format with full year timestamp (no overrun): "YYYY-MM-DD HH-MM-SS - Character - Dungeon Name +Level"
    const fullTimestampSimplePattern = /^\d{4}-\d{2}-\d{2}\s\d{2}-\d{2}-\d{2}\s*-\s*(.+?)\s*-\s*(.+?)\s*\+(\d+)$/;
    const fullTimestampSimpleMatch = videoName.match(fullTimestampSimplePattern);
    
    if (fullTimestampSimpleMatch) {
      const [, character, dungeon, level] = fullTimestampSimpleMatch;
      return {
        character: character.trim(),
        dungeon: dungeon.trim(),
        level: parseInt(level),
        overrun: 0,
      };
    }
    
    // Parse format with short timestamp: "DD-DD HH-MM-SS - Character - Dungeon Name +Level (+Overrun)"
    const timestampPattern = /^\d{2}-\d{2}\s\d{2}-\d{2}-\d{2}\s*-\s*(.+?)\s*-\s*(.+?)\s*\+(\d+)\s*\(\+(\d+)\)$/;
    const timestampMatch = videoName.match(timestampPattern);
    
    if (timestampMatch) {
      const [, character, dungeon, level, overrun] = timestampMatch;
      return {
        character: character.trim(),
        dungeon: dungeon.trim(),
        level: parseInt(level),
        overrun: parseInt(overrun),
      };
    }

    // Parse format with short timestamp (no overrun): "DD-DD HH-MM-SS - Character - Dungeon Name +Level"
    const timestampSimplePattern = /^\d{2}-\d{2}\s\d{2}-\d{2}-\d{2}\s*-\s*(.+?)\s*-\s*(.+?)\s*\+(\d+)$/;
    const timestampSimpleMatch = videoName.match(timestampSimplePattern);
    
    if (timestampSimpleMatch) {
      const [, character, dungeon, level] = timestampSimpleMatch;
      return {
        character: character.trim(),
        dungeon: dungeon.trim(),
        level: parseInt(level),
        overrun: 0,
      };
    }
    
    // Parse format: "Character - Dungeon Name +Level (+Overrun)"
    const mythicPlusPattern = /^(.+?)\s*-\s*(.+?)\s*\+(\d+)\s*\(\+(\d+)\)$/;
    const match = videoName.match(mythicPlusPattern);
    
    if (match) {
      const [, character, dungeon, level, overrun] = match;
      return {
        character: character.trim(),
        dungeon: dungeon.trim(),
        level: parseInt(level),
        overrun: parseInt(overrun),
      };
    }
    
    // Fallback pattern without overrun: "Character - Dungeon Name +Level"
    const simplePattern = /^(.+?)\s*-\s*(.+?)\s*\+(\d+)$/;
    const simpleMatch = videoName.match(simplePattern);
    
    if (simpleMatch) {
      const [, character, dungeon, level] = simpleMatch;
      return {
        character: character.trim(),
        dungeon: dungeon.trim(),
        level: parseInt(level),
        overrun: 0,
      };
    }
    
    // Alternative pattern: "Dungeon Name +Level (+Overrun)" (without character)
    const altPattern = /^(.+?)\s*\+(\d+)\s*\(\+(\d+)\)$/;
    const altMatch = videoName.match(altPattern);
    
    if (altMatch) {
      const [, dungeon, level, overrun] = altMatch;
      return {
        character: '',
        dungeon: dungeon.trim(),
        level: parseInt(level),
        overrun: parseInt(overrun),
      };
    }
    
    // Simple alternative: "Dungeon Name +Level"
    const simpleAltPattern = /^(.+?)\s*\+(\d+)$/;
    const simpleAltMatch = videoName.match(simpleAltPattern);
    
    if (simpleAltMatch) {
      const [, dungeon, level] = simpleAltMatch;
      return {
        character: '',
        dungeon: dungeon.trim(),
        level: parseInt(level),
        overrun: 0,
      };
    }
    
    return null;
  };

  const getVideoDisplayTitle = (video: RendererVideo) => {
    switch (video.category) {
      case VideoCategory.MythicPlus: {
        const videoName = video.videoName || '';
        
        // For Mythic+, show just the dungeon name from parsing
        const mythicInfo = parseMythicPlusInfo(videoName);
        if (mythicInfo) {
          return mythicInfo.dungeon;
        }
        
        // If parsing fails, try to extract dungeon name manually
        // For timestamp format: "YYYY-MM-DD HH-MM-SS - Character - Dungeon..."
        // Split by " - " and take the part after the second dash
        const parts = videoName.split(' - ');
        
        if (parts.length >= 3) {
          // parts[0] = timestamp, parts[1] = character, parts[2] = dungeon + level
          let dungeonPart = parts.slice(2).join(' - '); // In case dungeon name has dashes
          
          // Remove +level and (+overrun) from the end
          dungeonPart = dungeonPart.replace(/\s*\+\d+.*$/, '');
          
          if (dungeonPart.trim()) {
            return dungeonPart.trim();
          }
        }
        
        // Final fallback: use zoneName if available
        if (
          video.zoneName &&
          !video.zoneName.toLowerCase().includes('unknown')
        ) {
          return video.zoneName;
        }
        
        // Last resort: use encounterName if available
        if (
          video.encounterName &&
          !video.encounterName.toLowerCase().includes('unknown')
        ) {
          return video.encounterName;
        }
        
        break;
      }
      case VideoCategory.Raids: {
        // For Raids, show just the boss/encounter name
        if (video.encounterName) {
          return video.encounterName;
        }
        break;
      }
      default:
        break;
    }
    
    // Fallback to video name for other categories
    return video.videoName || 'Untitled';
  };

  const getCategoryIcon = (category: VideoCategory) => {
    switch (category) {
      case VideoCategory.TwoVTwo:
      case VideoCategory.ThreeVThree:
      case VideoCategory.FiveVFive:
        return <Sword className="w-4 h-4" />;
      case VideoCategory.Raids:
        return <Users className="w-4 h-4" />;
      case VideoCategory.MythicPlus:
        return <Shield className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {category.replace(/([A-Z])/g, ' $1').trim()} Videos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {filteredVideos.length} videos found
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search videos..."
                className="w-full pl-10 pr-4 py-2 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="p-2 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
              <Calendar className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Videos Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">
              No videos found
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              Start recording some gameplay to see videos here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video, index) => (
              <div
                key={video.uniqueId || index}
                className="modern-card cursor-pointer group"
                onClick={() => handleVideoClick(video)}
              >
                {/* Video Thumbnail */}
                <div className="relative mb-4">
                  <VideoThumbnail 
                    videoPath={video.videoSource || ''} 
                    videoName={video.videoName}
                    className="group-hover:scale-105 transition-transform duration-200"
                  />

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(video.duration || 0)}
                  </div>

                  {/* Protected Badge */}
                  {video.isProtected && (
                    <div className="absolute top-2 left-2 bg-red-500/90 text-white px-2 py-1 rounded text-xs">
                      Protected
                    </div>
                  )}

                  {/* Cloud Badge */}
                  {video.cloud && (
                    <div className="absolute top-2 right-2 bg-blue-500/90 text-white px-2 py-1 rounded text-xs">
                      Cloud
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {getVideoDisplayTitle(video)}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(video.start)}</span>
                  </div>

                  {video.zoneName && !video.zoneName.toLowerCase().includes('unknown') && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <span className="font-medium">{video.zoneName}</span>
                    </div>
                  )}

                  {video.encounterName && video.category !== VideoCategory.Raids && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                      <span className="font-semibold">{video.encounterName}</span>
                    </div>
                  )}

                  {video.category === VideoCategory.MythicPlus && (() => {
                    const mythicInfo = parseMythicPlusInfo(video.videoName || '');
                    if (mythicInfo) {
                      return (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded font-bold">
                            +{mythicInfo.level}
                          </span>
                          {mythicInfo.overrun > 0 && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                              +{mythicInfo.overrun} upgrade
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {video.multiPov && video.multiPov.length > 1 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>{video.multiPov.length} POVs</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {getCategoryIcon(video.category)}
                      <span>{video.category}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        video.result
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {getResultText(video)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernCategoryPage;

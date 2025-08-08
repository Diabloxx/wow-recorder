import React, { useMemo } from 'react';
import { AppState, RendererVideo } from 'main/types';
import { VideoCategory } from 'types/VideoCategory';
import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { Video, Search, Filter, Calendar, Grid, Play, Clock, Users, Shield, Sword } from 'lucide-react';
import { getVideoCategoryFilter } from './rendererutils';

interface IProps {
  category: VideoCategory;
  videoState: RendererVideo[];
  setVideoState: Dispatch<SetStateAction<RendererVideo[]>>;
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
  persistentProgress: MutableRefObject<number>;
  playerHeight: MutableRefObject<number>;
}

const ModernCategoryPage: React.FC<IProps> = ({
  category,
  videoState,
  setVideoState,
  appState,
  setAppState,
  persistentProgress,
  playerHeight,
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
    // TODO: Implement video playback
    console.log('Playing video:', video.videoName);
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
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl">
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
                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg mb-4 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  
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
                    {video.videoName || 'Untitled'}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(video.start)}</span>
                  </div>

                  {video.zoneName && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="truncate">{video.zoneName}</span>
                    </div>
                  )}

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
                    <span className={`text-xs px-2 py-1 rounded ${
                      video.result 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {video.result ? 'Win' : 'Loss'}
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

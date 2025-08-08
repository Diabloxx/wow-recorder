import React from 'react';
import {
  Settings,
  Video,
  Gamepad2,
  Sword,
  Shield,
  Trophy,
  Users,
  BarChart3,
  Disc,
  Palette,
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  HardDrive,
  AlertTriangle,
  Download,
  Circle,
  Play,
  Square,
  Pause,
} from 'lucide-react';
import { AppState, RecStatus, MicStatus, SaveStatus, CloudStatus, DiskStatus, Pages, RendererVideo } from 'main/types';
import { VideoCategory } from 'types/VideoCategory';
import { getLocalePhrase, Phrase } from 'localisation/translations';
import { Dispatch, SetStateAction } from 'react';
import { getVideoCategoryFilter } from './rendererutils';

interface ModernSideMenuProps {
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
  recorderStatus: RecStatus;
  micStatus: MicStatus;
  savingStatus: SaveStatus;
  cloudStatus: CloudStatus;
  diskStatus: DiskStatus;
  updateAvailable: boolean;
  videoState: RendererVideo[];
}

const ModernSideMenu: React.FC<ModernSideMenuProps> = ({
  appState,
  setAppState,
  recorderStatus,
  micStatus,
  savingStatus,
  cloudStatus,
  diskStatus,
  updateAvailable,
  videoState,
}) => {
  const getRecorderStatusInfo = () => {
    switch (recorderStatus) {
      case RecStatus.Recording:
        return {
          icon: <Circle className="w-3 h-3 fill-red-500 text-red-500" />,
          text: 'Recording',
          className: 'modern-status recording',
        };
      case RecStatus.WaitingForWoW:
        return {
          icon: <Pause className="w-3 h-3" />,
          text: 'Waiting for WoW',
          className: 'modern-status waiting',
        };
      case RecStatus.ReadyToRecord:
        return {
          icon: <Play className="w-3 h-3" />,
          text: 'Ready',
          className: 'modern-status ready',
        };
      default:
        return {
          icon: <Square className="w-3 h-3" />,
          text: 'Unknown',
          className: 'modern-status',
        };
    }
  };

  const videoCategories = [
    {
      id: VideoCategory.Raids,
      icon: Users,
      label: getLocalePhrase(appState.language, Phrase.VideoCategoryRaidsLabel),
      color: 'text-red-500',
    },
    {
      id: VideoCategory.MythicPlus,
      icon: Trophy,
      label: getLocalePhrase(appState.language, Phrase.VideoCategoryMythicPlusLabel),
      color: 'text-amber-500',
    },
    {
      id: VideoCategory.TwoVTwo,
      icon: Sword,
      label: getLocalePhrase(appState.language, Phrase.VideoCategoryTwoVTwoLabel),
      color: 'text-red-600',
    },
    {
      id: VideoCategory.ThreeVThree,
      icon: Shield,
      label: getLocalePhrase(appState.language, Phrase.VideoCategoryThreeVThreeLabel),
      color: 'text-yellow-500',
    },
    {
      id: VideoCategory.Battlegrounds,
      icon: Gamepad2,
      label: getLocalePhrase(appState.language, Phrase.VideoCategoryBattlegroundsLabel),
      color: 'text-orange-400',
    },
  ];

  // Function to count videos for each category
  const getVideoCategoryCount = (category: VideoCategory): number => {
    return videoState.filter(video => {
      switch (category) {
        case VideoCategory.Raids:
          return video.category === VideoCategory.Raids;
        case VideoCategory.MythicPlus:
          return video.category === VideoCategory.MythicPlus;
        case VideoCategory.TwoVTwo:
          return video.category === VideoCategory.TwoVTwo;
        case VideoCategory.ThreeVThree:
          return video.category === VideoCategory.ThreeVThree;
        case VideoCategory.Battlegrounds:
          return video.category === VideoCategory.Battlegrounds;
        default:
          return false;
      }
    }).length;
  };

  const navigationItems = [
    {
      id: 'videos',
      icon: Video,
      label: 'Videos',
      onClick: () => setAppState(prev => ({ ...prev, page: Pages.None })),
      active: appState.page === Pages.None,
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      onClick: () => setAppState(prev => ({ ...prev, page: Pages.Settings })),
      active: appState.page === Pages.Settings,
    },
    {
      id: 'scene-editor',
      icon: Palette,
      label: 'Scene Editor',
      onClick: () => setAppState(prev => ({ ...prev, page: Pages.SceneEditor })),
      active: appState.page === Pages.SceneEditor,
    },
  ];

  const statusInfo = getRecorderStatusInfo();

  return (
    <aside className="modern-sidebar w-80 flex flex-col h-full p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          WoW Recorder
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Capture your greatest moments
        </p>
      </div>

      {/* Status Section */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
          Status
        </h2>
        <div className="space-y-3">
          {/* Recorder Status */}
          <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className={statusInfo.className}>
                {statusInfo.icon}
                <span>{statusInfo.text}</span>
              </div>
            </div>
          </div>

          {/* Microphone Status */}
          <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              {micStatus === MicStatus.LISTENING ? (
                <Mic className="w-4 h-4 text-amber-500" />
              ) : (
                <MicOff className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm">
                {micStatus === MicStatus.LISTENING ? 'Mic Active' : 'Mic Inactive'}
              </span>
            </div>
          </div>

          {/* Cloud Status */}
          <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              {(cloudStatus.read || cloudStatus.write || cloudStatus.available.length > 0) ? (
                <Wifi className="w-4 h-4 text-orange-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm">
                {(cloudStatus.read || cloudStatus.write || cloudStatus.available.length > 0) ? 'Cloud Online' : 'Cloud Offline'}
              </span>
            </div>
          </div>

          {/* Disk Status */}
          {(diskStatus.usage > diskStatus.limit * 0.9) && (
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-700 dark:text-orange-300">
                  Disk Warning
                </span>
              </div>
            </div>
          )}

          {/* Update Available */}
          {updateAvailable && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Update Available
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
          Navigation
        </h2>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`modern-nav-item w-full flex items-center gap-3 text-left ${
                  item.active ? 'active' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Video Categories */}
      {appState.page === Pages.None && (
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
            Categories
          </h2>
          <div className="space-y-1">
            {videoCategories.map((category) => {
              const Icon = category.icon;
              const isActive = appState.category === category.id;
              const videoCount = getVideoCategoryCount(category.id);
              const showBadge = (category.id === VideoCategory.Raids || category.id === VideoCategory.MythicPlus) && videoCount > 0;
              
              return (
                <button
                  key={category.id}
                  onClick={() =>
                    setAppState(prev => ({ ...prev, category: category.id }))
                  }
                  className={`modern-nav-item w-full flex items-center gap-3 text-left ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${category.color}`} />
                  <span className="font-medium flex-1">{category.label}</span>
                  {showBadge && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-orange-500 rounded-full min-w-[1.25rem] h-5">
                      {videoCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-4 h-4" />
          <span>Performance optimized</span>
        </div>
      </div>
    </aside>
  );
};

export default ModernSideMenu;

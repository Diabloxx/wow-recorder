import React, { useState } from 'react';
import { AppState, RecStatus } from 'main/types';
import { ConfigurationSchema } from 'config/configSchema';
import { Dispatch, SetStateAction } from 'react';
import { 
  Settings, 
  Palette, 
  Globe,
  Mic,
  Video,
  Users,
  Sword,
} from 'lucide-react';
import { getLocalePhrase, Phrase } from 'localisation/translations';
import ModernPVESettings from './ModernPVESettings';
import ModernPVPSettings from './ModernPVPSettings';
import ModernGeneralSettings from './ModernGeneralSettings';
import ModernAudioSettings from './ModernAudioSettings';
import ModernVideoSettings from './ModernVideoSettings';

interface IProps {
  recorderStatus: RecStatus;
  config: ConfigurationSchema;
  setConfig: Dispatch<SetStateAction<ConfigurationSchema>>;
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
}

type SettingsTab =
  | 'general'
  | 'video'
  | 'audio'
  | 'pve'
  | 'pvp'
  | 'overlay'
  | 'cloud';

const ModernSettingsPage: React.FC<IProps> = ({
  recorderStatus,
  config,
  setConfig,
  appState,
  setAppState,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const settingsTabs = [
    {
      id: 'general' as SettingsTab,
      label: getLocalePhrase(appState.language, Phrase.GeneralSettingsLabel),
      icon: Settings,
      description: 'Basic application settings',
      color: 'text-orange-500',
    },
    {
      id: 'video' as SettingsTab,
      label: 'Video Settings',
      icon: Video,
      description: 'Recording quality and capture settings',
      color: 'text-amber-500',
    },
    {
      id: 'audio' as SettingsTab,
      label: 'Audio Settings',
      icon: Mic,
      description: 'Microphone and speaker configuration',
      color: 'text-yellow-500',
    },
    {
      id: 'pve' as SettingsTab,
      label: getLocalePhrase(appState.language, Phrase.PVESettingsLabel),
      icon: Users,
      description: 'Raid and dungeon recording settings',
      color: 'text-red-500',
    },
    {
      id: 'pvp' as SettingsTab,
      label: getLocalePhrase(appState.language, Phrase.PVPSettingsLabel),
      icon: Sword,
      description: 'Arena and battleground settings',
      color: 'text-red-600',
    },
    {
      id: 'overlay' as SettingsTab,
      label: 'Overlay Settings',
      icon: Palette,
      description: 'Chat overlay and scene customization',
      color: 'text-orange-400',
    },
    {
      id: 'cloud' as SettingsTab,
      label: 'Cloud Settings',
      icon: Globe,
      description: 'Cloud storage and sync options',
      color: 'text-amber-400',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <ModernGeneralSettings
            config={config}
            setConfig={setConfig}
            appState={appState}
          />
        );
      case 'video':
        return (
          <ModernVideoSettings
            config={config}
            setConfig={setConfig}
            appState={appState}
          />
        );
      case 'audio':
        return (
          <ModernAudioSettings
            config={config}
            setConfig={setConfig}
            appState={appState}
          />
        );
      case 'pve':
        return (
          <ModernPVESettings
            config={config}
            setConfig={setConfig}
            appState={appState}
          />
        );
      case 'pvp':
        return (
          <ModernPVPSettings
            config={config}
            setConfig={setConfig}
            appState={appState}
          />
        );
      case 'overlay':
        return <div className="p-8">Overlay settings coming soon...</div>;
      case 'cloud':
        return <div className="p-8">Cloud settings coming soon...</div>;
      default:
        return (
          <ModernGeneralSettings
            config={config}
            setConfig={setConfig}
            appState={appState}
          />
        );
    }
  };

  return (
    <div className="h-full p-8 bg-gradient-to-br from-orange-50/20 to-red-50/20 dark:from-orange-950/20 dark:to-red-950/20">
      <div className="max-w-7xl mx-auto">
        {/* Settings Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-amber-100">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-amber-200/80">
                Configure your recording preferences
              </p>
            </div>
          </div>

          {/* Settings Tabs */}
          <div className="border-b border-orange-200/50 dark:border-orange-700/50">
            <div className="flex overflow-x-auto scrollbar-hide">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-3 px-6 py-4 font-medium text-sm border-b-2 transition-all duration-200 whitespace-nowrap
                      ${
                        isActive
                          ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-900/30'
                          : 'border-transparent text-gray-600 dark:text-amber-300/80 hover:text-gray-900 dark:hover:text-amber-100 hover:bg-orange-50/50 dark:hover:bg-orange-900/20'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? tab.color : ''}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="fade-in">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default ModernSettingsPage;

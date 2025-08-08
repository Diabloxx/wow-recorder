import React from 'react';
import { ConfigurationSchema, configSchema } from 'config/configSchema';
import { AppState } from 'main/types';
import { Dispatch, SetStateAction } from 'react';
import { getLocalePhrase } from 'localisation/translations';
import Switch from './components/Switch/Switch';
import { Select } from './components/Select/Select';
import { Tooltip } from './components/Tooltip/Tooltip';
import { 
  Swords, 
  Shield, 
  Target,
  Trophy,
  Flag,
  Users,
  Settings as SettingsIcon,
  Info
} from 'lucide-react';

interface IProps {
  config: ConfigurationSchema;
  setConfig: Dispatch<SetStateAction<ConfigurationSchema>>;
  appState: AppState;
}

const ModernPVPSettings: React.FC<IProps> = ({ config, setConfig, appState }) => {
  const ModernSettingCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, description, icon, children }) => (
    <div className="modern-card p-6 transition-all duration-200 hover:shadow-xl">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  const ModernToggleRow: React.FC<{
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-200/20 dark:border-gray-700/20">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{label}</span>
          <Tooltip content={description}>
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </Tooltip>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );

  const ModernSelectRow: React.FC<{
    label: string;
    description: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }> = ({ label, description, value, onChange, options }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-200/20 dark:border-gray-700/20">
      <div className="flex-1 mr-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{label}</span>
          <Tooltip content={description}>
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </Tooltip>
        </div>
      </div>
      <Select
        value={value}
        onValueChange={onChange}
        options={options}
      />
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Arena Settings */}
      <ModernSettingCard
        title="Arena Recording"
        description="Configure recording settings for arena matches"
        icon={<Swords className="w-6 h-6" />}
      >
        <ModernToggleRow
          label="Record Arena Matches"
          description={getLocalePhrase(appState.language, configSchema.recordArena.description)}
          checked={config.recordArena}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordArena: checked }))}
        />

        <ModernToggleRow
          label="Record Arena Skirmishes"
          description={getLocalePhrase(appState.language, configSchema.recordSkirmish.description)}
          checked={config.recordSkirmish}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordSkirmish: checked }))}
        />

        <ModernToggleRow
          label="Record Solo Shuffle"
          description={getLocalePhrase(appState.language, configSchema.recordSoloShuffle.description)}
          checked={config.recordSoloShuffle}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordSoloShuffle: checked }))}
        />

        <ModernSelectRow
          label="Arena Buffer Duration"
          description="How long to buffer arena matches before and after combat"
          value={config.arenaBufferDuration}
          onChange={(value) => setConfig(prev => ({ ...prev, arenaBufferDuration: value }))}
          options={[
            { value: '30', label: '30 seconds' },
            { value: '60', label: '1 minute' },
            { value: '120', label: '2 minutes' },
            { value: '180', label: '3 minutes' },
            { value: '300', label: '5 minutes' }
          ]}
        />
      </ModernSettingCard>

      {/* Battleground Settings */}
      <ModernSettingCard
        title="Battleground Recording"
        description="Configure recording settings for battleground matches"
        icon={<Flag className="w-6 h-6" />}
      >
        <ModernToggleRow
          label="Record Battlegrounds"
          description={getLocalePhrase(appState.language, configSchema.recordBG.description)}
          checked={config.recordBG}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordBG: checked }))}
        />

        <ModernToggleRow
          label="Record Rated Battlegrounds"
          description="Record rated battleground matches with higher priority"
          checked={config.recordRatedBG}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordRatedBG: checked }))}
        />

        <ModernToggleRow
          label="Record Epic Battlegrounds"
          description="Record epic battlegrounds (40v40 matches)"
          checked={config.recordEpicBG}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordEpicBG: checked }))}
        />

        <ModernSelectRow
          label="Battleground Buffer Duration"
          description="How long to buffer battleground matches before and after combat"
          value={config.bgBufferDuration}
          onChange={(value) => setConfig(prev => ({ ...prev, bgBufferDuration: value }))}
          options={[
            { value: '60', label: '1 minute' },
            { value: '120', label: '2 minutes' },
            { value: '180', label: '3 minutes' },
            { value: '300', label: '5 minutes' },
            { value: '600', label: '10 minutes' }
          ]}
        />
      </ModernSettingCard>

      {/* War Mode & World PvP */}
      <ModernSettingCard
        title="World PvP Recording"
        description="Configure recording for world PvP and War Mode activities"
        icon={<Shield className="w-6 h-6" />}
      >
        <ModernToggleRow
          label="Record War Mode PvP"
          description="Record PvP encounters while in War Mode"
          checked={config.recordWarMode}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordWarMode: checked }))}
        />

        <ModernToggleRow
          label="Record Outdoor PvP"
          description="Record PvP encounters in outdoor zones"
          checked={config.recordOutdoorPvP}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordOutdoorPvP: checked }))}
        />

        <ModernSelectRow
          label="World PvP Buffer Duration"
          description="How long to buffer world PvP encounters"
          value={config.worldPvPBufferDuration}
          onChange={(value) => setConfig(prev => ({ ...prev, worldPvPBufferDuration: value }))}
          options={[
            { value: '30', label: '30 seconds' },
            { value: '60', label: '1 minute' },
            { value: '120', label: '2 minutes' },
            { value: '180', label: '3 minutes' }
          ]}
        />
      </ModernSettingCard>

      {/* PvP Quality Settings */}
      <ModernSettingCard
        title="PvP Recording Quality"
        description="Optimize recording settings specifically for PvP content"
        icon={<Target className="w-6 h-6" />}
      >
        <ModernToggleRow
          label="High Quality PvP Recording"
          description="Use higher quality settings for PvP matches"
          checked={config.highQualityPvP}
          onChange={(checked) => setConfig(prev => ({ ...prev, highQualityPvP: checked }))}
        />

        <ModernSelectRow
          label="PvP Recording FPS"
          description="Frame rate for PvP recordings"
          value={config.pvpRecordingFPS}
          onChange={(value) => setConfig(prev => ({ ...prev, pvpRecordingFPS: value }))}
          options={[
            { value: '30', label: '30 FPS' },
            { value: '60', label: '60 FPS' },
            { value: '120', label: '120 FPS' },
            { value: '144', label: '144 FPS' }
          ]}
        />

        <ModernSelectRow
          label="PvP Recording Bitrate"
          description="Video bitrate for PvP recordings"
          value={config.pvpRecordingBitrate}
          onChange={(value) => setConfig(prev => ({ ...prev, pvpRecordingBitrate: value }))}
          options={[
            { value: '2500', label: '2.5 Mbps' },
            { value: '5000', label: '5 Mbps' },
            { value: '8000', label: '8 Mbps' },
            { value: '12000', label: '12 Mbps' },
            { value: '16000', label: '16 Mbps' }
          ]}
        />
      </ModernSettingCard>

      {/* PvP Triggers */}
      <ModernSettingCard
        title="PvP Recording Triggers"
        description="Configure what events trigger PvP recording"
        icon={<Users className="w-6 h-6" />}
      >
        <ModernToggleRow
          label="Auto-Start on Combat"
          description="Automatically start recording when entering PvP combat"
          checked={config.pvpAutoStartCombat}
          onChange={(checked) => setConfig(prev => ({ ...prev, pvpAutoStartCombat: checked }))}
        />

        <ModernToggleRow
          label="Record Player Deaths"
          description="Always record when a player dies in PvP"
          checked={config.recordPvPDeaths}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordPvPDeaths: checked }))}
        />

        <ModernToggleRow
          label="Record Killing Sprees"
          description="Record when achieving killing sprees in PvP"
          checked={config.recordKillingSprees}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordKillingSprees: checked }))}
        />

        <ModernToggleRow
          label="Record Flag Captures"
          description="Record flag captures and returns in battlegrounds"
          checked={config.recordFlagCaptures}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordFlagCaptures: checked }))}
        />
      </ModernSettingCard>

      {/* Advanced PvP Options */}
      <ModernSettingCard
        title="Advanced PvP Options"
        description="Advanced settings for PvP recording optimization"
        icon={<SettingsIcon className="w-6 h-6" />}
      >
        <ModernToggleRow
          label="Separate PvP Folders"
          description="Save PvP recordings in separate folders by type"
          checked={config.separatePvPFolders}
          onChange={(checked) => setConfig(prev => ({ ...prev, separatePvPFolders: checked }))}
        />

        <ModernToggleRow
          label="PvP Instant Replay"
          description="Enable instant replay buffer for PvP highlights"
          checked={config.pvpInstantReplay}
          onChange={(checked) => setConfig(prev => ({ ...prev, pvpInstantReplay: checked }))}
        />

        <ModernSelectRow
          label="Instant Replay Duration"
          description="Length of instant replay buffer"
          value={config.instantReplayDuration}
          onChange={(value) => setConfig(prev => ({ ...prev, instantReplayDuration: value }))}
          options={[
            { value: '30', label: '30 seconds' },
            { value: '60', label: '1 minute' },
            { value: '120', label: '2 minutes' },
            { value: '300', label: '5 minutes' }
          ]}
        />

        <ModernToggleRow
          label="PvP Statistics Overlay"
          description="Show PvP statistics overlay in recordings"
          checked={config.pvpStatsOverlay}
          onChange={(checked) => setConfig(prev => ({ ...prev, pvpStatsOverlay: checked }))}
        />
      </ModernSettingCard>
    </div>
  );
};

export default ModernPVPSettings;

import React from 'react';
import { ConfigurationSchema, configSchema } from 'config/configSchema';
import { AppState } from 'main/types';
import { Dispatch, SetStateAction } from 'react';
import { getLocalePhrase, Phrase } from 'localisation/translations';
import Switch from './components/Switch/Switch';
import { Input } from './components/Input/Input';
import { Tooltip } from './components/Tooltip/Tooltip';
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from './components/Select/Select';
import { 
  Video, 
  Monitor, 
  Settings as SettingsIcon,
  MousePointer,
  Zap,
  Info
} from 'lucide-react';

interface IProps {
  config: ConfigurationSchema;
  setConfig: Dispatch<SetStateAction<ConfigurationSchema>>;
  appState: AppState;
}

const ModernVideoSettings: React.FC<IProps> = ({ config, setConfig, appState }) => {
  const ModernSettingCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, description, icon, children }) => (
    <div className="modern-card p-6 transition-all duration-200 hover:shadow-xl">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl">
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
          <Tooltip content={description} side="top">
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
          <Tooltip content={description} side="top">
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </Tooltip>
        </div>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const resolutionOptions = [
    { value: '1920x1080', label: '1920x1080 (1080p)' },
    { value: '2560x1440', label: '2560x1440 (1440p)' },
    { value: '3840x2160', label: '3840x2160 (4K)' },
    { value: '1280x720', label: '1280x720 (720p)' },
  ];

  const fpsOptions = [
    { value: '30', label: '30 FPS' },
    { value: '60', label: '60 FPS' },
    { value: '120', label: '120 FPS' },
    { value: '144', label: '144 FPS' },
  ];

  const qualityOptions = [
    { value: 'Ultra', label: 'Ultra' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];

  const captureModeOptions = [
    { value: 'game_capture', label: 'Game Capture' },
    { value: 'window_capture', label: 'Window Capture' },
    { value: 'monitor_capture', label: 'Monitor Capture' },
  ];

  const encoderOptions = [
    { value: 'jim_nvenc', label: 'NVIDIA NVENC' },
    { value: 'jim_av1_nvenc', label: 'NVIDIA AV1 NVENC' },
    { value: 'jim_hevc_nvenc', label: 'NVIDIA HEVC NVENC' },
    { value: 'amd_amf_h264', label: 'AMD AMF H.264' },
    { value: 'obs_x264', label: 'Software x264' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Recording Quality */}
      <ModernSettingCard
        title="Recording Quality"
        description="Configure video recording quality and performance settings"
        icon={<Video className="w-6 h-6" />}
      >
        <ModernSelectRow
          label="Output Resolution"
          description={getLocalePhrase(appState.language, configSchema.obsOutputResolution.description)}
          value={config.obsOutputResolution}
          onChange={(value) => setConfig(prev => ({ ...prev, obsOutputResolution: value }))}
          options={resolutionOptions}
        />

        <ModernSelectRow
          label="Frame Rate"
          description={getLocalePhrase(appState.language, configSchema.obsFPS.description)}
          value={config.obsFPS.toString()}
          onChange={(value) => setConfig(prev => ({ ...prev, obsFPS: parseInt(value) }))}
          options={fpsOptions}
        />

        <ModernSelectRow
          label="Quality Preset"
          description={getLocalePhrase(appState.language, configSchema.obsQuality.description)}
          value={config.obsQuality}
          onChange={(value) => setConfig(prev => ({ ...prev, obsQuality: value }))}
          options={qualityOptions}
        />

        <ModernSelectRow
          label="Video Encoder"
          description={getLocalePhrase(appState.language, configSchema.obsRecEncoder.description)}
          value={config.obsRecEncoder}
          onChange={(value) => setConfig(prev => ({ ...prev, obsRecEncoder: value }))}
          options={encoderOptions}
        />
      </ModernSettingCard>

      {/* Capture Settings */}
      <ModernSettingCard
        title="Capture Settings"
        description="Configure how the game video is captured"
        icon={<Monitor className="w-6 h-6" />}
      >
        <ModernSelectRow
          label="Capture Mode"
          description={getLocalePhrase(appState.language, configSchema.obsCaptureMode.description)}
          value={config.obsCaptureMode}
          onChange={(value) => setConfig(prev => ({ ...prev, obsCaptureMode: value }))}
          options={captureModeOptions}
        />

        <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-200/20 dark:border-gray-700/20">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">Monitor Index</span>
              <Tooltip content={getLocalePhrase(appState.language, configSchema.monitorIndex.description)} side="top">
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </Tooltip>
            </div>
          </div>
          <Input
            type="number"
            value={config.monitorIndex}
            onChange={(e) => setConfig(prev => ({ ...prev, monitorIndex: parseInt(e.target.value) || 1 }))}
            className="w-20 text-center"
            min="1"
          />
        </div>

        <ModernToggleRow
          label="Capture Cursor"
          description={getLocalePhrase(appState.language, configSchema.captureCursor.description)}
          checked={config.captureCursor}
          onChange={(checked) => setConfig(prev => ({ ...prev, captureCursor: checked }))}
        />
      </ModernSettingCard>
    </div>
  );
};

export default ModernVideoSettings;

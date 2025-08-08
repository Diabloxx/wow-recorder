import React from 'react';
import { ConfigurationSchema, configSchema } from 'config/configSchema';
import { AppState } from 'main/types';
import { Dispatch, SetStateAction } from 'react';
import { getLocalePhrase, Phrase } from 'localisation/translations';
import Switch from './components/Switch/Switch';
import { Input } from './components/Input/Input';
import { Tooltip } from './components/Tooltip/Tooltip';
import { Slider } from './components/Slider/Slider';
import { 
  Mic, 
  Speaker, 
  Headphones, 
  Volume2,
  VolumeX,
  Settings as SettingsIcon,
  Info
} from 'lucide-react';

interface IProps {
  config: ConfigurationSchema;
  setConfig: Dispatch<SetStateAction<ConfigurationSchema>>;
  appState: AppState;
}

const ModernAudioSettings: React.FC<IProps> = ({ config, setConfig, appState }) => {
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

  const ModernSliderRow: React.FC<{
    label: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
  }> = ({ label, description, value, onChange, min = 0, max = 1, step = 0.1, unit = "" }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{label}</span>
          <Tooltip content={description} side="top">
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </Tooltip>
        </div>
        <span className="text-sm text-gray-500">
          {Math.round(value * (unit === "%" ? 100 : 1))}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );

  const ModernInputRow: React.FC<{
    label: string;
    description: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }> = ({ label, description, value, onChange, placeholder }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
        <Tooltip content={description} side="top">
          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </Tooltip>
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Input Devices */}
      <ModernSettingCard
        title="Input Devices"
        description="Configure microphone and input audio settings"
        icon={<Mic className="w-6 h-6" />}
      >
        <ModernInputRow
          label="Audio Input Devices"
          description={getLocalePhrase(appState.language, configSchema.audioInputDevices.description)}
          value={config.audioInputDevices}
          onChange={(value) => setConfig(prev => ({ ...prev, audioInputDevices: value }))}
          placeholder="Select microphone devices..."
        />

        <ModernSliderRow
          label="Microphone Volume"
          description="Adjust the volume level for microphone input"
          value={config.micVolume}
          onChange={(value) => setConfig(prev => ({ ...prev, micVolume: value }))}
          min={0}
          max={1}
          step={0.01}
          unit="%"
        />

        <ModernToggleRow
          label="Force Mono Audio"
          description={getLocalePhrase(appState.language, configSchema.obsForceMono.description)}
          checked={config.obsForceMono}
          onChange={(checked) => setConfig(prev => ({ ...prev, obsForceMono: checked }))}
        />

        <ModernToggleRow
          label="Audio Noise Suppression"
          description={getLocalePhrase(appState.language, configSchema.obsAudioSuppression.description)}
          checked={config.obsAudioSuppression}
          onChange={(checked) => setConfig(prev => ({ ...prev, obsAudioSuppression: checked }))}
        />
      </ModernSettingCard>

      {/* Output Devices */}
      <ModernSettingCard
        title="Output Devices"
        description="Configure speaker and output audio settings"
        icon={<Speaker className="w-6 h-6" />}
      >
        <ModernInputRow
          label="Audio Output Devices"
          description={getLocalePhrase(appState.language, configSchema.audioOutputDevices.description)}
          value={config.audioOutputDevices}
          onChange={(value) => setConfig(prev => ({ ...prev, audioOutputDevices: value }))}
          placeholder="Select speaker/headphone devices..."
        />

        <ModernSliderRow
          label="Speaker Volume"
          description="Adjust the volume level for speaker/headphone output"
          value={config.speakerVolume}
          onChange={(value) => setConfig(prev => ({ ...prev, speakerVolume: value }))}
          min={0}
          max={1}
          step={0.01}
          unit="%"
        />
      </ModernSettingCard>

      {/* Push to Talk */}
      <ModernSettingCard
        title="Push to Talk"
        description="Configure push-to-talk functionality for voice recording"
        icon={<Headphones className="w-6 h-6" />}
      >
        <ModernToggleRow
          label="Enable Push to Talk"
          description="Only record microphone when push-to-talk key is pressed"
          checked={config.pushToTalk}
          onChange={(checked) => setConfig(prev => ({ ...prev, pushToTalk: checked }))}
        />

        {config.pushToTalk && (
          <>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-200/20 dark:border-gray-700/20">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">Push to Talk Key</span>
                  <Tooltip content="Keyboard key code for push-to-talk activation" side="top">
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </Tooltip>
                </div>
              </div>
              <Input
                type="number"
                value={config.pushToTalkKey}
                onChange={(e) => setConfig(prev => ({ ...prev, pushToTalkKey: parseInt(e.target.value) || -1 }))}
                className="w-24 text-center"
                placeholder="-1"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-200/20 dark:border-gray-700/20">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">Mouse Button</span>
                  <Tooltip content="Mouse button for push-to-talk activation" side="top">
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </Tooltip>
                </div>
              </div>
              <Input
                type="number"
                value={config.pushToTalkMouseButton}
                onChange={(e) => setConfig(prev => ({ ...prev, pushToTalkMouseButton: parseInt(e.target.value) || -1 }))}
                className="w-24 text-center"
                placeholder="-1"
              />
            </div>

            <ModernInputRow
              label="Modifier Keys"
              description="Additional modifier keys (Ctrl, Alt, Shift) for push-to-talk"
              value={config.pushToTalkModifiers}
              onChange={(value) => setConfig(prev => ({ ...prev, pushToTalkModifiers: value }))}
              placeholder="e.g., ctrl+shift"
            />
          </>
        )}
      </ModernSettingCard>

      {/* Process Audio */}
      <ModernSettingCard
        title="Process Audio"
        description="Configure audio processing and additional sources"
        icon={<SettingsIcon className="w-6 h-6" />}
      >
        <ModernInputRow
          label="Audio Process Devices"
          description="Additional audio devices to include in processing"
          value={config.audioProcessDevices.join(', ')}
          onChange={(value) => setConfig(prev => ({ 
            ...prev, 
            audioProcessDevices: value.split(',').map(s => s.trim()).filter(s => s.length > 0)
          }))}
          placeholder="Enter device names separated by commas..."
        />

        <ModernSliderRow
          label="Process Volume"
          description="Volume level for audio processing devices"
          value={config.processVolume}
          onChange={(value) => setConfig(prev => ({ ...prev, processVolume: value }))}
          min={0}
          max={1}
          step={0.01}
          unit="%"
        />
      </ModernSettingCard>
    </div>
  );
};

export default ModernAudioSettings;

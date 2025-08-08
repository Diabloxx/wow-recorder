import React from 'react';
import { ConfigurationSchema, configSchema } from 'config/configSchema';
import { AppState } from 'main/types';
import { Dispatch, SetStateAction } from 'react';
import { getLocalePhrase, Phrase } from 'localisation/translations';
import Switch from './components/Switch/Switch';
import { Input } from './components/Input/Input';
import { Tooltip } from './components/Tooltip/Tooltip';
import { 
  HardDrive, 
  FolderOpen, 
  Settings as SettingsIcon,
  Monitor,
  Minimize2,
  Power,
  Info
} from 'lucide-react';

interface IProps {
  config: ConfigurationSchema;
  setConfig: Dispatch<SetStateAction<ConfigurationSchema>>;
  appState: AppState;
}

const ModernGeneralSettings: React.FC<IProps> = ({ config, setConfig, appState }) => {
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

  const ModernInputRow: React.FC<{
    label: string;
    description: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    suffix?: string;
    placeholder?: string;
  }> = ({ label, description, value, onChange, type = "text", suffix, placeholder }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
        <Tooltip content={description} side="top">
          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </Tooltip>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Storage Settings */}
      <ModernSettingCard
        title={getLocalePhrase(appState.language, Phrase.DiskStorageFolderLabel)}
        description="Configure where your recordings are stored and manage storage limits"
        icon={<HardDrive className="w-6 h-6" />}
      >
        <ModernInputRow
          label={getLocalePhrase(appState.language, Phrase.DiskStorageFolderLabel)}
          description={getLocalePhrase(appState.language, configSchema.storagePath.description)}
          value={config.storagePath}
          onChange={(value) => setConfig(prev => ({ ...prev, storagePath: value }))}
          placeholder="Select storage directory..."
        />

        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.SeparateBufferFolderLabel)}
          description={getLocalePhrase(appState.language, configSchema.separateBufferPath.description)}
          checked={config.separateBufferPath}
          onChange={(checked) => setConfig(prev => ({ ...prev, separateBufferPath: checked }))}
        />

        {config.separateBufferPath && (
          <ModernInputRow
            label={getLocalePhrase(appState.language, Phrase.BufferFolderLabel)}
            description={getLocalePhrase(appState.language, configSchema.bufferStoragePath.description)}
            value={config.bufferStoragePath}
            onChange={(value) => setConfig(prev => ({ ...prev, bufferStoragePath: value }))}
            placeholder="Select buffer directory..."
          />
        )}

        <ModernInputRow
          label={getLocalePhrase(appState.language, Phrase.MaxDiskStorageLabel)}
          description={getLocalePhrase(appState.language, configSchema.maxStorage.description)}
          value={config.maxStorage}
          onChange={(value) => setConfig(prev => ({ ...prev, maxStorage: parseInt(value) || 0 }))}
          type="number"
          suffix="GB"
        />
      </ModernSettingCard>

      {/* Application Settings */}
      <ModernSettingCard
        title={getLocalePhrase(appState.language, Phrase.WindowsSettingsLabel)}
        description="Configure application startup and window behavior"
        icon={<SettingsIcon className="w-6 h-6" />}
      >
        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.RunOnStartupLabel)}
          description={getLocalePhrase(appState.language, configSchema.startUp.description)}
          checked={config.startUp}
          onChange={(checked) => setConfig(prev => ({ ...prev, startUp: checked }))}
        />

        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.StartMinimizedLabel)}
          description={getLocalePhrase(appState.language, configSchema.startMinimized.description)}
          checked={config.startMinimized}
          onChange={(checked) => setConfig(prev => ({ ...prev, startMinimized: checked }))}
        />

        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.MinimizeOnQuitLabel)}
          description={getLocalePhrase(appState.language, configSchema.minimizeOnQuit.description)}
          checked={config.minimizeOnQuit}
          onChange={(checked) => setConfig(prev => ({ ...prev, minimizeOnQuit: checked }))}
        />

        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.MinimizeToTrayLabel)}
          description={getLocalePhrase(appState.language, configSchema.minimizeToTray.description)}
          checked={config.minimizeToTray}
          onChange={(checked) => setConfig(prev => ({ ...prev, minimizeToTray: checked }))}
        />
      </ModernSettingCard>

      {/* Game Version Settings */}
      <ModernSettingCard
        title="Game Versions"
        description="Enable recording for different World of Warcraft versions"
        icon={<Monitor className="w-6 h-6" />}
      >
        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.RecordRetailLabel)}
          description={getLocalePhrase(appState.language, configSchema.recordRetail.description)}
          checked={config.recordRetail}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordRetail: checked }))}
        />

        {config.recordRetail && (
          <ModernInputRow
            label="Retail Log Path"
            description={getLocalePhrase(appState.language, configSchema.retailLogPath.description)}
            value={config.retailLogPath}
            onChange={(value) => setConfig(prev => ({ ...prev, retailLogPath: value }))}
            placeholder="C:\\World of Warcraft\\_retail_\\Logs"
          />
        )}

        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.RecordClassicLabel)}
          description={getLocalePhrase(appState.language, configSchema.recordClassic.description)}
          checked={config.recordClassic}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordClassic: checked }))}
        />

        {config.recordClassic && (
          <ModernInputRow
            label="Classic Log Path"
            description={getLocalePhrase(appState.language, configSchema.classicLogPath.description)}
            value={config.classicLogPath}
            onChange={(value) => setConfig(prev => ({ ...prev, classicLogPath: value }))}
            placeholder="C:\\World of Warcraft\\_classic_\\Logs"
          />
        )}

        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.RecordClassicEraLabel)}
          description={getLocalePhrase(appState.language, configSchema.recordEra.description)}
          checked={config.recordEra}
          onChange={(checked) => setConfig(prev => ({ ...prev, recordEra: checked }))}
        />

        {config.recordEra && (
          <ModernInputRow
            label="Classic Era Log Path"
            description={getLocalePhrase(appState.language, configSchema.eraLogPath.description)}
            value={config.eraLogPath}
            onChange={(value) => setConfig(prev => ({ ...prev, eraLogPath: value }))}
            placeholder="C:\\World of Warcraft\\_classic_era_\\Logs"
          />
        )}
      </ModernSettingCard>
    </div>
  );
};

export default ModernGeneralSettings;

import React from 'react';
import { ConfigurationSchema, configSchema } from 'config/configSchema';
import { AppState } from 'main/types';
import { Dispatch, SetStateAction } from 'react';
import { getLocalePhrase, Phrase } from 'localisation/translations';
import { setConfigValues, useSettings } from './useSettings';
import Switch from './components/Switch/Switch';
import Label from './components/Label/Label';
import { Tooltip } from './components/Tooltip/Tooltip';
import { Input } from './components/Input/Input';
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from './components/Select/Select';
import { 
  Users, 
  Crown, 
  Trophy, 
  Timer, 
  Settings as SettingsIcon,
  Zap,
  Shield,
  Info
} from 'lucide-react';

const raidDifficultyOptions = [
  { name: 'LFR', phrase: Phrase.LFR },
  { name: 'Normal', phrase: Phrase.Normal },
  { name: 'Heroic', phrase: Phrase.Heroic },
  { name: 'Mythic', phrase: Phrase.Mythic },
];

interface IProps {
  config: ConfigurationSchema;
  setConfig: Dispatch<SetStateAction<ConfigurationSchema>>;
  appState: AppState;
}

const ModernPVESettings: React.FC<IProps> = ({ config, setConfig, appState }) => {
  const getSwitch = (
    preference: keyof ConfigurationSchema,
    changeFn: (checked: boolean) => void,
  ) => (
    <Switch
      checked={Boolean(config[preference])}
      name={preference}
      onCheckedChange={changeFn}
    />
  );

  const setRecordRaids = (checked: boolean) => {
    setConfig((prevState) => ({
      ...prevState,
      recordRaids: checked,
    }));
  };

  const setRecordCurrentRaidEncountersOnly = (checked: boolean) => {
    setConfig((prevState) => ({
      ...prevState,
      recordCurrentRaidEncountersOnly: checked,
    }));
  };

  const setRecordDungeons = (checked: boolean) => {
    setConfig((prevState) => ({
      ...prevState,
      recordDungeons: checked,
    }));
  };

  const setRecordMopChallengeModes = (checked: boolean) => {
    setConfig((prevState) => ({
      ...prevState,
      recordMopChallengeModes: checked,
    }));
  };

  const ModernSettingCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    disabled?: boolean;
  }> = ({ title, description, icon, children, disabled = false }) => (
    <div className={`
      modern-card p-6 transition-all duration-200
      ${disabled ? 'opacity-50 pointer-events-none' : 'hover:shadow-xl'}
    `}>
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
    disabled?: boolean;
  }> = ({ label, description, checked, onChange, disabled = false }) => (
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
        disabled={disabled}
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
    disabled?: boolean;
  }> = ({ label, description, value, onChange, type = "text", suffix, disabled = false }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-200/20 dark:border-gray-700/20">
      <div className="flex-1 mr-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{label}</span>
          <Tooltip content={description} side="top">
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </Tooltip>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-24 text-center"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Raid Settings */}
      <ModernSettingCard
        title={getLocalePhrase(appState.language, Phrase.RecordRaidsLabel)}
        description="Configure raid recording preferences and filters"
        icon={<Users className="w-6 h-6" />}
      >
        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.RecordRaidsLabel)}
          description={getLocalePhrase(appState.language, configSchema.recordRaids.description)}
          checked={config.recordRaids}
          onChange={setRecordRaids}
        />

        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.RecordCurrentRaidsOnlyLabel)}
          description={getLocalePhrase(appState.language, configSchema.recordCurrentRaidEncountersOnly.description)}
          checked={config.recordCurrentRaidEncountersOnly}
          onChange={setRecordCurrentRaidEncountersOnly}
          disabled={!config.recordRaids}
        />

        <ModernInputRow
          label={getLocalePhrase(appState.language, Phrase.MinimumEncounterDurationLabel)}
          description={getLocalePhrase(appState.language, configSchema.minEncounterDuration.description)}
          value={config.minEncounterDuration}
          onChange={(value) => setConfig(prev => ({ ...prev, minEncounterDuration: parseInt(value) || 0 }))}
          type="number"
          suffix="seconds"
          disabled={!config.recordRaids}
        />

        <ModernInputRow
          label={getLocalePhrase(appState.language, Phrase.RaidOverrunLabel)}
          description={getLocalePhrase(appState.language, configSchema.raidOverrun.description)}
          value={config.raidOverrun}
          onChange={(value) => setConfig(prev => ({ ...prev, raidOverrun: parseInt(value) || 0 }))}
          type="number"
          suffix="seconds"
          disabled={!config.recordRaids}
        />

        <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-200/20 dark:border-gray-700/20">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {getLocalePhrase(appState.language, Phrase.MinimumRaidDifficultyLabel)}
              </span>
              <Tooltip 
                content={getLocalePhrase(appState.language, configSchema.minRaidDifficulty.description)} 
                side="top"
              >
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </Tooltip>
            </div>
          </div>
          <Select
            value={config.minRaidDifficulty}
            onValueChange={(value) => setConfig(prev => ({ ...prev, minRaidDifficulty: value }))}
            disabled={!config.recordRaids}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {raidDifficultyOptions.map((option) => (
                <SelectItem key={option.name} value={option.name}>
                  {getLocalePhrase(appState.language, option.phrase)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ModernSettingCard>

      {/* Mythic+ / Challenge Modes Settings */}
      <ModernSettingCard
        title="Mythic+ / Challenge Modes"
        description="Configure dungeon recording for Mythic+ and Classic Challenge Modes"
        icon={<Trophy className="w-6 h-6" />}
      >
        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.RecordMythicPlusLabel)}
          description={getLocalePhrase(appState.language, configSchema.recordDungeons.description)}
          checked={config.recordDungeons}
          onChange={setRecordDungeons}
        />

        <ModernToggleRow
          label={getLocalePhrase(appState.language, Phrase.MinimumMopChallengeTierLabel)}
          description={getLocalePhrase(appState.language, configSchema.recordMopChallengeModes.description)}
          checked={config.recordMopChallengeModes}
          onChange={setRecordMopChallengeModes}
          disabled={!config.recordClassic}
        />

        <ModernInputRow
          label={getLocalePhrase(appState.language, Phrase.MinimumKeystoneLevelLabel)}
          description={getLocalePhrase(appState.language, configSchema.minKeystoneLevel.description)}
          value={config.minKeystoneLevel}
          onChange={(value) => setConfig(prev => ({ ...prev, minKeystoneLevel: parseInt(value) || 0 }))}
          type="number"
          disabled={!config.recordDungeons}
        />

        <ModernInputRow
          label={getLocalePhrase(appState.language, Phrase.MythicPlusOverrunLabel)}
          description={getLocalePhrase(appState.language, configSchema.dungeonOverrun.description)}
          value={config.dungeonOverrun}
          onChange={(value) => setConfig(prev => ({ ...prev, dungeonOverrun: parseInt(value) || 0 }))}
          type="number"
          suffix="seconds"
          disabled={!config.recordDungeons}
        />
      </ModernSettingCard>
    </div>
  );
};

export default ModernPVESettings;

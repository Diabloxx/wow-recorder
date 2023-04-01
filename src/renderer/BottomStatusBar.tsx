import { TNavigatorState } from 'main/types';
import Box from '@mui/material/Box';
import DiscordButton from './DiscordButton';
import LogButton from './LogButton';
import RecorderStatus from './RecorderStatus';
import SavingStatus from './SavingStatus';
import SettingsButton from './SettingsButton';
import TestButton from './TestButton';
import VersionUpdateWidget from './VersionUpdateWidget';
import Navigator from './Navigator';

interface IProps {
  navigation: TNavigatorState;
  setNavigation: React.Dispatch<React.SetStateAction<TNavigatorState>>;
  recorderStatus: any;
  upgradeStatus: any;
  savingStatus: any;
}

const BottomStatusBar: React.FC<IProps> = (props: IProps) => {
  const {
    navigation,
    setNavigation,
    recorderStatus,
    upgradeStatus,
    savingStatus,
  } = props;

  return (
    <Box
      sx={{
        borderTop: '1px solid black',
        height: '35px',
        boxSizing: 'border-box',
        alignItems: 'flex-end',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          ml: 1,
          mr: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <RecorderStatus recorderStatus={recorderStatus}/>
          <VersionUpdateWidget upgradeStatus={upgradeStatus}/>
          <SavingStatus savingStatus={savingStatus}/>
        </Box>

        <Navigator navigation={navigation} setNavigation={setNavigation} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <SettingsButton />
          <LogButton />
          <TestButton />
          <DiscordButton />
        </Box>
      </Box>
    </Box>
  );
};

export default BottomStatusBar;

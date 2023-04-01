import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import {
  RecStatus,
  SaveStatus,
  TNavigatorState,
  UpgradeStatus,
} from 'main/types';
import Box from '@mui/material/Box';
import Layout from './Layout';
import RendererTitleBar from './RendererTitleBar';
import BottomStatusBar from './BottomStatusBar';
import './App.css';

const ipc = window.electron.ipcRenderer;

const Application = () => {
  const [recorderStatus, setRecorderStatus] = React.useState<RecStatus>(
    RecStatus.InvalidConfig
  );

  const [configError, setConfigError] = React.useState<string>('');

  const [upgradeStatus, setUpgradeStatus] = React.useState<UpgradeStatus>({
    available: false,
    link: undefined,
  });

  const [savingStatus, setSavingStatus] = React.useState<SaveStatus>(
    SaveStatus.NotSaving
  );

  const [videoState, setVideoState] = React.useState<any>({});
  const [navigation, setNavigation] = React.useState<TNavigatorState>({
    categoryIndex: -1,
    videoIndex: -1,
  });

  React.useEffect(() => {
    ipc.on('refreshState', async () => {
      setVideoState(await ipc.invoke('getVideoState', []));
    });

    ipc.on('updateRecStatus', (status, error) => {
      setRecorderStatus(status as RecStatus);

      if (status === RecStatus.InvalidConfig) {
        setConfigError(error as string);
      }
    });

    ipc.on('updateSaveStatus', (status) => {
      setSavingStatus(status as SaveStatus);
    });

    ipc.on('updateUpgradeStatus', (available, link) => {
      setUpgradeStatus({
        available: available as boolean,
        link: link as string,
      });
    });
  }, []);

  return (
    <Box
      id="main-box"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      <RendererTitleBar />
      <Layout
        navigation={navigation}
        setNavigation={setNavigation}
        videoState={videoState}
        setVideoState={setVideoState}
      />
      <BottomStatusBar
        navigation={navigation}
        setNavigation={setNavigation}
        recorderStatus={recorderStatus}
        configError={configError}
        upgradeStatus={upgradeStatus}
        savingStatus={savingStatus}
      />
    </Box>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Application />} />
      </Routes>
    </Router>
  );
}

import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import { TNavigatorState } from 'main/types';
import Box from '@mui/material/Box';
import Layout from './Layout';
import RendererTitleBar from './RendererTitleBar';
import BottomStatusBar from './BottomStatusBar';
import './App.css';

const ipc = window.electron.ipcRenderer;

const Application = () => {
  const [navigation, setNavigation] = React.useState<TNavigatorState>({
    categoryIndex: -1,
    videoIndex: -1,
  });

  console.log(navigation);

  const [videoState, setVideoState] = React.useState<any>({});

  React.useEffect(() => {
    ipc.on('refreshState', async () => {
      setVideoState(await ipc.invoke('getVideoState', []));
    });
  }, []);

  return (
    <Box
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
      <BottomStatusBar navigation={navigation} setNavigation={setNavigation} />
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

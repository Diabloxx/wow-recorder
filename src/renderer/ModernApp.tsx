import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import {
  MicStatus,
  Pages,
  RecStatus,
  SaveStatus,
  AppState,
  RendererVideo,
  CloudStatus,
  DiskStatus,
  StorageFilter,
} from 'main/types';
import { getLocalePhrase, Language, Phrase } from 'localisation/translations';
import ModernLayout from './ModernLayout';
import RendererTitleBar from './RendererTitleBar';
import './App.css'; // Import Tailwind CSS
import './ModernApp.css';
import { useSettings } from './useSettings';
import { getCategoryFromConfig } from './rendererutils';
import { TooltipProvider } from './components/Tooltip/Tooltip';
import Toaster from './components/Toast/Toaster';
import ModernSideMenu from './ModernSideMenu';
import { Button } from './components/Button/Button';
import { ErrorBoundary } from 'react-error-boundary';
import { RefreshCcw } from 'lucide-react';

const ipc = window.electron.ipcRenderer;

const ModernWarcraftRecorder = () => {
  const [config, setConfig] = useSettings();
  const [micStatus, setMicStatus] = useState<MicStatus>(MicStatus.NONE);

  const [recorderStatus, setRecorderStatus] = useState<RecStatus>(
    RecStatus.WaitingForWoW,
  );

  const [savingStatus, setSavingStatus] = useState<SaveStatus>(
    SaveStatus.NotSaving,
  );

  const [updateAvailable] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>({
    guild: '',
    available: [],
    read: false,
    write: false,
    del: false,
    usage: 0,
    limit: 0,
  });
  const [diskStatus, setDiskStatus] = useState<DiskStatus>({
    usage: 0,
    limit: 0,
  });

  const [videoState, setVideoState] = useState<RendererVideo[]>([]);
  const [playingVideo, setPlayingVideo] = useState<RendererVideo | null>(null);

  const [appState, setAppState] = useState<AppState>({
    page: Pages.None,
    category: getCategoryFromConfig(config),
    selectedVideos: [],
    multiPlayerMode: false,
    viewpointSelectionOpen: false,
    videoFilterTags: [],
    dateRangeFilter: {
      startDate: null,
      endDate: null,
    },
    storageFilter: StorageFilter.BOTH,
    videoFullScreen: false,
    playing: false,
    language: Language.ENGLISH,
    cloudStatus: cloudStatus,
    diskStatus: diskStatus,
  });

  const persistentProgress = useRef(0);
  const playerHeight = useRef(0);

  // Load video state on component mount
  useEffect(() => {
    const loadVideoState = async () => {
      try {
        const state = (await ipc.invoke(
          'getVideoState',
          [],
        )) as RendererVideo[];
        setVideoState(state);
      } catch (error) {
        console.error('Failed to load video state:', error);
      }
    };

    loadVideoState();
  }, []);

  // Set up IPC listeners for real-time updates
  useEffect(() => {
    const updateRecorderStatus = (...args: unknown[]) => {
      const status = args[0] as RecStatus;
      setRecorderStatus(status);
    };

    const updateMicStatus = (...args: unknown[]) => {
      const status = args[0] as MicStatus;
      setMicStatus(status);
    };

    const updateSavingStatus = (...args: unknown[]) => {
      const status = args[0] as SaveStatus;
      setSavingStatus(status);
    };

    const updateCloudStatus = (...args: unknown[]) => {
      const status = args[0] as CloudStatus;
      setCloudStatus(status);
      setAppState((prev) => ({
        ...prev,
        cloudStatus: status,
      }));
    };

    const updateDiskStatus = (...args: unknown[]) => {
      const status = args[0] as DiskStatus;
      setDiskStatus(status);
      setAppState((prev) => ({
        ...prev,
        diskStatus: status,
      }));
    };

    const updateVideoState = (...args: unknown[]) => {
      const state = args[0] as RendererVideo[];
      setVideoState(state);
    };

    const handleError = (...args: unknown[]) => {
      const errorMessage = args[0] as string;
      console.error('Error:', errorMessage);
    };

    const refreshState = async () => {
      try {
        const state = (await ipc.invoke(
          'getVideoState',
          [],
        )) as RendererVideo[];
        setVideoState(state);
      } catch (error) {
        console.error('Failed to refresh video state:', error);
      }
    };

    // Register IPC listeners
    ipc.on('refreshState', refreshState);
    ipc.on('updateRecStatus', updateRecorderStatus);
    ipc.on('updateMicStatus', updateMicStatus);
    ipc.on('updateSaveStatus', updateSavingStatus);
    ipc.on('updateCloudStatus', updateCloudStatus);
    ipc.on('updateDiskStatus', updateDiskStatus);
    ipc.on('updateVideoState', updateVideoState);
    ipc.on('error', handleError);

    return () => {
      // Cleanup listeners
      ipc.removeAllListeners('refreshState');
      ipc.removeAllListeners('updateRecStatus');
      ipc.removeAllListeners('updateMicStatus');
      ipc.removeAllListeners('updateSaveStatus');
      ipc.removeAllListeners('updateCloudStatus');
      ipc.removeAllListeners('updateDiskStatus');
      ipc.removeAllListeners('updateVideoState');
      ipc.removeAllListeners('error');
    };
  }, []);

  const ErrorFallback = ({
    error,
    resetErrorBoundary,
  }: {
    error: Error;
    resetErrorBoundary: () => void;
  }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {getLocalePhrase(appState.language, Phrase.StatusTitleFatalError)}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error.message}</p>
        <Button
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-2"
        >
          <RefreshCcw size={16} />
          Retry
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <TooltipProvider>
        <div className="modern-app min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
          <RendererTitleBar />

          <div className="flex h-[calc(100vh-32px)]">
            {/* Modern Sidebar */}
            <ModernSideMenu
              appState={appState}
              setAppState={setAppState}
              recorderStatus={recorderStatus}
              micStatus={micStatus}
              savingStatus={savingStatus}
              cloudStatus={cloudStatus}
              diskStatus={diskStatus}
              updateAvailable={updateAvailable}
              videoState={videoState}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative z-20">
              <ModernLayout
                recorderStatus={recorderStatus}
                videoState={videoState}
                setVideoState={setVideoState}
                appState={appState}
                setAppState={setAppState}
                persistentProgress={persistentProgress}
                playerHeight={playerHeight}
                config={config}
                setConfig={setConfig}
                playingVideo={playingVideo}
                setPlayingVideo={setPlayingVideo}
              />
            </main>
          </div>

          {/* Video Player Overlay */}
          {playingVideo && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
              <div className="relative w-full h-full max-w-7xl max-h-full flex flex-col">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {playingVideo.videoName}
                      </h2>
                      <p className="text-sm text-gray-300">
                        {playingVideo.zoneName && playingVideo.encounterName
                          ? `${playingVideo.zoneName} - ${playingVideo.encounterName}`
                          : playingVideo.zoneName || 'Unknown Zone'}
                      </p>
                    </div>
                    <button
                      onClick={() => setPlayingVideo(null)}
                      className="text-white hover:text-orange-400 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Full VideoPlayer Component */}
                <div className="flex-1 mt-16 mb-4 mx-4">
                  <VideoPlayer
                    videos={[playingVideo]}
                    categoryState={videoState.filter(
                      (v) => v.category === playingVideo.category,
                    )}
                    persistentProgress={persistentProgress}
                    config={config}
                    appState={appState}
                    setAppState={setAppState}
                  />
                </div>
              </div>
            </div>
          )}

          <Toaster />
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ModernWarcraftRecorder />} />
      </Routes>
    </Router>
  );
}

export default App;

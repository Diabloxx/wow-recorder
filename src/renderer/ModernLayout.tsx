import * as React from 'react';
import { Pages, RecStatus, AppState, RendererVideo } from 'main/types';
import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { ConfigurationSchema } from 'config/configSchema';
import ModernSceneEditor from './ModernSceneEditor';
import ModernSettingsPage from './ModernSettingsPage';
import ModernCategoryPage from './ModernCategoryPage';

interface IProps {
  recorderStatus: RecStatus;
  videoState: RendererVideo[];
  setVideoState: Dispatch<SetStateAction<RendererVideo[]>>;
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
  persistentProgress: MutableRefObject<number>;
  playerHeight: MutableRefObject<number>;
  config: ConfigurationSchema;
  setConfig: Dispatch<SetStateAction<ConfigurationSchema>>;
  playingVideo: RendererVideo | null;
  setPlayingVideo: Dispatch<SetStateAction<RendererVideo | null>>;
}

/**
 * The modern main window layout, minus the sidebar.
 */
const ModernLayout = (props: IProps) => {
  const {
    recorderStatus,
    videoState,
    setVideoState,
    appState,
    setAppState,
    persistentProgress,
    playerHeight,
    config,
    setConfig,
    playingVideo,
    setPlayingVideo,
  } = props;
  const { page, category } = appState;

  const renderCategoryPage = () => {
    return (
      <ModernCategoryPage
        category={category}
        videoState={videoState}
        setVideoState={setVideoState}
        appState={appState}
        setAppState={setAppState}
        persistentProgress={persistentProgress}
        playerHeight={playerHeight}
        playingVideo={playingVideo}
        setPlayingVideo={setPlayingVideo}
      />
    );
  };

  const renderSettingsPage = () => {
    return (
      <ModernSettingsPage
        recorderStatus={recorderStatus}
        config={config}
        setConfig={setConfig}
        appState={appState}
        setAppState={setAppState}
      />
    );
  };

  const renderSceneEditor = () => {
    return (
      <ModernSceneEditor recorderStatus={recorderStatus} appState={appState} />
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/50 dark:to-red-950/50 relative z-10">
      <div className="h-full overflow-auto relative z-10">
        {page === Pages.Settings && renderSettingsPage()}
        {page === Pages.SceneEditor && renderSceneEditor()}
        {page === Pages.None && renderCategoryPage()}
      </div>
    </div>
  );
};

export default ModernLayout;

import React from 'react';
import { AppState, RecStatus } from 'main/types';
import { Phrase } from 'localisation/types';
import { getLocalePhrase } from 'localisation/translations';
import RecorderPreview from './RecorderPreview';
import ChatOverlayControls from './ChatOverlayControls';
import VideoSourceControls from './VideoSourceControls';
import AudioSourceControls from './AudioSourceControls';
import VideoBaseControls from './VideoBaseControls';
import { ScrollArea } from './components/ScrollArea/ScrollArea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './components/Tabs/Tabs';
import { Monitor, Video, Volume2, Image } from 'lucide-react';

interface IProps {
  appState: AppState;
  recorderStatus: RecStatus;
}

const ModernSceneEditor: React.FC<IProps> = (props: IProps) => {
  const { recorderStatus, appState } = props;

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto h-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Scene Editor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure your recording sources and settings
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="h-[calc(100%-120px)] flex flex-col gap-6">
          {/* Preview Section */}
          <div className="modern-card p-6 h-3/5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Preview
            </h2>
            <div className="h-[calc(100%-40px)] bg-black rounded-lg overflow-hidden">
              <RecorderPreview />
            </div>
          </div>

          {/* Controls Section */}
          <div className="modern-card p-6 h-2/5">
            <Tabs defaultValue="source" className="w-full h-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="source" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  {getLocalePhrase(appState.language, Phrase.SourceHeading)}
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  {getLocalePhrase(appState.language, Phrase.VideoHeading)}
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  {getLocalePhrase(appState.language, Phrase.AudioHeading)}
                </TabsTrigger>
                <TabsTrigger
                  value="overlay"
                  className="flex items-center gap-2"
                >
                  <Image className="w-4 h-4" />
                  {getLocalePhrase(appState.language, Phrase.OverlayHeading)}
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 h-[calc(100%-60px)]">
                <ScrollArea withScrollIndicators={false} className="h-full">
                  <TabsContent value="source" className="mt-0">
                    <div className="p-4">
                      <VideoSourceControls appState={appState} />
                    </div>
                  </TabsContent>

                  <TabsContent value="video" className="mt-0">
                    <div className="p-4">
                      <VideoBaseControls
                        recorderStatus={recorderStatus}
                        appState={appState}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="audio" className="mt-0">
                    <div className="p-4">
                      <AudioSourceControls appState={appState} />
                    </div>
                  </TabsContent>

                  <TabsContent value="overlay" className="mt-0">
                    <div className="p-4">
                      <ChatOverlayControls appState={appState} />
                    </div>
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernSceneEditor;

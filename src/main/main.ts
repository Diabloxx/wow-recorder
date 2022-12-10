/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * Application entrypoint point.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog, Tray, Menu, net } from 'electron';

import {
  resolveHtmlPath,
  loadAllVideos,
  deleteVideo,
  openSystemExplorer,
  toggleVideoProtected,
  fixPathWhenPackaged,
  getAvailableDisplays,
  loadRecorderOptions,
} from './util';

/**
 * Setup logging. It's important this is the first thing we do. This works by
 * overriding console log methods. All console log method will go to both the
 * console if it exists, and a file on disk. 
 * TODO: Currently only main process logs go here. Fix so react component 
 * logs go here as well. 
 */
const log = require('electron-log');
const date = new Date().toISOString().slice(0, 10);
const logRelativePath = `logs/WarcraftRecorder-${date}.log`;
const logPath = fixPathWhenPackaged(path.join(__dirname, logRelativePath))
const logDir = path.dirname(logPath);
log.transports.file.resolvePath = () => logPath;
Object.assign(console, log.functions);
console.log("[Main] App starting: version", app.getVersion());

import { runRetailRecordingTest, runClassicRecordingTest, filterFlavoursByConfig } from './logutils';
const obsRecorder = require('./obsRecorder');
const tasklist = require('tasklist');
import { Recorder, RecorderOptionsType } from './recorder';
import { getAvailableAudioInputDevices, getAvailableAudioOutputDevices } from './obsAudioDeviceUtils';
import { IWoWProcessResult, RecStatus, VideoPlayerSettings } from './types';
import ConfigService from './configService';
import { CombatLogParser } from './combatLogParser';
import { getObsAvailableRecEncoders, getObsResolutions } from './obsRecorder';
import RetailLogHandler from '../log_handling/RetailLogHandler';
import ClassicLogHandler from '../log_handling/ClassicLogHandler';
import { wowExecutableFlavours } from './constants';

let retailHandler: RetailLogHandler;
let classicHandler: ClassicLogHandler;
let recorder: Recorder;

/**
 * Guard against any UnhandledPromiseRejectionWarnings. If OBS isn't behaving 
 * as expected then it's better to crash the app. See:
 * - https://nodejs.org/api/process.html#process_event_unhandledrejection. 
 * - https://nodejs.org/api/process.html#event-unhandledrejection
 */
process.on('unhandledRejection', (reason: Error | any) => {
  console.error("UnhandledPromiseRejectionWarning:", reason);

  // If the mainWindow exists, open a pretty dialog box.
  // If not, throw it as a generic JavaScript error. 
  if (mainWindow) {
    mainWindow.webContents.send('fatalError', reason.stack);
  } else {
    throw new Error(reason);
  }
});

/**
 * Create a settings store to handle the config.
 * This defaults to a path like: 
 *   - (prod) "C:\Users\alexa\AppData\Roaming\WarcraftRecorder\config-v2.json"
 *   - (dev)  "C:\Users\alexa\AppData\Roaming\Electron\config-v2.json"
 */
const cfg = ConfigService.getInstance();

cfg.on('change', (key: string, value: any) => {
  if (key === 'startUp') {
    const isStartUp = (value === true);
    console.log("[Main] OS level set start-up behaviour:", isStartUp);

    app.setLoginItemSettings({
      openAtLogin: isStartUp
    });
  }
});

// Default video player settings on app start
const videoPlayerSettings: VideoPlayerSettings = {
  muted: false,
  volume: 1,
};

/**
 * Define renderer windows.
 */
let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let tray = null;
let wowProcessRunning: IWoWProcessResult | null = null;
let pollWowProcessInterval: NodeJS.Timer;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
if (isDebug) require('electron-debug')();

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const RESOURCES_PATH = app.isPackaged
? path.join(process.resourcesPath, 'assets')
: path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

/**
 * Setup tray icon, menu and even listeners. 
 */
const setupTray = () => {
  tray = new Tray(getAssetPath("./icon/small-icon.png"));

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open', click() {
        console.log("[Main] User clicked open on tray icon");
        if (mainWindow) mainWindow.show();
      }
    },
    { 
      label: 'Quit', click() { 
        console.log("[Main] User clicked close on tray icon");
        if (mainWindow) mainWindow.close();
      } 
    },
  ])

  tray.setToolTip('Warcraft Recorder')
  tray.setContextMenu(contextMenu)

  tray.on("double-click", () => {
    console.log("[Main] User double clicked tray icon");
    if (mainWindow) mainWindow.show();
  }) 
}

/**
 * Creates the main window.
 */
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    height: 1020 * 0.75,
    width: 1980 * 0.65,
    icon: getAssetPath('./icon/small-icon.png'),
    frame: false,
    title: 'Warcraft Recorder v' + app.getVersion(),
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      //devTools: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });
  
  mainWindow.loadURL(resolveHtmlPath('mainWindow.index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) throw new Error('"mainWindow" is not defined');

    const initialStatus = checkConfig() ? RecStatus.WaitingForWoW : RecStatus.InvalidConfig;
    updateRecStatus(initialStatus);

    // This shows the correct version on a release build, not during development.
    mainWindow.webContents.send('updateTitleBar', 'Warcraft Recorder v' + app.getVersion());

    const cfgStartMinimized = cfg.get<boolean>('startMinimized');

    if (!cfgStartMinimized) {
      mainWindow.show();
    }

    if (!checkConfig()) return;
    const recorderOptions: RecorderOptionsType = loadRecorderOptions(mainWindow, cfg);
    makeRecorder(recorderOptions);

    const retailLogPath = cfg.getPath('retailLogPath');
    const classicLogPath = cfg.getPath('classicLogPath');

    if (retailLogPath) {
      retailHandler = makeRetailHandler(recorder, retailLogPath, cfg);
    }

    if (classicLogPath) {
      classicHandler = makeClassicHandler(recorder, classicLogPath, cfg);
    }
    
    pollWowProcess();
    checkAppUpdate();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupTray();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Creates the settings window, called on clicking the settings cog.
 */
const createSettingsWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  settingsWindow = new BrowserWindow({
    show: false,
    width: 650,
    height: 525,
    resizable: (process.env.NODE_ENV === 'production') ? false : true,
    icon: getAssetPath('./icon/settings-icon.svg'),
    frame: false,
    webPreferences: {
      webSecurity: false,
      //devTools: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  settingsWindow.loadURL(resolveHtmlPath("settings.index.html"));

  settingsWindow.on('ready-to-show', () => {
    if (!settingsWindow) {
      throw new Error('"settingsWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      settingsWindow.minimize();
    } else {
      settingsWindow.show();
    }
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  // Open urls in the user's browser
  settingsWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

const openPathDialog = (event: any, args: any) => {
  if (!settingsWindow) return;
  const setting = args[1];
  
  dialog.showOpenDialog(settingsWindow, { properties: ['openDirectory'] }).then(result => {
    if (!result.canceled) {
      const selectedPath = result.filePaths[0];
      let validationResult = true;

      // Validate the path if it's a path for a log directory
      if (setting === 'retailLogPath' || setting === 'classicLogPath') {
        validationResult = CombatLogParser.validateLogPath(selectedPath);
      }

      event.reply('settingsWindow', ['pathSelected', setting, selectedPath, validationResult]);
    }
  })
  .catch(err => {
    console.log(err);
  })
} 

/**
 * Checks the app config.
 * @returns true if config is setup, false otherwise. 
 */
const checkConfig = () : boolean => {
  if (mainWindow === null) {
    return false;
  }

  try {
    cfg.validate();
  } catch (err: any) {
    updateRecStatus(RecStatus.InvalidConfig, err.toString());
    console.info("[Main] Config is bad: ", err);
    return false;
  }  
  
  return true;
}

/**
 * Updates the status icon for the application.
 * @param status the status number
 */
const updateRecStatus = (status: RecStatus, reason: string = "") => {
  if (mainWindow !== null) {
    mainWindow.webContents.send('updateRecStatus', status, reason);
  }
}

/**
 * mainWindow event listeners.
 */
ipcMain.on('mainWindow', (_event, args) => {
  if (mainWindow === null) return; 

  if (args[0] === "minimize") {
    console.log("[Main] User clicked minimize");
    mainWindow.hide();
  }

  if (args[0] === "resize") {
    console.log("[Main] User clicked resize");
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  }

  if (args[0] === "quit"){
    console.log("[Main] User clicked quit");
    mainWindow.close();
  }
})

/**
 * Create or reconfigure the recorder instance.
 */
const makeRecorder = (recorderOptions: RecorderOptionsType): void => {
  if (recorder) {
    recorder.reconfigure(recorderOptions);
  } else {
    recorder = new Recorder(recorderOptions);
  }
}

/**
 * settingsWindow event listeners.
 */
ipcMain.on('settingsWindow', (event, args) => {

  if (args[0] === "create") {
    console.log("[Main] User clicked open settings");
    if (!settingsWindow) createSettingsWindow();
  }
    
  if (settingsWindow === null) return; 
  
  if (args[0] === "quit") {
    console.log("[Main] User closed settings");
    settingsWindow.close();
  }

  if (args[0] === "update") {
    console.log("[Main] User updated settings");
    
    settingsWindow.once('closed', () => {
      if (!checkConfig()) return;
      updateRecStatus(RecStatus.WaitingForWoW);

      const recorderOptions = loadRecorderOptions(mainWindow, cfg);
      makeRecorder(recorderOptions);

      const retailLogPath = cfg.getPath('retailLogPath');
      const classicLogPath = cfg.getPath('classicLogPath');

      if (retailLogPath) {
        retailHandler = makeRetailHandler(recorder, retailLogPath, cfg);
      }

      if (classicLogPath) {
        classicHandler = makeClassicHandler(recorder, classicLogPath, cfg);
      }

      pollWowProcess();
    })

    settingsWindow.close();
  }

  if (args[0] === "openPathDialog") {
      openPathDialog(event, args);
      return;
  }

  if (args[0] === 'getAllDisplays') {
    event.returnValue = getAvailableDisplays();
    return;
  }

  if (args[0] === 'getObsAvailableResolutions') {
    if (!recorder) {
      event.returnValue = { 'Base': [], 'Output': [] };
      return;
    }

    event.returnValue = getObsResolutions();
    return;
  }

  if (args[0] === 'getObsAvailableRecEncoders') {
    if (!recorder) {
      event.returnValue = [];
      return;
    }

    const obsEncoders = getObsAvailableRecEncoders();
    const defaultEncoder = obsEncoders.at(-1);
    const encoderList = [{id: 'auto', name: `Automatic (${defaultEncoder})`}];

    obsEncoders
      // We don't want people to be able to select 'none'.
      .filter(encoder => encoder !== 'none')
      .forEach(encoder => {
        const isHardwareEncoder = encoder.includes('amd') || encoder.includes('nvenc') || encoder.includes('qsv');
        const encoderType = isHardwareEncoder ? 'Hardware' : 'Software';

        encoderList.push({
          id: encoder,
          name: `${encoderType} (${encoder})`,
        });
      });

    event.returnValue = encoderList;
    return;
  }
})

/**
 * contextMenu event listeners.
 */
ipcMain.on('contextMenu', (_event, args) => {
  if (args[0] === "delete") {
    const videoForDeletion = args[1];
    deleteVideo(videoForDeletion);
    if (mainWindow) mainWindow.webContents.send('refreshState');
  }

  if (args[0] === "open") {
    const fileToOpen = args[1];
    openSystemExplorer(fileToOpen);
  }

  if (args[0] === "save") {
    const videoToToggle = args[1];
    toggleVideoProtected(videoToToggle);
    if (mainWindow) mainWindow.webContents.send('refreshState');
  }

  if (args[0] === "seekVideo") {
    const videoIndex = parseInt(args[1], 10);
    const seekTime = parseInt(args[2], 10);
    if (mainWindow) mainWindow.webContents.send('seekVideo', videoIndex, seekTime);
  }
})

/**
 * logPath event listener.
 */
 ipcMain.on('logPath', (_event, args) => {
  if (args[0] === "open") {
    openSystemExplorer(logDir);
  }
})

/**
 * openURL event listener.
 */
 ipcMain.on('openURL', (event, args) => {
  event.preventDefault();
  require('electron').shell.openExternal(args[0]);
})

/**
 * Get the list of video files and their state.
 */
ipcMain.handle('getVideoState', async () => loadAllVideos(cfg.get<string>('storagePath')));

ipcMain.on('getAudioDevices', (event) => {
  // We can only get this information if the recorder (OBS) has been
  // initialized and that only happens when the storage directory has
  // been configured.
  if (!recorder) {
    event.returnValue = { input: [], output: [] };
    return;
  }

  event.returnValue = {
    input: getAvailableAudioInputDevices(),
    output: getAvailableAudioOutputDevices(),
  };
});

/**
 * Set/Get global video player settings
 */
ipcMain.on('videoPlayerSettings', (event, args) => {
  switch (args[0]) {
    case 'get':
      event.returnValue = videoPlayerSettings;
      break;

    case 'set':
      const settings = (args[1] as VideoPlayerSettings);

      videoPlayerSettings.muted = settings.muted;
      videoPlayerSettings.volume = settings.volume;
      break;
  }
});

/**
 * Test button listener. 
 */
ipcMain.on('test', (_event, args) => {
  if (!checkConfig()) return;
  
  if (wowProcessRunning === null) {
    console.info("[Logutils] WoW isn't running, not starting test.");
    return;
  }

  if (retailHandler) {
    console.info("[Main] Running retail test");
    runRetailRecordingTest(retailHandler.combatLogParser, Boolean(args[0]));
  } else if (classicHandler) {
    console.info("[Main] Running classic test");
    runClassicRecordingTest(classicHandler.combatLogParser, Boolean(args[0]));
  }
});

/**
 * Handle when a user clicks the stop recording button. 
 */
ipcMain.on('recorder', (_event, args) => {
  if (args[0] == 'stop') {
    console.log('[Main] Force stopping recording due to user request.')

    if (retailHandler && retailHandler.activity) {
      retailHandler.forceEndActivity();
      return;
    }

    if (classicHandler && classicHandler.activity) {
      classicHandler.forceEndActivity();
      return;
    }

    if (recorder) recorder.forceStop();
  }
});

/**
 * Shutdown the app if all windows closed. 
 */
app.on('window-all-closed', () => {
  console.log("[Main] User closed app");
  if (recorder) recorder.cleanupBuffer(0);
  obsRecorder.shutdown();
  app.quit();
});

/**
 * Checks for updates from the releases page on github, and, if there is a new version, sends a message to the main window to display a notification
 */
const checkAppUpdate = () => {
  const options = {
    hostname: 'api.github.com',
    protocol: 'https:',
    path: '/repos/aza547/wow-recorder/releases/latest',
    method: 'GET',
    headers: {
      'User-Agent': 'wow-recorder',
    }
  }

  const request = net.request(options);
  
  request.on('response', (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      if (response.statusCode !== 200) {
        console.error(`[Main] ERROR, Failed to check for updates, status code: ${response.statusCode}`);
        return;
      }

      const release = JSON.parse(data);
      const latestVersion = release.tag_name;
      const downloadUrl = release.assets[0].browser_download_url;

      if (latestVersion !== app.getVersion() && latestVersion && downloadUrl) {
        console.log("[Main] New version available:", latestVersion);
        if (mainWindow) mainWindow.webContents.send('updateAvailable', downloadUrl);
      }
    });
  });

  request.on('error', (error) => {
    console.error(`[Main] ERROR, Failed to check for updates: ${error}`);
  });

  request.end();
}

/**
 * App start-up.
 */
app
  .whenReady()
  .then(() => {
    console.log("[Main] App ready");
    const singleInstanceLock = app.requestSingleInstanceLock();

    if (!singleInstanceLock) {
      console.warn("[Main] Blocked attempt to launch a second instance of the application");
      app.quit();
    } else {
      createWindow();
    }
  })
  .catch(console.log);

const resetProcessTracking = () => {
  wowProcessRunning = null;
}

/**
 * Handle WoW process starting.
 */
const wowProcessStarted = (process: IWoWProcessResult) => {
  wowProcessRunning = process;
  console.log(`[Logutils] Detected ${process.exe} (${process.flavour}) running`);
  recorder.startBuffer();
};

/**
 * Handle WoW process stopping.
 */
const wowProcessStopped = () => {
  if (!wowProcessRunning) {
    return;
  }

  console.log(`[Logutils] Detected ${wowProcessRunning.exe} (${wowProcessRunning.flavour}) not running`);
  wowProcessRunning = null;

  if (retailHandler && retailHandler.activity) {
    retailHandler.forceEndActivity();
  } else if (classicHandler && classicHandler.activity) {
    retailHandler.forceEndActivity();
  } else {
    recorder.stopBuffer();
  }
};

/**
 * Check Windows task list and find any WoW process.
 */
const checkWoWProcess = async (): Promise<IWoWProcessResult[]> => {
  const wowProcessRx = new RegExp(/(wow(T|B|classic)?)\.exe/, 'i');
  const taskList = await tasklist();

  return taskList
    // Map all processes found to check if they match `wowProcessRx`
    .map((p: any) => p.imageName.match(wowProcessRx))
    // Remove those that result in `null` (didn't match)
    .filter((p: any) => p)
    // Return an object suitable for `IWoWProcessResult`
    .map((match: any): IWoWProcessResult => ({
      exe: match[0],
      flavour: wowExecutableFlavours[match[1].toLowerCase()]
    }))
  ;
}

/**
 * pollWoWProcessLogic
 */
const pollWoWProcessLogic = async () => {
  const wowProcesses = await checkWoWProcess();
  const processesToRecord = wowProcesses.filter((e) => { return filterFlavoursByConfig(cfg, e) });
  const firstProcessToRecord = processesToRecord.pop();

  if ((wowProcessRunning === null) && firstProcessToRecord) {
    wowProcessStarted(firstProcessToRecord);
  } else if (wowProcessRunning !== null && !firstProcessToRecord) {
    wowProcessStopped();
  }
}

/**
 * pollWoWProcess
 */
const pollWowProcess = () => {
  // If we've re-called this we need to reset the current state of process 
  // tracking. This is important for settings updates. 
  resetProcessTracking();

  // Run a check without waiting for the timeout. 
  pollWoWProcessLogic();

  if (pollWowProcessInterval) {
    clearInterval(pollWowProcessInterval);
  }

  pollWowProcessInterval = setInterval(pollWoWProcessLogic, 5000);
}

/**
 * Setup retail log handler.
 */
 const makeRetailHandler = (recorder: Recorder, logPath: string, cfg: ConfigService): RetailLogHandler => {
  const parser = new CombatLogParser();
  parser.watchPath(logPath);
  return RetailLogHandler.getInstance(recorder, parser, cfg);
}

/**
* Setup classic log handler.
*/
const makeClassicHandler = (recorder: Recorder, logPath: string, cfg: ConfigService): ClassicLogHandler => {
  const parser = new CombatLogParser();
  parser.watchPath(logPath);
  return ClassicLogHandler.getInstance(recorder, parser, cfg);
}


export {
  mainWindow,
  recorder,
  retailHandler,
  classicHandler,
};

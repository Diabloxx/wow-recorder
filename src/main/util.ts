/* eslint global-require: off, no-console: off, promise/always-return: off */
import { URL } from 'url';
import path from 'path';
import fs, { promises as fspromise } from 'fs';
import { app, BrowserWindow, Display, net, screen } from 'electron';
import {
  EventType,
  uIOhook,
  UiohookKeyboardEvent,
  UiohookMouseEvent,
} from 'uiohook-napi';
import checkDiskSpace from 'check-disk-space';
import { PTTEventType, PTTKeyPressEvent } from '../types/KeyTypesUIOHook';
import {
  Metadata,
  FileInfo,
  FileSortDirection,
  OurDisplayType,
  RendererVideo,
  FlavourConfig,
  ObsAudioConfig,
  CrashData,
  CloudObject,
} from './types';
import { VideoCategory } from '../types/VideoCategory';

/**
 * When packaged, we need to fix some paths
 */
const fixPathWhenPackaged = (pathSpec: string) => {
  return pathSpec.replace('app.asar', 'app.asar.unpacked');
};

/**
 * Setup logging.
 *
 * This works by overriding console log methods. All console log method will
 * go to both the console if it exists, and a file on disk.
 *
 * This only applies to main process console logs, not the renderer logs.
 */
const setupApplicationLogging = () => {
  const log = require('electron-log');
  const date = new Date().toISOString().slice(0, 10);
  const logRelativePath = `logs/WarcraftRecorder-${date}.log`;
  const logPath = fixPathWhenPackaged(path.join(__dirname, logRelativePath));
  log.transports.file.resolvePath = () => logPath;
  Object.assign(console, log.functions);
  return path.dirname(logPath);
};

const { exec } = require('child_process');

const getResolvedHtmlPath = () => {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;

    return (htmlFileName: string) => {
      const url = new URL(`http://localhost:${port}`);
      url.pathname = htmlFileName;
      return url.href;
    };
  }

  return (htmlFileName: string) => {
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
  };
};

export const resolveHtmlPath = getResolvedHtmlPath();

/**
 * Return information about a file needed for various parts of the application
 */
export const getFileInfo = async (pathSpec: string): Promise<FileInfo> => {
  const filePath = path.resolve(pathSpec);
  const fstats = await fspromise.stat(filePath);
  const mtime = fstats.mtime.getTime();
  const birthTime = fstats.birthtime.getTime();
  const { size } = fstats;
  return { name: filePath, size, mtime, birthTime };
};

/**
 * Asynchronously find and return a list of files in the given directory,
 * that matches the given pattern sorted by modification time according
 * to `sortDirection`. Ensure to properly escape patterns, e.g. ".*\\.mp4".
 */
const getSortedFiles = async (
  dir: string,
  pattern: string,
  sortDirection: FileSortDirection = FileSortDirection.NewestFirst
): Promise<FileInfo[]> => {
  // We use fs.promises.readdir here instead of glob, which we used to
  // use but it caused problems with NFS paths, see this issue:
  // https://github.com/isaacs/node-glob/issues/74.
  const files = (await fs.promises.readdir(dir))
    .filter((f) => f.match(new RegExp(pattern)))
    .map((f) => path.join(dir, f));

  const mappedFileInfo: FileInfo[] = [];

  for (let i = 0; i < files.length; i++) {
    // This loop can take a bit of time so we're deliberately
    // awaiting inside the loop to not induce a 1000ms periodic
    // freeze on the frontend. Probably can do better here,
    // suspect something in getFileInfo isn't as async as it could be.
    // If that can be solved, then we can drop the await here and then
    // do an await Promises.all() on the following line.
    // eslint-disable-next-line no-await-in-loop
    mappedFileInfo.push(await getFileInfo(files[i]));
  }

  if (sortDirection === FileSortDirection.NewestFirst) {
    return mappedFileInfo.sort((A: FileInfo, B: FileInfo) => B.mtime - A.mtime);
  }

  return mappedFileInfo.sort((A: FileInfo, B: FileInfo) => A.mtime - B.mtime);
};

/**
 * Get sorted video files. Shorthand for `getSortedFiles()` because it's used in quite a few places
 */
const getSortedVideos = async (
  storageDir: string,
  sortDirection: FileSortDirection = FileSortDirection.NewestFirst
): Promise<FileInfo[]> => {
  return getSortedFiles(storageDir, '.*\\.mp4', sortDirection);
};

/**
 * Get the filename for the metadata file associated with the given video file.
 */
const getMetadataFileNameForVideo = (video: string) => {
  const videoFileName = path.basename(video, '.mp4');
  const videoDirName = path.dirname(video);
  return path.join(videoDirName, `${videoFileName}.json`);
};

/**
 * Get the filename for the thumbnail file associated with the given video file.
 */
const getThumbnailFileNameForVideo = (video: string) => {
  const videoFileName = path.basename(video, '.mp4');
  const videoDirName = path.dirname(video);
  return path.join(videoDirName, `${videoFileName}.png`);
};

/**
 * Get the metadata object for a video from the accompanying JSON file.
 */
const getMetadataForVideo = async (video: string) => {
  const metadataFilePath = getMetadataFileNameForVideo(video);
  await fspromise.access(metadataFilePath);
  const metadataJSON = await fspromise.readFile(metadataFilePath);
  const metadata = JSON.parse(metadataJSON.toString()) as Metadata;
  return metadata;
};

/**
 * Try to unlink a file and return a boolean indicating the success
 * Logs any errors to the console, if the file couldn't be deleted for some reason.
 */
const tryUnlink = async (file: string): Promise<boolean> => {
  try {
    console.info(`[Util] Deleting: ${file}`);
    await fspromise.access(file);
    await fs.promises.unlink(file);
    return true;
  } catch (e) {
    console.error(`[Util] Unable to delete file: ${file}.`);
    console.error((e as Error).message);
    return false;
  }
};

/**
 * Delete a video and its metadata file if it exists.
 */
const deleteVideoDisk = async (videoPath: string) => {
  console.info('[Util] Deleting video', videoPath);
  const success = await tryUnlink(videoPath);

  if (!success) {
    // If we can't delete the video file, make sure we don't delete the metadata
    // file either, which would leave the video file dangling.
    return;
  }

  const metadataPath = getMetadataFileNameForVideo(videoPath);
  await tryUnlink(metadataPath);

  const thumbnailPath = getThumbnailFileNameForVideo(videoPath);
  await tryUnlink(thumbnailPath);
};

/**
 * Delete a video and it's accompanying files after a short delay. Use case
 * is when we are mid refresh of the frontend and spot a video marked for
 * deletion in its metadata.
 *
 * We can't always immediately delete the video because the frontend might
 * have it open, but once the refresh has kicked in we're safe as we won't
 * display a video marked for delete.
 *
 * The timeout of 2000 is somewhat arbitrary, don't want to be too long
 * in-case we go through multiple refreshes and set a bunch of timers
 * to delete the same file. Not the end of the world either way, just
 * looks ugly in logs.
 */
const delayedDeleteVideo = (video: RendererVideo) => {
  const src = video.videoSource;
  console.info('[Util] Will soon remove a video marked for deletion', src);

  setTimeout(() => {
    console.info('[Util] Removing a video marked for deletion', src);
    deleteVideoDisk(video.videoSource);
  }, 2000);
};

/**
 * Load video details from the metadata and add it to videoState.
 */
const loadVideoDetailsDisk = async (
  video: FileInfo
): Promise<RendererVideo> => {
  try {
    const metadata = await getMetadataForVideo(video.name);
    const thumbnailSource = getThumbnailFileNameForVideo(video.name);

    return {
      ...metadata,
      name: path.basename(video.name),
      mtime: video.mtime,
      videoSource: video.name,
      thumbnailSource,
      isProtected: Boolean(metadata.protected),
      size: video.size,
      cloud: false,
      multiPov: [],
    };
  } catch (error) {
    // Just log it and rethrow. Want this to be diagnosable.
    console.warn('[Manager] Failed to load video:', video.name, String(error));
    throw error;
  }
};

const loadAllVideosDisk = async (
  storageDir: string
): Promise<RendererVideo[]> => {
  if (!storageDir) {
    return [];
  }

  const videos = await getSortedVideos(storageDir);

  if (videos.length === 0) {
    return [];
  }

  const videoDetailPromises = videos.map((video) =>
    loadVideoDetailsDisk(video)
  );

  // Await all the videoDetailsPromises to settle, and then remove any
  // that were rejected. This can happen if there is a missing metadata file.
  const videoDetails: RendererVideo[] = (
    await Promise.all(videoDetailPromises.map((p) => p.catch((e) => e)))
  ).filter((result) => !(result instanceof Error));

  // Any details marked for deletion do it now. We allow for this flag to be
  // set in the metadata to give us a robust mechanism for removing a video
  // that may be open in the player. We hide it from the state as part of a
  // refresh, that guarentees it cannot be loaded in the player.
  videoDetails.filter((video) => video.delete).forEach(delayedDeleteVideo);

  // Return this list of videos without those marked for deletion which may still
  // exist for a short time.
  return videoDetails.filter((video) => !video.delete);
};

/**
 * Writes video metadata asynchronously and returns a Promise
 */
const writeMetadataFile = async (videoPath: string, metadata: Metadata) => {
  console.info('[Util] Write Metadata file', videoPath);

  const metadataFileName = getMetadataFileNameForVideo(videoPath);
  const jsonString = JSON.stringify(metadata, null, 2);

  fspromise.writeFile(metadataFileName, jsonString, {
    encoding: 'utf-8',
  });
};

/**
 * Open a folder in system explorer.
 */
const openSystemExplorer = (filePath: string) => {
  const windowsPath = filePath.replace(/\//g, '\\');
  const cmd = `explorer.exe /select,"${windowsPath}"`;
  exec(cmd, () => {});
};

/**
 * Put a save marker on a video, protecting it from the file monitor.
 */
const toggleVideoProtectedDisk = async (videoPath: string) => {
  let metadata;

  try {
    metadata = await getMetadataForVideo(videoPath);
  } catch (err) {
    console.error(
      `[Util] Metadata not found for '${videoPath}', but somehow we managed to load it. This shouldn't happen.`
    );

    return;
  }

  if (metadata.protected === undefined) {
    console.info(`[Util] User protected ${videoPath}`);
    metadata.protected = true;
  } else {
    metadata.protected = !metadata.protected;

    console.info(
      `[Util] User toggled protection on ${videoPath}, now ${metadata.protected}`
    );
  }

  await writeMetadataFile(videoPath, metadata);
};

/**
 * Tag a video.
 */
const tagVideoDisk = async (videoPath: string, tag: string) => {
  let metadata;

  try {
    metadata = await getMetadataForVideo(videoPath);
  } catch (err) {
    console.error(
      `[Util] Metadata not found for '${videoPath}', but somehow we managed to load it. This shouldn't happen.`
    );

    return;
  }

  if (!tag || !/\S/.test(tag)) {
    // empty or whitespace only
    console.info('[Util] User removed tag');
    metadata.tag = undefined;
  } else {
    console.info('[Util] User tagged', videoPath, 'with', tag);
    metadata.tag = tag;
  }

  await writeMetadataFile(videoPath, metadata);
};

/**
 * Get a text string that indicates the physical position of a display depending
 * on its index.
 */
const getDisplayPhysicalPosition = (count: number, index: number): string => {
  if (index === 0) return 'Left';
  if (index === count - 1) return 'Right';

  return `Middle #${index}`;
};

/**
 * Get and return a list of available displays on the system sorted by their
 * physical position.
 *
 * This makes no attempts at being perfect - it completely ignores the `bounds.y`
 * property for people who might have stacked their displays vertically rather than
 * horizontally. This is okay.
 */
const getAvailableDisplays = (): OurDisplayType[] => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const allDisplays = screen.getAllDisplays();

  // Create an unsorted list of Display IDs to zero based monitor index
  // So we're can use that index later, after sorting the displays according
  // to their physical location.
  const displayIdToIndex: { [key: number]: number } = {};

  allDisplays.forEach((display: Display, index: number) => {
    displayIdToIndex[display.id] = index;
  });

  // Iterate over all available displays and make our own list with the
  // relevant attributes and some extra stuff to make it easier for the
  // frontend.
  const ourDisplays: OurDisplayType[] = [];
  const numberOfMonitors = allDisplays.length;

  allDisplays
    .sort((A: Display, B: Display) => A.bounds.x - B.bounds.x)
    .forEach((display: Display, index: number) => {
      const isPrimary = display.id === primaryDisplay.id;
      const displayIndex = displayIdToIndex[display.id];
      const { width, height } = display.size;

      ourDisplays.push({
        id: display.id,
        index: displayIndex,
        physicalPosition: getDisplayPhysicalPosition(numberOfMonitors, index),
        primary: isPrimary,
        displayFrequency: display.displayFrequency,
        depthPerComponent: display.depthPerComponent,
        size: display.size,
        scaleFactor: display.scaleFactor,
        aspectRatio: width / height,
        physicalSize: {
          width: Math.floor(width * display.scaleFactor),
          height: Math.floor(height * display.scaleFactor),
        },
      });
    });

  return ourDisplays;
};

/**
 * Checks for updates from the releases page on github, and, if there is a
 * new version, sends a message to the main window to display a notification.
 */
const checkAppUpdate = (mainWindow: BrowserWindow | null = null) => {
  const options = {
    hostname: 'api.github.com',
    protocol: 'https:',
    path: '/repos/aza547/wow-recorder/releases/latest',
    method: 'GET',
    headers: {
      'User-Agent': 'wow-recorder',
    },
  };

  const request = net.request(options);

  request.on('response', (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      if (response.statusCode !== 200) {
        console.error(
          `[Main] Failed to check for updates, status code: ${response.statusCode}`
        );
        return;
      }

      const release = JSON.parse(data);
      const latestVersion = release.tag_name;
      const link = release.assets[0].browser_download_url;

      if (latestVersion !== app.getVersion() && latestVersion && link) {
        console.info('[Util] New version available:', latestVersion);
        if (mainWindow === null) return;
        mainWindow.webContents.send('updateUpgradeStatus', true, link);
      }
    });
  });

  request.on('error', (error) => {
    console.error(`[Main] Failed to check for updates: ${error}`);
  });

  request.end();
};

const deferredPromiseHelper = <T>() => {
  let resolveHelper!: (value: T | PromiseLike<T>) => void;
  let rejectHelper!: (reason?: any) => void;

  const promise = new Promise<T>((resolve, reject) => {
    resolveHelper = resolve;
    rejectHelper = reject;
  });

  return { resolveHelper, rejectHelper, promise };
};

const getAssetPath = (...paths: string[]): string => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  return path.join(RESOURCES_PATH, ...paths);
};

/**
 * Find and return the flavour of WoW that the log directory
 * belongs to by means of the '.flavor.info' file.
 */
const getWowFlavour = (pathSpec: string): string => {
  const flavourInfoFile = path.normalize(
    path.join(pathSpec, '../.flavor.info')
  );

  // If this file doesn't exist, it's not a subdirectory of a WoW flavour.
  if (!fs.existsSync(flavourInfoFile)) {
    return 'unknown';
  }

  const content = fs.readFileSync(flavourInfoFile).toString().split('\n');

  return content.length > 1 ? content[1] : 'unknown';
};

/**
 * Updates the status icon for the application.
 * @param status the status number
 */
const addCrashToUI = (mainWindow: BrowserWindow, crashData: CrashData) => {
  console.info('[Util] Updating crashes with:', crashData);
  mainWindow.webContents.send('updateCrashes', crashData);
};

/**
 * Checks the flavour config is valid.
 * @throws an error describing why the config is invalid
 */
const validateFlavour = (config: FlavourConfig) => {
  const {
    recordRetail,
    retailLogPath,
    recordClassic,
    classicLogPath,
    recordEra,
    eraLogPath,
  } = config;

  if (recordRetail) {
    const validFlavours = ['wow', 'wowxptr'];
    const validPath = validFlavours.includes(getWowFlavour(retailLogPath));

    if (!validPath) {
      console.error('[Util] Invalid retail log path', retailLogPath);
      throw new Error('Invalid retail log path');
    }
  }

  if (recordClassic && getWowFlavour(classicLogPath) !== 'wow_classic') {
    console.error('[Util] Invalid classic log path', classicLogPath);
    throw new Error('Invalid classic log path');
  }

  if (recordEra && getWowFlavour(eraLogPath) !== 'wow_classic_era') {
    console.error('[Util] Invalid era log path', eraLogPath);
    throw new Error('Invalid era log path');
  }
};

const isPushToTalkHotkey = (
  config: ObsAudioConfig,
  event: PTTKeyPressEvent
) => {
  const { keyCode, mouseButton, altKey, ctrlKey, shiftKey, metaKey } = event;
  const { pushToTalkKey, pushToTalkMouseButton, pushToTalkModifiers } = config;

  const buttonMatch =
    (keyCode > 0 && keyCode === pushToTalkKey) ||
    (mouseButton > 0 && mouseButton === pushToTalkMouseButton);

  if (event.type === PTTEventType.EVENT_KEY_RELEASED) {
    // If they release the button we ignore modifier config. That covers mainline
    // use of regular key and modifier but also naked modifier key as the PTT hoykey
    // which doesnt show a modifier on release.
    return buttonMatch;
  }

  let modifierMatch = true;

  // Deliberately permissive here, we check all the modifiers we have in
  // config are met but we don't enforce the inverse, i.e. we'll accept
  // an additional modifier present (so CTRL + SHIFT + E will trigger
  // a CTRL + E hotkey).
  pushToTalkModifiers.split(',').forEach((mod) => {
    if (mod === 'alt') modifierMatch = altKey;
    if (mod === 'ctrl') modifierMatch = ctrlKey;
    if (mod === 'shift') modifierMatch = shiftKey;
    if (mod === 'win') modifierMatch = metaKey;
  });

  return buttonMatch && modifierMatch;
};

const convertUioHookKeyPressEvent = (
  event: UiohookKeyboardEvent,
  type: PTTEventType
): PTTKeyPressEvent => {
  return {
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
    keyCode: event.keycode,
    mouseButton: -1,
    type,
  };
};

const convertUioHookMousePressEvent = (
  event: UiohookMouseEvent,
  type: PTTEventType
): PTTKeyPressEvent => {
  return {
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
    keyCode: -1,
    mouseButton: event.button as number,
    type,
  };
};

const convertUioHookEvent = (
  event: UiohookKeyboardEvent | UiohookMouseEvent
): PTTKeyPressEvent => {
  if (event.type === EventType.EVENT_KEY_PRESSED) {
    return convertUioHookKeyPressEvent(
      event as UiohookKeyboardEvent,
      PTTEventType.EVENT_MOUSE_PRESSED
    );
  }

  if (event.type === EventType.EVENT_KEY_RELEASED) {
    return convertUioHookKeyPressEvent(
      event as UiohookKeyboardEvent,
      PTTEventType.EVENT_KEY_RELEASED
    );
  }

  if (event.type === EventType.EVENT_MOUSE_PRESSED) {
    return convertUioHookMousePressEvent(
      event as UiohookMouseEvent,
      PTTEventType.EVENT_MOUSE_PRESSED
    );
  }

  if (event.type === EventType.EVENT_MOUSE_RELEASED) {
    return convertUioHookMousePressEvent(
      event as UiohookMouseEvent,
      PTTEventType.EVENT_MOUSE_RELEASED
    );
  }

  return {
    altKey: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    keyCode: -1,
    mouseButton: -1,
    type: PTTEventType.UNKNOWN,
  };
};

const nextKeyPressPromise = (): Promise<PTTKeyPressEvent> => {
  return new Promise((resolve) => {
    uIOhook.once('keyup', (event) => {
      resolve(convertUioHookEvent(event));
    });
  });
};

const nextMousePressPromise = (): Promise<PTTKeyPressEvent> => {
  return new Promise((resolve) => {
    // Deliberatly 'mousedown' else we fire on the initial click
    // and always get mouse button 1.
    uIOhook.once('mousedown', (event) => {
      resolve(convertUioHookEvent(event));
    });
  });
};

const getPromiseBomb = (fuse: number, reason: string) => {
  return new Promise((_resolve, reject) => setTimeout(reject, fuse, reason));
};

const buildClipMetadata = (initial: Metadata, duration: number) => {
  const final = initial;
  final.duration = duration;
  final.parentCategory = initial.category;
  final.category = VideoCategory.Clips;
  final.protected = true;
  return final;
};

const getOBSFormattedDate = (date: Date) => {
  const toFixedDigits = (n: number, d: number) =>
    n.toLocaleString('en-US', { minimumIntegerDigits: d, useGrouping: false });

  const day = toFixedDigits(date.getDate(), 2);
  const month = toFixedDigits(date.getMonth() + 1, 2);
  const year = toFixedDigits(date.getFullYear(), 4);

  const secs = toFixedDigits(date.getSeconds(), 2);
  const mins = toFixedDigits(date.getMinutes(), 2);
  const hours = toFixedDigits(date.getHours(), 2);

  return `${year}-${month}-${day} ${hours}-${mins}-${secs}`;
};

/**
 * Check a disk has the required free space, including any files in the
 * directory currently.
 * @param dir folder to check
 * @param req size required in GB
 */
const checkDisk = async (dir: string, req: number) => {
  const files = await getSortedFiles(dir, '.*');
  let inUseBytes = 0;

  files.forEach((file) => {
    inUseBytes += file.size;
  });

  let space;

  try {
    space = await checkDiskSpace(dir);
  } catch (error) {
    // If we fail to check how much space is free then just log a warning and
    // return, we don't want to fail config validation in this case. See issue 478.
    console.warn('[Util] Failed to get free disk space from OS');
    console.warn(String(error));
    return;
  }

  const disk = space.diskPath;
  const freeBytes = space.free;
  const reqBytes = req * 1024 ** 3 - inUseBytes;

  if (freeBytes < reqBytes) {
    const msg = `Disk '${disk}' does not have enough free space, needs ${req}GB.`;
    console.error(`Disk check failed: ${msg}`);
    throw new Error(msg);
  }
};

/**
 * We use start as the preference here: the genuine start date of the activity.
 * It was only added for cloud support, so if it doesn't exist, fallback to
 * the mtime which is particularly worse on cloud storage. It worked fine on
 * disk storage where there is no upload delay.
 */
const reverseChronologicalVideoSort = (A: RendererVideo, B: RendererVideo) => {
  const metricA = A.start ? A.start : A.mtime;
  const metricB = B.start ? B.start : B.mtime;
  return metricB - metricA;
};

/**
 * Splits a key, extracts the timestamp and sorts in chronological
 * order over it. Expects a key in the form "2v2/1712263735000/<name>"
 * but also handles the old format of "<name>" by putting to the end
 * of the sort.
 */
const chronologicalKeySort = (A: CloudObject, B: CloudObject) => {
  const splitA = A.key.split('/');
  const splitB = B.key.split('/');

  const timeA = splitA.length < 3 ? 0 : splitA[1];
  const timeB = splitB.length < 3 ? 0 : splitB[1];

  if (timeA > timeB) {
    return -1;
  }

  return 1;
};

/**
 * Check if two dates are within sec of each other.
 */
const areDatesWithinSeconds = (d1: Date, d2: Date, sec: number) => {
  const differenceMilliseconds = Math.abs(d1.getTime() - d2.getTime());
  const millisecondsInMinute = sec * 1000; // 60 seconds * 1000 milliseconds
  return differenceMilliseconds <= millisecondsInMinute;
};

/**
 * Re-write the metadata file on disk with a flag saying the video should
 * NOT be loaded, and should be deleted at earliest conviencence.
 *
 * This helps us avoid any scenario where we attempt and fail to delete a
 * video open by the player.
 */
const markForVideoForDelete = async (videoPath: string) => {
  try {
    const metadata = await getMetadataForVideo(videoPath);
    metadata.delete = true;
    await writeMetadataFile(videoPath, metadata);
  } catch (error) {
    // This isn't a total disaster, but might cause some duplicates to
    // display in the UI; i.e. a cloud and disk version of the same video.
    // Just log it so it's diagnosable, a user could fix it easily with a
    // manual delete.
    console.error(
      '[Util] Failed to mark a video for deletion',
      videoPath,
      String(error)
    );
  }
};

/**
 * Sort alphabetically by player name.
 */
const povNameSort = (a: RendererVideo, b: RendererVideo) => {
  const playerA = a.player?._name;
  const playerB = b.player?._name;
  if (!playerA || !playerB) return 0;
  return playerA.localeCompare(playerB);
};

export {
  setupApplicationLogging,
  loadAllVideosDisk,
  writeMetadataFile,
  deleteVideoDisk,
  openSystemExplorer,
  toggleVideoProtectedDisk,
  fixPathWhenPackaged,
  getSortedVideos,
  getAvailableDisplays,
  getSortedFiles,
  tryUnlink,
  checkAppUpdate,
  getMetadataForVideo,
  deferredPromiseHelper,
  getThumbnailFileNameForVideo,
  getAssetPath,
  getWowFlavour,
  validateFlavour,
  isPushToTalkHotkey,
  nextKeyPressPromise,
  nextMousePressPromise,
  convertUioHookEvent,
  getPromiseBomb,
  addCrashToUI,
  buildClipMetadata,
  getOBSFormattedDate,
  checkDisk,
  tagVideoDisk,
  getMetadataFileNameForVideo,
  loadVideoDetailsDisk,
  reverseChronologicalVideoSort,
  areDatesWithinSeconds,
  markForVideoForDelete,
  povNameSort,
  chronologicalKeySort,
};

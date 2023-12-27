/**
 * Please keep this file FREE from filesystem/Node JS process related code as it
 * is used in both the backend and the frontend, and the frontend does not have
 * access to import 'fs', for example.
 *
 * It is okay to import things from other modules that import 'fs' as long as you don't
 * import a function that uses the 'fs' module. You'll very easily find out if what you
 * did was bad, because the render process will show its "Red Screen of Death".
 */
import {
  dungeonEncounters,
  dungeonsByMapId,
  instanceDifficulty,
  instanceEncountersById,
  months,
  specializationById,
  WoWCharacterClassType,
  WoWClassColor,
} from 'main/constants';
import { TimelineSegmentType } from 'main/keystone';
import {
  Colors,
  DeathMarkers,
  Encoder,
  EncoderType,
  IOBSDevice,
  PlayerDeathType,
  RawChallengeModeTimelineSegment,
  RendererVideo,
  RendererVideoState,
  SoloShuffleTimelineSegment,
  VideoMarker,
} from 'main/types';
import { ambiguate } from 'parsing/logutils';
import { VideoCategory } from 'types/VideoCategory';
import { ESupportedEncoders } from 'main/obsEnums';
import { PTTKeyPressEvent, UiohookModifierKeyMap } from 'types/KeyTypesUIOHook';
import { ConfigurationSchema } from 'main/configSchema';

const getVideoResult = (video: RendererVideo): boolean => {
  return video.result;
};

/**
 * Returns a string of the form MM:SS.
 */
const getFormattedDuration = (video: RendererVideo) => {
  const { duration } = video;
  const durationDate = new Date(0);
  durationDate.setTime(duration * 1000);
  const formattedDuration = durationDate.toISOString().substr(14, 5);
  return formattedDuration;
};

/**
 * Return an array of death markers for a video.
 * @param video the RendereVideo data type for the video
 * @param ownOnly true if should only get the players deaths
 */
const getOwnDeathMarkers = (video: RendererVideo) => {
  const videoMarkers: VideoMarker[] = [];
  const { player } = video;

  if (video.deaths === undefined) {
    return videoMarkers;
  }

  video.deaths.forEach((death: PlayerDeathType) => {
    const [name] = ambiguate(death.name);
    const markerText = `Death (${name})`;
    let color: string;

    if (death.friendly) {
      color = 'red';
    } else {
      color = Colors.UNCOMMON;
    }

    if (!player || !player._name) {
      return;
    }

    if (player._name === name) {
      videoMarkers.push({
        time: death.timestamp,
        text: markerText,
        color,
        duration: 5,
        class: 'vjs-marker',
      });
    }
  });

  return videoMarkers;
};

/**
 * Return an array of death markers for a video.
 * @param video the RendereVideo data type for the video
 * @param ownOnly true if should only get the players deaths
 */
const getAllDeathMarkers = (video: RendererVideo) => {
  const videoMarkers: VideoMarker[] = [];

  if (video.deaths === undefined) {
    return videoMarkers;
  }

  video.deaths.forEach((death: PlayerDeathType) => {
    const [name] = ambiguate(death.name);
    const markerText = `Death (${name})`;
    let color: string;

    if (death.friendly) {
      color = 'red';
    } else {
      color = Colors.UNCOMMON;
    }

    videoMarkers.push({
      time: death.timestamp,
      text: markerText,
      color,
      duration: 5,
      class: 'vjs-marker',
    });
  });

  return videoMarkers;
};

/**
 * Return an array of markers for a solo shuffle. This is markers for each
 * round, colored green for wins or red for losses.
 */
const getRoundMarkers = (video: RendererVideo) => {
  const videoMarkers: VideoMarker[] = [];

  if (video.soloShuffleTimeline === undefined) {
    return videoMarkers;
  }

  video.soloShuffleTimeline.forEach((segment: SoloShuffleTimelineSegment) => {
    let markerText = `Round ${segment.round}`;
    let color: string;

    if (segment.result) {
      markerText = `${markerText} (Win)`;
      color = Colors.UNCOMMON;
    } else {
      markerText = `${markerText} (Loss)`;
      color = 'red';
    }

    // Older solo shuffle segments don't have a duration.
    const duration = segment.duration ? segment.duration : 5;

    videoMarkers.push({
      time: segment.timestamp,
      text: markerText,
      color,
      duration,
      class: 'vjs-marker-hatched',
    });
  });

  return videoMarkers;
};

/**
 * Return an array of markers for a challenge mode, this highlights the boss
 * encounters as orange and the trash as purple.
 */
const getEncounterMarkers = (video: RendererVideo) => {
  const videoMarkers: VideoMarker[] = [];

  if (video.challengeModeTimeline === undefined) {
    return videoMarkers;
  }

  video.challengeModeTimeline.forEach(
    (segment: RawChallengeModeTimelineSegment) => {
      if (
        segment.logEnd === undefined ||
        segment.logStart === undefined ||
        segment.segmentType === undefined ||
        segment.segmentType !== TimelineSegmentType.BossEncounter ||
        segment.timestamp === undefined
      ) {
        return;
      }

      const segmentEnd = new Date(segment.logEnd);
      const segmentStart = new Date(segment.logStart);

      const segmentDuration = Math.floor(
        (segmentEnd.getTime() - segmentStart.getTime()) / 1000
      );

      let markerText = '';

      if (segment.encounterId !== undefined) {
        markerText = dungeonEncounters[segment.encounterId];
      }

      videoMarkers.push({
        time: segment.timestamp,
        text: markerText,
        color: Colors.EPIC,
        duration: segmentDuration,
        class: 'vjs-marker-hatched',
      });
    }
  );

  return videoMarkers;
};

const getWoWClassColor = (unitClass: WoWCharacterClassType) => {
  return WoWClassColor[unitClass];
};

const getNumVideos = (videoState: RendererVideoState) => {
  let numVideos = 0;

  Object.values(videoState).forEach((videoList: RendererVideo[]) => {
    Object.values(videoList).forEach(() => {
      numVideos += 1;
    });
  });

  return numVideos;
};

const getTotalDuration = (videoState: RendererVideoState) => {
  let totalDuration = 0;

  Object.values(videoState).forEach((videoList: RendererVideo[]) => {
    Object.values(videoList).forEach((video: RendererVideo) => {
      totalDuration += video.duration;
      totalDuration += video.overrun;
    });
  });

  return totalDuration;
};

const getLatestCategory = (videoState: RendererVideoState) => {
  const categories = Object.values(VideoCategory);
  const latestVideoDate: number[] = [];

  categories.forEach((category) => {
    const firstVideo = videoState[category][0];

    if (firstVideo !== undefined) {
      latestVideoDate.push(firstVideo.mtime);
    } else {
      latestVideoDate.push(0);
    }
  });

  const latestDate = Math.max(...latestVideoDate);
  const latestDateIndex = latestVideoDate.indexOf(latestDate);
  return categories[latestDateIndex];
};

const getSortedVideos = (videoState: RendererVideoState) => {
  const categories = Object.values(VideoCategory);
  const allVideos: RendererVideo[] = [];

  categories.forEach((category) => {
    videoState[category].forEach((vid) => {
      allVideos.push(vid);
    });
  });

  // Sort in reverse chronological order.
  const sortedVideos = allVideos.sort((a, b) => {
    const dateA = a.mtime;
    const dateB = b.mtime;
    return dateA > dateB ? -1 : 1;
  });

  return sortedVideos;
};

/**
 * Get empty video state. This is duplicated here because we can't access
 * it in utils.ts on the frontend.
 */
const getEmptyState = () => {
  const videoState: RendererVideoState = {
    [VideoCategory.TwoVTwo]: [],
    [VideoCategory.ThreeVThree]: [],
    [VideoCategory.FiveVFive]: [],
    [VideoCategory.Skirmish]: [],
    [VideoCategory.SoloShuffle]: [],
    [VideoCategory.MythicPlus]: [],
    [VideoCategory.Raids]: [],
    [VideoCategory.Battlegrounds]: [],
    [VideoCategory.Clips]: [],
  };

  return videoState;
};

const getInstanceDifficultyText = (video: RendererVideo) => {
  const { difficultyID } = video;

  if (difficultyID === undefined) {
    return '';
  }

  const knownDifficulty = Object.prototype.hasOwnProperty.call(
    instanceDifficulty,
    difficultyID
  );

  if (!knownDifficulty) {
    return '';
  }

  return instanceDifficulty[difficultyID].difficulty;
};

/**
 * Get the name of a boss encounter based on its encounter ID. Ideally we
 * would just write this to the metadata and not have to re-calulate on the
 * frontend.
 */
const getEncounterNameById = (encounterId: number): string => {
  const recognisedEncounter = Object.prototype.hasOwnProperty.call(
    instanceEncountersById,
    encounterId
  );

  if (recognisedEncounter) {
    return instanceEncountersById[encounterId];
  }

  return 'Unknown Boss';
};

/**
 * Get the dungeon name if possible, else an empty string.
 */
const getDungeonName = (video: RendererVideo) => {
  const { mapID } = video;

  if (mapID !== undefined) {
    return dungeonsByMapId[mapID];
  }

  return '';
};

const isMythicPlusUtil = (video: RendererVideo) => {
  const { category, parentCategory } = video;

  return (
    category === VideoCategory.MythicPlus ||
    parentCategory === VideoCategory.MythicPlus
  );
};

const isRaidUtil = (video: RendererVideo) => {
  const { category, parentCategory } = video;

  return (
    category === VideoCategory.Raids || parentCategory === VideoCategory.Raids
  );
};

const isBattlegroundUtil = (video: RendererVideo) => {
  const { category, parentCategory } = video;

  return (
    category === VideoCategory.Battlegrounds ||
    parentCategory === VideoCategory.Battlegrounds
  );
};

const isSoloShuffleUtil = (video: RendererVideo) => {
  const { category, parentCategory } = video;

  return (
    category === VideoCategory.SoloShuffle ||
    parentCategory === VideoCategory.SoloShuffle
  );
};

const isArenaUtil = (video: RendererVideo) => {
  return (
    !isMythicPlusUtil(video) && !isRaidUtil(video) && !isBattlegroundUtil(video)
  );
};

const isClipUtil = (video: RendererVideo) => {
  const { category } = video;
  return category === VideoCategory.Clips;
};

const getResultColor = (video: RendererVideo) => {
  const { result, soloShuffleRoundsWon } = video;

  if (isSoloShuffleUtil(video)) {
    if (
      soloShuffleRoundsWon !== undefined &&
      soloShuffleRoundsWon >= 0 &&
      soloShuffleRoundsWon <= 6
    ) {
      // This is linear gradient from red to green, in RBG format as I don't know
      // a better way to pass it through. Generated with: https://cssgradient.io/.
      // The key is the number of wins.
      const soloShuffleResultColors = [
        'rgb(53,  164, 50, 0.3)',
        'rgb(46,  171, 27, 0.3)',
        'rgb(112, 170, 30, 0.3)',
        'rgb(171, 150, 30, 0.3)',
        'rgb(171, 86,  26, 0.3)',
        'rgb(175, 50,  23, 0.3)',
        'rgb(156, 21,  21, 0.3)',
      ].reverse();

      return soloShuffleResultColors[soloShuffleRoundsWon];
    }
  }

  if (result) {
    return 'rgb(53, 164, 50, 0.3)';
  }

  return 'rgb(156, 21, 21, 0.3)';
};

const getPlayerName = (video: RendererVideo) => {
  const { player } = video;

  if (player === undefined) {
    return '';
  }

  if (player._name === undefined) {
    return '';
  }

  return player._name;
};

const getPlayerRealm = (video: RendererVideo) => {
  const { player } = video;

  if (player === undefined) {
    return '';
  }

  if (player._realm === undefined) {
    return '';
  }

  return player._realm;
};

const getPlayerSpecID = (video: RendererVideo) => {
  const { player } = video;

  if (player === undefined) {
    return 0;
  }

  if (player._specID === undefined) {
    return 0;
  }

  const knownSpec = Object.prototype.hasOwnProperty.call(
    specializationById,
    player._specID
  );

  if (!knownSpec) {
    return 0;
  }

  return player._specID;
};

const getPlayerTeamID = (video: RendererVideo) => {
  const { player } = video;

  if (player === undefined) {
    return 0;
  }

  if (player._teamID === undefined) {
    return 0;
  }

  return player._teamID;
};

const getPlayerClass = (video: RendererVideo): WoWCharacterClassType => {
  const { player } = video;

  if (player === undefined) {
    return 'UNKNOWN';
  }

  if (player._specID === undefined) {
    return 'UNKNOWN';
  }

  if (specializationById[player._specID] === undefined) {
    return 'UNKNOWN';
  }

  return specializationById[player._specID].class;
};

const getVideoTime = (video: RendererVideo) => {
  const { mtime } = video;
  const date = new Date(mtime);

  const hours = date
    .getHours()
    .toLocaleString('en-US', { minimumIntegerDigits: 2 });

  const mins = date
    .getMinutes()
    .toLocaleString('en-US', { minimumIntegerDigits: 2 });

  const timeAsString = `${hours}:${mins}`;
  return timeAsString;
};

const getVideoDate = (video: RendererVideo) => {
  const { mtime } = video;
  const date = new Date(mtime);
  const day = date.getDate();
  const month = months[date.getMonth()].slice(0, 3);
  const dateAsString = `${day} ${month}`;
  return dateAsString;
};

/**
 * Get the human readable description of a device from its id. Returns
 * unknown if not an available device.
 *
 * @param id the device id
 * @param availableAudioDevices list of available sources from OBS
 */
const getAudioDeviceDescription = (
  id: string,
  availableAudioDevices: { input: IOBSDevice[]; output: IOBSDevice[] }
) => {
  let result = 'Unknown';

  availableAudioDevices.input.forEach((device) => {
    if (device.id === id) {
      result = device.description;
    }
  });

  availableAudioDevices.output.forEach((device) => {
    if (device.id === id) {
      result = device.description;
    }
  });

  return result;
};

/**
 * Check if an id represents an available audio device.
 *
 * @param id the device id
 * @param availableAudioDevices list of available sources from OBS
 */
const isKnownAudioDevice = (
  id: string,
  availableAudioDevices: { input: IOBSDevice[]; output: IOBSDevice[] }
) => {
  if (getAudioDeviceDescription(id, availableAudioDevices) === 'Unknown') {
    return false;
  }

  return true;
};

/**
 * Standardizes device names to an array of strings and filters by known devices.
 *
 * @param deviceNames the device names to standardize
 * @param availableAudioDevices list of available sources from OBS
 * @returns the standardized device names
 */
const standardizeAudioDeviceNames = (
  deviceNames: string[] | string,
  availableAudioDevices: { input: IOBSDevice[]; output: IOBSDevice[] }
): string[] => {
  let normalizedDeviceNames: string[];

  if (typeof deviceNames === 'string') {
    normalizedDeviceNames = deviceNames.split(',');
  } else {
    normalizedDeviceNames = deviceNames;
  }

  return normalizedDeviceNames.filter((id) =>
    isKnownAudioDevice(id, availableAudioDevices)
  );
};

const isHighRes = (res: string) => {
  const resolutions = res.split('x');
  const [width, height] = resolutions;

  if (parseInt(width, 10) >= 4000 || parseInt(height, 10) >= 4000) {
    return true;
  }

  return false;
};

const encoderFilter = (enc: string, highRes: boolean) => {
  const encoder = enc as ESupportedEncoders;

  if (!Object.values(ESupportedEncoders).includes(encoder)) {
    return false;
  }

  // If we have a resolution above 4k, only the software encoder is valid.
  if (highRes) {
    return encoder === ESupportedEncoders.OBS_X264;
  }

  return true;
};

const mapEncoderToString = (enc: Encoder) => {
  return `${enc.type} (${enc.name})`;
};

const mapStringToEncoder = (enc: string): Encoder => {
  const encoder = enc as ESupportedEncoders;
  const isHardwareEncoder = encoder !== ESupportedEncoders.OBS_X264;

  const encoderType = isHardwareEncoder
    ? EncoderType.HARDWARE
    : EncoderType.SOFTWARE;

  return { name: enc, type: encoderType };
};

const pathSelect = async (): Promise<string> => {
  const ipc = window.electron.ipcRenderer;
  const path = await ipc.invoke('selectPath', []);
  return path;
};

const convertNumToDeathMarkers = (n: number) => {
  if (n === 2) return DeathMarkers.ALL;
  if (n === 1) return DeathMarkers.OWN;
  return DeathMarkers.NONE;
};

const convertDeathMarkersToNum = (d: DeathMarkers) => {
  if (d === DeathMarkers.ALL) return 2;
  if (d === DeathMarkers.OWN) return 1;
  return 0;
};

const getMarkerDiv = (
  marker: VideoMarker,
  videoDuration: number,
  progressBarWidth: number
) => {
  const markerDiv = document.createElement('div');
  markerDiv.className = marker.class;

  const markerPosition = (progressBarWidth * marker.time) / videoDuration;
  let markerWidth = (progressBarWidth * marker.duration) / videoDuration;

  // If the marker is going to hang of the end of the bar, cut it short.
  if (markerWidth + markerPosition > progressBarWidth) {
    markerWidth = progressBarWidth - markerPosition;
  }

  markerDiv.setAttribute(
    'style',
    `left: ${markerPosition}px; background-color: ${marker.color}; width: ${markerWidth}px`
  );

  markerDiv.setAttribute('title', marker.text);

  return markerDiv;
};

const addMarkerDiv = (marker: HTMLDivElement) => {
  const progressBar = document.querySelector('.vjs-progress-holder');

  if (!progressBar) {
    return;
  }

  progressBar.appendChild(marker);
};

const removeMarkerDiv = (marker: HTMLDivElement) => {
  const parent = marker.parentNode;

  if (parent === null) {
    return;
  }

  parent.removeChild(marker);
};

const getPTTKeyPressEventFromConfig = (
  config: ConfigurationSchema
): PTTKeyPressEvent => {
  const ctrl = config.pushToTalkModifiers.includes('ctrl');
  const win = config.pushToTalkModifiers.includes('win');
  const shift = config.pushToTalkModifiers.includes('shift');
  const alt = config.pushToTalkModifiers.includes('alt');

  return {
    altKey: alt,
    ctrlKey: ctrl,
    metaKey: win,
    shiftKey: shift,
    keyCode: config.pushToTalkKey,
    mouseButton: config.pushToTalkMouseButton,
  };
};

const getKeyByValue = (object: any, value: any) => {
  return Object.keys(object).find((key) => object[key] === value);
};

const isKeyModifier = (event: PTTKeyPressEvent) => {
  if (event.keyCode < 0) {
    return false;
  }

  const isModifierKey = Object.values(UiohookModifierKeyMap).includes(
    event.keyCode
  );

  return isModifierKey;
};

const getKeyModifiersString = (keyevent: PTTKeyPressEvent) => {
  const modifiers: string[] = [];

  if (keyevent.altKey) {
    modifiers.push('alt');
  }
  if (keyevent.ctrlKey) {
    modifiers.push('ctrl');
  }
  if (keyevent.shiftKey) {
    modifiers.push('shift');
  }
  if (keyevent.metaKey) {
    modifiers.push('win');
  }

  return modifiers.join(',');
};

const blurAll = (document: Document) => {
  const tmp = document.createElement('input');
  document.body.appendChild(tmp);
  tmp.focus();
  document.body.removeChild(tmp);
};

const getNextKeyOrMouseEvent = async (): Promise<PTTKeyPressEvent> => {
  const ipc = window.electron.ipcRenderer;
  return ipc.invoke('getNextKeyPress', []);
};

const secToMmSs = (s: number) => {
  const rounded = Math.round(s);
  const mins = Math.floor(rounded / 60);
  const secs = rounded - mins * 60;

  const ss = secs.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

  const mm = mins.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

  return `${mm}:${ss}`;
};

/**
 * Get a result text appropriate for the video category that signifies a
 * win or a loss, of some sort.
 */
const getVideoResultText = (video: RendererVideo): string => {
  const {
    category,
    result,
    upgradeLevel,
    soloShuffleRoundsWon,
    soloShuffleRoundsPlayed,
  } = video;

  if (isMythicPlusUtil(video) && result) {
    if (upgradeLevel === undefined) {
      return '';
    }

    return String(upgradeLevel);
  }

  if (isMythicPlusUtil(video) && !result) {
    return 'Depleted';
  }

  if (isRaidUtil(video) === VideoCategory.Raids) {
    return result ? 'Kill' : 'Wipe';
  }

  if (isSoloShuffleUtil(video)) {
    if (
      soloShuffleRoundsWon === undefined ||
      soloShuffleRoundsPlayed === undefined
    ) {
      return '';
    }

    const wins = soloShuffleRoundsWon;
    const losses = soloShuffleRoundsPlayed - soloShuffleRoundsWon;
    return `${wins} - ${losses}`;
  }

  return result ? 'Win' : 'Loss';
};

export {
  getFormattedDuration,
  getVideoResult,
  getWoWClassColor,
  getNumVideos,
  getTotalDuration,
  getLatestCategory,
  getSortedVideos,
  getEmptyState,
  getVideoResultText,
  getInstanceDifficultyText,
  getEncounterNameById,
  getDungeonName,
  isMythicPlusUtil,
  isRaidUtil,
  isBattlegroundUtil,
  isSoloShuffleUtil,
  isArenaUtil,
  isClipUtil,
  getResultColor,
  getPlayerName,
  getPlayerRealm,
  getPlayerSpecID,
  getPlayerTeamID,
  getPlayerClass,
  getVideoTime,
  getVideoDate,
  getAudioDeviceDescription,
  isKnownAudioDevice,
  standardizeAudioDeviceNames,
  encoderFilter,
  mapEncoderToString,
  mapStringToEncoder,
  pathSelect,
  convertNumToDeathMarkers,
  convertDeathMarkersToNum,
  getAllDeathMarkers,
  getOwnDeathMarkers,
  getRoundMarkers,
  getEncounterMarkers,
  getMarkerDiv,
  addMarkerDiv,
  removeMarkerDiv,
  isHighRes,
  getPTTKeyPressEventFromConfig,
  getKeyByValue,
  isKeyModifier,
  blurAll,
  getKeyModifiersString,
  getNextKeyOrMouseEvent,
  secToMmSs,
};

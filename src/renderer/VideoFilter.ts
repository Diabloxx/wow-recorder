import {
  dungeonAffixesById,
  dungeonsByZoneId,
  instanceNamesByZoneId,
  specializationById,
} from 'main/constants';
import { Flavour, RendererVideo } from 'main/types';
import {
  isArenaUtil,
  isBattlegroundUtil,
  isMythicPlusUtil,
  isRaidUtil,
  getPlayerClass,
  getWoWClassColor,
  getPlayerSpecID,
  getPlayerName,
} from './rendererutils';
import { Tag } from 'react-tag-autocomplete';
import { specImages, affixImages, classImages } from './images';
import VideoTag from './VideoTag';
import { Language, Phrase } from 'localisation/types';
import { getLocalePhrase } from 'localisation/translations';

/**
 * The VideoFilter class provides a mechanism to populate the search
 * suggestions, as well as filter the list of videos based on the
 * user's search query.
 */
export default class VideoFilter {
  /**
   * A list of strings in the filter query.
   */
  private query: string[];

  /**
   * A list of query matches for this video.
   */
  private matches: string[];

  /**
   * Constructor. This sets up the query for a given video. Typical usage
   * is to call filter after this to decide if the video should be filtered
   * or not.
   *
   * @param tags the tags to filter on
   * @param video the video to filter in or out
   * @param language the language of the client
   * @param grouping allow grouped (multipov) results
   */
  constructor(
    tags: Tag[],
    video: RendererVideo,
    language: Language,
    grouping: boolean,
  ) {
    this.query = tags
      .map((tag) => tag.value)
      .filter((tag) => typeof tag === 'string');

    const consider = grouping ? [video] : [video, ...video.multiPov];

    this.matches = consider.flatMap((v) =>
      VideoFilter.getVideoSuggestions(v, language).map((tag) => tag.encode()),
    );
  }

  /**
   * Perform the filter; check that every entry in the query matches a search
   * suggestion for this video.
   */
  public filter() {
    const m=  this.query.every((s) => this.matches.includes(s));
    return m;
  }

  /**
   * Get all the possible matches for an entire category.
   */
  public static getCategorySuggestions(
    state: RendererVideo[],
    language: Language,
  ) {
    const suggestions: VideoTag[] = [];

    // We pass in the videos as correlated by the StateManager. We need
    // to flatten them again before we iterate.
    const flattened = state.flatMap((v) => v.multiPov);
    flattened.push(...state);

    flattened.forEach((video) => {
      const videoTagSuggestions = this.getVideoSuggestions(video, language);
      suggestions.push(...videoTagSuggestions);
    });

    const unique = Array.from(
      new Map(suggestions.map((item) => [item.label, item])).values(),
    );

    return unique;
  }

  /**
   * Get all the possible matches for a video.
   */
  private static getVideoSuggestions(video: RendererVideo, language: Language) {
    const suggestions: VideoTag[] = [];
    suggestions.push(...this.getGenericSuggestions(video, language));

    if (isArenaUtil(video) || isBattlegroundUtil(video)) {
      suggestions.push(...this.getPvpSuggestions(video, language));
    } else if (isRaidUtil(video)) {
      suggestions.push(...this.getRaidSuggestions(video, language));
    } else if (isMythicPlusUtil(video)) {
      suggestions.push(...this.getDungeonSuggestions(video, language));
    }

    return suggestions;
  }

  /**
   * Get the generic matches for a video; that is the ones that do not
   * depend on category.
   */
  private static getGenericSuggestions(
    video: RendererVideo,
    language: Language,
  ) {
    const suggestions: VideoTag[] = [];

    const playerName = getPlayerName(video);
    const playerClass = getPlayerClass(video);
    const playerSpecID = getPlayerSpecID(video);
    const playerClassColor = getWoWClassColor(playerClass);
    const classIcon = classImages[playerClass];
    const specIcon = specImages[playerSpecID as keyof typeof specImages];

    if (video.cloud) {
      const localised = getLocalePhrase(language, Phrase.Cloud);
      const tag = new VideoTag(100, localised, '<CloudIcon>', '#bb4420');
      suggestions.push(tag);
    } else {
      const localised = getLocalePhrase(language, Phrase.Disk);
      const tag = new VideoTag(100, localised, '<SaveIcon>', '#bb4420');
      suggestions.push(tag);
    }

    if (video.protected) {
      const localised = getLocalePhrase(language, Phrase.Starred);
      const tag = new VideoTag(101, localised, '<StarIcon>', '#bb4420');
      suggestions.push(tag);
    }

    if (video.tag) {
      const localised = getLocalePhrase(language, Phrase.Tagged);
      const tag = new VideoTag(101, localised, '<TagIcon>', '#bb4420');
      suggestions.push(tag);
    }

    if (video.flavour === Flavour.Retail) {
      const localised = getLocalePhrase(language, Phrase.Retail);
      const tag = new VideoTag(102, localised, '<Swords>', '#bb4420');
      suggestions.push(tag);
    } else if (video.flavour === Flavour.Classic) {
      const localised = getLocalePhrase(language, Phrase.Classic);
      const tag = new VideoTag(102, localised, '<Shield>', '#bb4420');
      suggestions.push(tag);
    }

    const currentDate = new Date();

    const videoDate = video.start
      ? new Date(video.start)
      : new Date(video.mtime);

    const isToday =
      videoDate.getDate() === currentDate.getDate() &&
      videoDate.getMonth() === currentDate.getMonth() &&
      videoDate.getFullYear() === currentDate.getFullYear();

    const isYesterday =
      videoDate.getDate() === currentDate.getDate() - 1 &&
      videoDate.getMonth() === currentDate.getMonth() &&
      videoDate.getFullYear() === currentDate.getFullYear();

    if (isToday) {
      const localised = getLocalePhrase(language, Phrase.Today);
      const tag = new VideoTag(103, localised, '<CalendarDays>', '#bb4420');
      suggestions.push(tag);
    }

    if (isYesterday) {
      const localised = getLocalePhrase(language, Phrase.Yesterday);
      const tag = new VideoTag(103, localised, '<CalendarDays>', '#bb4420');
      suggestions.push(tag);
    }

    if (playerName) {
      const tag = new VideoTag(200, playerName, classIcon, playerClassColor);
      suggestions.push(tag);
    }

    if (playerSpecID) {
      const specName = specializationById[playerSpecID].name;
      const tag = new VideoTag(201, specName, specIcon, playerClassColor);
      suggestions.push(tag);
    }

    if (video.zoneID) {
      const isKnownZone = Object.prototype.hasOwnProperty.call(
        instanceNamesByZoneId,
        video.zoneID,
      );

      if (isKnownZone) {
        const zone = instanceNamesByZoneId[video.zoneID];
        const tag = new VideoTag(202, zone, '<MapPinned>', '#bb4420');
        suggestions.push(tag);
      }
    }

    return suggestions;
  }

  /**
   * Get the matches for a dungeon video.
   */
  private static getDungeonSuggestions(
    video: RendererVideo,
    language: Language,
  ) {
    const suggestions: VideoTag[] = [];

    if (video.zoneID) {
      const isKnownDungeon = Object.prototype.hasOwnProperty.call(
        dungeonsByZoneId,
        video.zoneID,
      );

      if (isKnownDungeon) {
        const dungeon = dungeonsByZoneId[video.zoneID];
        const tag = new VideoTag(203, dungeon, '<DungeonIcon>', '#bb4420');
        suggestions.push(tag);
      }
    }

    if (video.affixes) {
      video.affixes.forEach((affix) => {
        const isKnownAffix = Object.prototype.hasOwnProperty.call(
          dungeonAffixesById,
          affix,
        );

        if (isKnownAffix) {
          const affixName = dungeonAffixesById[affix];
          const affixImage = affixImages[affix as keyof typeof affixImages];
          const tag = new VideoTag(204, affixName, affixImage, '#bb4420');
          suggestions.push(tag);
        }
      });
    }

    if (!video.result) {
      const localised = getLocalePhrase(language, Phrase.Abandoned);
      const tag = new VideoTag(50, localised, '<ThumbsDown>', '#bb4420');
      suggestions.push(tag);
    } else if (video.upgradeLevel && video.upgradeLevel > 0) {
      const chests = `${video.upgradeLevel} ${getLocalePhrase(language, Phrase.Chests)}`;
      const chestsTag = new VideoTag(50, chests, '<ChestIcon>', '#bb4420');
      suggestions.push(chestsTag);

      const timed = getLocalePhrase(language, Phrase.Timed);
      const timedTag = new VideoTag(50, timed, '<ThumbsUp>', '#bb4420');
      suggestions.push(timedTag);
    } else {
      const localised = getLocalePhrase(language, Phrase.Depleted);
      const tag = new VideoTag(50, localised, '<DepleteIcon>', '#bb4420');
      suggestions.push(tag);
    }

    return suggestions;
  }

  /**
   * Get the matches for a raid video.
   */
  private static getRaidSuggestions(video: RendererVideo, language: Language) {
    const suggestions: VideoTag[] = [];

    if (video.result) {
      const localised = getLocalePhrase(language, Phrase.Kill);
      const tag = new VideoTag(50, localised, '<ThumbsUp>', '#bb4420');
      suggestions.push(tag);
    } else {
      const localised = getLocalePhrase(language, Phrase.Wipe);
      const tag = new VideoTag(50, localised, '<ThumbsDown>', '#bb4420');
      suggestions.push(tag);
    }

    if (video.difficultyID === 17) {
      const localised = getLocalePhrase(language, Phrase.LFR);
      const tag = new VideoTag(51, localised, '<DragonIcon>', '#bb4420');
      suggestions.push(tag);
    } else if (video.difficultyID === 14) {
      const localised = getLocalePhrase(language, Phrase.Normal);
      const tag = new VideoTag(52, localised, '<DragonIcon>', '#bb4420');
      suggestions.push(tag);
    } else if (video.difficultyID === 15) {
      const localised = getLocalePhrase(language, Phrase.Heroic);
      const tag = new VideoTag(53, localised, '<DragonIcon>', '#bb4420');
      suggestions.push(tag);
    } else if (video.difficultyID === 16) {
      const localised = getLocalePhrase(language, Phrase.Mythic);
      const tag = new VideoTag(54, localised, '<DragonIcon>', '#bb4420');
      suggestions.push(tag);
    }

    if (video.encounterName) {
      const tag = new VideoTag(
        205,
        video.encounterName,
        '<DragonIcon>',
        '#bb4420',
      );

      suggestions.push(tag);
    }

    return suggestions;
  }

  /**
   * Get the matches for a PvP video; that is arenas and battlegrounds,
   * which are basically the same in the context of search filters.
   */
  private static getPvpSuggestions(video: RendererVideo, language: Language) {
    const suggestions: VideoTag[] = [];

    if (video.result) {
      const localised = getLocalePhrase(language, Phrase.Win);
      const tag = new VideoTag(50, localised, '<ThumbsUp>', '#bb4420');
      suggestions.push(tag);
    } else {
      const localised = getLocalePhrase(language, Phrase.Loss);
      const tag = new VideoTag(50, localised, '<ThumbsDown>', '#bb4420');
      suggestions.push(tag);
    }

    return suggestions;
  }
}

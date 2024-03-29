import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FolderIcon from '@mui/icons-material/Folder';
import MessageIcon from '@mui/icons-material/Message';
import React, { MutableRefObject, useEffect, useState } from 'react';
import { RendererVideo, AppState } from 'main/types';
import { VideoCategory } from 'types/VideoCategory';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import LinkIcon from '@mui/icons-material/Link';
import {
  getResultColor,
  isArenaUtil,
  isBattlegroundUtil,
  isMythicPlusUtil,
  isRaidUtil,
  getFormattedDuration,
  getVideoTime,
  getVideoDate,
} from './rendererutils';
import ArenaCompDisplay from './ArenaCompDisplay';
import DungeonCompDisplay from './DungeonCompDisplay';
import RaidEncounterInfo from './RaidEncounterInfo';
import BattlegroundInfo from './BattlegroundInfo';
import DungeonInfo from './DungeonInfo';
import ArenaInfo from './ArenaInfo';
import RaidCompAndResult from './RaidCompAndResult';
import TagDialog from './TagDialog';
import ControlIcon from '../../assets/icon/ctrl-icon.png';
import PovSelection from './PovSelection';
import { useSettings } from './useSettings';
import SnackBar from './SnackBar';

interface IProps {
  selected: boolean;
  video: RendererVideo;
  videoState: RendererVideo[];
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  persistentProgress: MutableRefObject<number>;
}

const dialogButtonSx = {
  color: 'white',
  ':hover': {
    color: 'white',
    borderColor: '#bb4420',
    background: '#bb4420',
  },
};

const ipc = window.electron.ipcRenderer;

export default function VideoButton(props: IProps) {
  const { selected, video, videoState, setAppState, persistentProgress } =
    props;
  const [config] = useSettings();
  const formattedDuration = getFormattedDuration(video);
  const isMythicPlus = isMythicPlusUtil(video);
  const isRaid = isRaidUtil(video);
  const isBattleground = isBattlegroundUtil(video);
  const isArena = isArenaUtil(video);
  const resultColor = getResultColor(video);
  const videoTime = getVideoTime(video);
  const videoDate = getVideoDate(video);

  const [ctrlDown, setCtrlDown] = useState<boolean>(false);
  const [tagDialogOpen, setTagDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [thumbnailSignedUrl, setThumbnailSignedUrl] = useState<string>('');
  const [localPovIndex, setLocalPovIndex] = useState<number>(0);
  const [downloadSpinner, setDownloadSpinner] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [linkSnackBarOpen, setLinkSnackBarOpen] = useState(false);

  const povs = [video, ...video.multiPov];
  const pov = povs[localPovIndex];
  const { cloud, thumbnailSource, isProtected, tag, videoSource } = pov;

  // Check if we have this point of view duplicated in the other storage
  // type. Don't want to be showing the download button if we have already
  // got it on disk and vice versa.
  const haveOnDisk =
    !cloud ||
    povs.filter((v) => v.name === pov.name).filter((v) => !v.cloud).length > 0;

  const haveInCloud =
    cloud ||
    povs.filter((v) => v.name === pov.name).filter((v) => v.cloud).length > 0;

  const bookmarkOpacity = isProtected ? 1 : 0.2;
  const tagOpacity = tag ? 1 : 0.2;
  let tagTooltip: string = tag || 'Add a tag';

  if (tagTooltip.length > 50) {
    tagTooltip = `${tagTooltip.slice(0, 50)}...`;
  }

  // Sign the thumbnail URL and render it.
  useEffect(() => {
    const getSignedThumbnailUrl = async () => {
      const url = await ipc.invoke('signGetUrl', [thumbnailSource]);
      setThumbnailSignedUrl(url);
    };

    if (cloud) {
      getSignedThumbnailUrl();
    } else {
      setThumbnailSignedUrl(thumbnailSource);
    }
  }, [cloud, thumbnailSource]);

  useEffect(() => {
    if (povs.length > localPovIndex) {
      return;
    }

    setLocalPovIndex(0);
  }, [localPovIndex, povs.length, selected]);

  useEffect(() => {
    ipc.on('updateDownloadProgress', (name, progress) => {
      if (name !== pov.name) {
        return;
      }

      setDownloadSpinner(true);
      setDownloadProgress(progress as number);

      if (progress === 100) {
        setTimeout(() => setDownloadSpinner(false), 1000);
      }
    });
  }, [pov.name]);

  /**
   * Delete a video. This avoids attempting to delete the video
   * from disk when the MP4 file is still open in the UI via the safeDelete
   * call.
   */
  const deleteVideo = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setDeleteDialogOpen(false);

    window.electron.ipcRenderer.sendMessage('safeDeleteVideo', [
      videoSource,
      cloud,
    ]);

    if (!selected) {
      return;
    }

    setAppState((prevState) => {
      return {
        ...prevState,
        selectedVideoName: undefined,
        playingVideo: undefined,
      };
    });
  };

  /**
   * Sets up event listeners so that users can skip the "Are you sure you want
   * to delete this video?" prompt by holding CTRL. Also sets the callback on
   * unmount to delete the video if the delete button was clicked.
   */
  useEffect(() => {
    document.addEventListener('keyup', (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        setCtrlDown(false);
      }
    });
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        setCtrlDown(true);
      }
    });
  });

  const openTagDialog = () => {
    setTagDialogOpen(true);
  };

  const protectVideo = (event: React.SyntheticEvent) => {
    event.stopPropagation();

    window.electron.ipcRenderer.sendMessage('videoButton', [
      'save',
      videoSource,
      cloud,
    ]);
  };

  const openLocation = (event: React.SyntheticEvent) => {
    event.stopPropagation();

    window.electron.ipcRenderer.sendMessage('videoButton', [
      'open',
      videoSource,
      cloud,
    ]);
  };

  const deleteClicked = (event: React.MouseEvent<HTMLElement>) => {
    if (ctrlDown) {
      deleteVideo(event);
    } else {
      event.stopPropagation();
      setDeleteDialogOpen(true);
    }
  };

  const getTagDialog = () => {
    return (
      <TagDialog
        video={pov}
        tagDialogOpen={tagDialogOpen}
        setTagDialogOpen={setTagDialogOpen}
      />
    );
  };

  const getDeleteDialog = () => {
    return (
      <Dialog
        open={deleteDialogOpen}
        PaperProps={{ style: { backgroundColor: '#1A233A' } }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Permanently Delete this Video?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'white' }}>
            Hold{' '}
            <img
              src={ControlIcon}
              alt="Control Key"
              width="35"
              height="35"
              style={{ verticalAlign: 'middle' }}
            />{' '}
            to skip this prompt.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              setDeleteDialogOpen(false);
            }}
            sx={dialogButtonSx}
          >
            Cancel
          </Button>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              deleteVideo(event);
            }}
            sx={dialogButtonSx}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const getOpenButton = () => {
    return (
      <Tooltip title="Open location">
        <IconButton onClick={openLocation}>
          <FolderIcon sx={{ color: 'white' }} />
        </IconButton>
      </Tooltip>
    );
  };

  const uploadVideo = async () => {
    ipc.sendMessage('videoButton', ['upload', videoSource]);
  };

  const getUploadButton = () => {
    return (
      <Tooltip title="Upload to cloud">
        <IconButton onClick={uploadVideo}>
          <UploadIcon sx={{ color: 'white' }} />
        </IconButton>
      </Tooltip>
    );
  };

  const downloadVideo = async () => {
    setDownloadSpinner(true);
    ipc.sendMessage('videoButton', ['download', videoSource]);
  };

  const getDownloadButton = () => {
    if (downloadSpinner) {
      return (
        <Box
          sx={{
            position: 'relative',
            display: 'inline-flex',
          }}
        >
          <CircularProgress
            variant="determinate"
            size={35}
            value={downloadProgress}
            sx={{ color: '#bb4420' }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              sx={{
                color: 'white',
                fontWeight: '600',
                fontFamily: 'Arial',
                fontSize: '0.6rem',
                textShadow:
                  '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              }}
            >
              {`${downloadProgress}%`}
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Tooltip title="Download to disk">
        <IconButton onClick={downloadVideo}>
          <DownloadIcon sx={{ color: 'white' }} />
        </IconButton>
      </Tooltip>
    );
  };

  const getShareableLinkSnackBar = () => {
    return (
      <SnackBar
        message="Link copied!"
        timeout={2}
        open={linkSnackBarOpen}
        setOpen={setLinkSnackBarOpen}
      />
    );
  };

  const getShareableLink = async () => {
    return ipc.invoke('signGetUrl', [videoSource]);
  };

  const writeToClipBoard = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setLinkSnackBarOpen(true);
    const url = await getShareableLink();
    ipc.sendMessage('writeClipboard', [url]);
  };

  const getShareLinkButton = () => {
    return (
      <Tooltip title="Get sharable link">
        <div>
          {getShareableLinkSnackBar()}
          <IconButton onClick={writeToClipBoard}>
            <LinkIcon sx={{ color: 'white' }} />
          </IconButton>
        </div>
      </Tooltip>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '130px',
      }}
    >
      {getTagDialog()}
      {getDeleteDialog()}
      <Box
        sx={{
          height: '130px',
          width: '30%',
        }}
      >
        <Box>
          <Box
            component="img"
            src={thumbnailSignedUrl}
            sx={{
              border: '1px solid black',
              borderRadius: '5px',
              boxSizing: 'border-box',
              height: '130px',
              minWidth: '300px',
              width: '100%',
              objectFit: 'contain',
              backgroundColor: 'black',
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          border: '1px solid black',
          borderRadius: '5px',
          boxSizing: 'border-box',
          bgcolor: resultColor,
          width: '100%',
          height: '130px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          mx: 1,
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PovSelection
            povs={povs}
            parentButtonSelected={selected}
            localPovIndex={localPovIndex}
            setLocalPovIndex={setLocalPovIndex}
            setAppState={setAppState}
            persistentProgress={persistentProgress}
          />
        </Box>

        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ m: 2 }}>
            {isArena && <ArenaInfo video={video} />}
            {isMythicPlus && <DungeonInfo video={video} />}
            {isRaid && <RaidEncounterInfo video={video} />}
            {isBattleground && <BattlegroundInfo video={video} />}
          </Box>
        </Box>

        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ m: 2 }}>
            {isArena && <ArenaCompDisplay video={video} />}
            {isMythicPlus && <DungeonCompDisplay video={video} />}
            {isRaid && (
              <RaidCompAndResult
                video={video}
                raidCategoryState={videoState.filter(
                  (v) => v.category === VideoCategory.Raids
                )}
              />
            )}
          </Box>
        </Box>

        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              m: 1,
            }}
          >
            <Tooltip title="Duration">
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mx: 1,
                }}
              >
                <HourglassBottomIcon sx={{ color: 'white' }} />
                <Typography
                  sx={{
                    color: 'white',
                    fontWeight: '600',
                    fontFamily: '"Arial",sans-serif',
                    textShadow:
                      '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                  }}
                >
                  {formattedDuration}
                </Typography>
              </Box>
            </Tooltip>

            <Tooltip title="Time">
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mx: 1,
                }}
              >
                <AccessTimeIcon sx={{ color: 'white' }} />
                <Typography
                  sx={{
                    color: 'white',
                    fontWeight: '600',
                    fontFamily: '"Arial",sans-serif',
                    textShadow:
                      '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                  }}
                >
                  {videoTime}
                </Typography>
              </Box>
            </Tooltip>

            <Tooltip title="Date">
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mx: 1,
                }}
              >
                <EventIcon sx={{ color: 'white' }} />
                <Typography
                  sx={{
                    color: 'white',
                    fontWeight: '600',
                    fontFamily: '"Arial",sans-serif',
                    textShadow:
                      '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                  }}
                >
                  {videoDate}
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              m: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tooltip title={tagTooltip}>
                <IconButton onClick={openTagDialog}>
                  <MessageIcon sx={{ color: 'white', opacity: tagOpacity }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Never age out">
                <IconButton onClick={protectVideo}>
                  <BookmarksIcon
                    sx={{ color: 'white', opacity: bookmarkOpacity }}
                  />
                </IconButton>
              </Tooltip>

              {cloud && getShareLinkButton()}
              {!cloud && getOpenButton()}
              {cloud && !haveOnDisk && getDownloadButton()}
              {!cloud &&
                !haveInCloud &&
                config.cloudUpload &&
                getUploadButton()}

              <Tooltip title="Delete">
                <IconButton onClick={deleteClicked}>
                  <DeleteForeverIcon sx={{ color: 'white' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

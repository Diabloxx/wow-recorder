import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Button,
} from '@mui/material';
import { RendererVideo } from 'main/types';
import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import StateManager from './StateManager';

interface IProps {
  video: RendererVideo;
  tagDialogOpen: boolean;
  setTagDialogOpen: Dispatch<SetStateAction<boolean>>;
  stateManager: MutableRefObject<StateManager>;
}

const buttonSx = {
  color: 'white',
  ':hover': {
    color: 'white',
    borderColor: '#bb4420',
    background: '#bb4420',
  },
};

export default function TagDialog(props: IProps) {
  const { video, tagDialogOpen, setTagDialogOpen, stateManager } = props;

  const closeTagDialog = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setTagDialogOpen(false);
  };

  const saveTag = (newTag: string) => {
    stateManager.current.tag(video, newTag);

    window.electron.ipcRenderer.sendMessage('videoButton', [
      'tag',
      video.cloud ? video.videoName : video.videoSource,
      video.cloud,
      newTag,
    ]);
  };

  const clearTag = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    saveTag('');
    setTagDialogOpen(false);
  };

  return (
    <Dialog
      open={tagDialogOpen}
      PaperProps={{
        style: {
          minHeight: '100px',
          minWidth: '500px',
          backgroundColor: '#1A233A',
        },
        component: 'form',
        // Not sure what is going on with types here, it works but ESLint
        // doesn't like it. TODO: Fix it.
        onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          event.stopPropagation();
          const formData = new FormData(event.currentTarget);
          const formJson = Object.fromEntries((formData as any).entries());
          const { newTag } = formJson;
          saveTag(newTag);
          setTagDialogOpen(false);
        },
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>Add a Description</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: 'white' }}>
          This description is queryable in the search bar.
        </DialogContentText>
        <TextField
          inputProps={{ style: { color: 'darkgrey' } }}
          sx={{
            '& .MuiInput-underline:before': { borderBottomColor: 'white' },
            '& .MuiInput-underline:after': { borderBottomColor: 'white' },
            '&& .MuiInput-root:hover::before': { borderColor: 'white' },
          }}
          multiline
          minRows={1}
          maxRows={10}
          autoFocus
          margin="dense"
          type="string"
          id="newTag"
          name="newTag"
          fullWidth
          variant="standard"
          defaultValue={video.tag}
          spellCheck={false}
          onKeyDown={(e) => {
            // Need this to prevent "k" triggering video play/pause while
            // dialog is open and other similar things.
            e.stopPropagation();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeTagDialog} sx={buttonSx}>
          Cancel
        </Button>
        <Button onClick={clearTag} sx={buttonSx}>
          Clear
        </Button>
        <Button type="submit" sx={buttonSx}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

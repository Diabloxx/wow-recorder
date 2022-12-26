import React from 'react';
import icon from '../../assets/icon/small-icon.png';

const ipc = window.electron.ipcRenderer;

export default function RendererTitleBar() {
  const clickedHide = () => {
    ipc.sendMessage('mainWindow', ['minimize']);
  };

  const clickedResize = () => {
    ipc.sendMessage('mainWindow', ['resize']);
  };

  const clickedQuit = () => {
    ipc.sendMessage('mainWindow', ['quit']);
  };

  const [title, setTitle] = React.useState('Warcraft Recorder');

  React.useEffect(() => {
    window.electron.ipcRenderer.on('updateTitleBar', (t) => {
      setTitle(t as string);
    });
  }, []);

  return (
    <div id="title-bar">
      <div id="logo">
        <img alt="icon" src={icon} height="25px" width="25px" />
      </div>
      <div id="title">{title}</div>
      <div id="title-bar-btns">
        <button id="min-btn" type="button" onClick={clickedHide}>
          🗕
        </button>
        <button id="max-btn" type="button" onClick={clickedResize}>
          🗗
        </button>
        <button id="close-btn" type="button" onClick={clickedQuit}>
          ✖
        </button>
      </div>
    </div>
  );
}

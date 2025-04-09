import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SongItem, FolderItem } from '@/types';

interface PlayerState {
  items: SongItem[];
  playlist: SongItem[];
  folders: FolderItem[];
  displayedMusic: SongItem[];
  displayedFolders: FolderItem[];
  currentSong: SongItem | null;
  isPlaying: boolean;
  songProgress: number;
  volume: string;
  search: string;
  pathURL: string;
  folderName: string;
  serverAddress: string;
  localMusic: SongItem[];
  uploadStatus: { success: boolean; message: string } | null;
  viewMode: 'server' | 'local';
  equalizerEnabled: boolean;
  isLoadingMetadata: boolean;
  metaDataProgress: number;
}

const initialState: PlayerState = {
  items: [],
  playlist: [],
  folders: [],
  displayedMusic: [],
  displayedFolders: [],
  currentSong: null,
  isPlaying: false,
  songProgress: 0,
  volume: '0.17',
  search: '',
  pathURL: '/storage/emulated/0/Music/',
  folderName: '/Music/04 April',
  serverAddress: '',
  localMusic: [],
  uploadStatus: null,
  viewMode: 'server',
  equalizerEnabled: false,
  isLoadingMetadata: false,
  metaDataProgress: 0,
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<SongItem[]>) => {
      state.items = action.payload;
    },
    setPlaylist: (state, action: PayloadAction<SongItem[]>) => {
      state.playlist = action.payload;
    },
    setFolders: (state, action: PayloadAction<FolderItem[]>) => {
      state.folders = action.payload;
    },
    setDisplayedMusic: (state, action: PayloadAction<SongItem[]>) => {
      state.displayedMusic = action.payload;
    },
    setDisplayedFolders: (state, action: PayloadAction<FolderItem[]>) => {
      state.displayedFolders = action.payload;
    },
    setCurrentSong: (state, action: PayloadAction<SongItem | null>) => {
      state.currentSong = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setSongProgress: (state, action: PayloadAction<number>) => {
      state.songProgress = action.payload;
    },
    setVolume: (state, action: PayloadAction<string>) => {
      state.volume = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setPathURL: (state, action: PayloadAction<string>) => {
      state.pathURL = action.payload;
    },
    setFolderName: (state, action: PayloadAction<string>) => {
      state.folderName = action.payload;
    },
    setServerAddress: (state, action: PayloadAction<string>) => {
      state.serverAddress = action.payload;
    },
    setLocalMusic: (state, action: PayloadAction<SongItem[]>) => {
      state.localMusic = action.payload;
    },
    setUploadStatus: (state, action: PayloadAction<{ success: boolean; message: string } | null>) => {
      state.uploadStatus = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'server' | 'local'>) => {
      state.viewMode = action.payload;
    },
    setEqualizerEnabled: (state, action: PayloadAction<boolean>) => {
      state.equalizerEnabled = action.payload;
    },
    setIsLoadingMetadata: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMetadata = action.payload;
    },
    setMetaDataProgress: (state, action: PayloadAction<number>) => {
      state.metaDataProgress = action.payload;
    },
  },
});

export const {
  setItems,
  setPlaylist,
  setFolders,
  setDisplayedMusic,
  setDisplayedFolders,
  setCurrentSong,
  setIsPlaying,
  setSongProgress,
  setVolume,
  setSearch,
  setPathURL,
  setFolderName,
  setServerAddress,
  setLocalMusic,
  setUploadStatus,
  setViewMode,
  setEqualizerEnabled,
  setIsLoadingMetadata,
  setMetaDataProgress,
} = playerSlice.actions;

export default playerSlice.reducer;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SongItem, FolderItem } from '@/types';
import Player from '@/components/player/player';
import * as musicMetadata from 'music-metadata';

export default function Home() {
  const [items, setItems] = useState<SongItem[]>([]);
  const [playlist, setPlaylist] = useState<SongItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentSong, setCurrentSong] = useState<SongItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songProgress, setSongProgress] = useState(0);
  const [volume, setVolume] = useState('0.17');
  const [search, setSearch] = useState('');
  const [pathURL, setPathURL] = useState('/storage/emulated/0/Music/');
  const [folderName, setFolderName] = useState('/Music/04 April');
  const [serverAddress, setServerAddress] = useState('');
  const [localMusic, setLocalMusic] = useState<SongItem[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean, message: string } | null>(null);
  const [viewMode, setViewMode] = useState<'server' | 'local'>('server');
  const [equalizerEnabled, setEqualizerEnabled] = useState<boolean>(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize from localStorage
    const savedPath = localStorage.getItem('path');
    const savedAddress = localStorage.getItem('address');
    const savedVolume = localStorage.getItem('volume');

    setPathURL(savedPath || '/storage/emulated/0/Music/');
    setServerAddress(savedAddress || '192.168.7.221');
    setVolume(savedVolume || '0.17');

    // Initialize MediaSession API
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('nexttrack', nextSong);
      navigator.mediaSession.setActionHandler('previoustrack', previousSong);
    }
  }, []);

  useEffect(() => {
    // Fetch data after serverAddress or pathURL changes
    if (serverAddress) {
      fetchSongs();
    }
  }, [serverAddress, pathURL]);

  useEffect(() => {
    // Set volume when audio element and volume state are available
    if (audioPlayerRef.current) {
      audioPlayerRef.current.volume = parseFloat(volume);
    }
  }, [volume, audioPlayerRef.current]);

  useEffect(() => {
    // Add ended event listener
    const audioElement = audioPlayerRef.current;
    if (audioElement) {
      const handleEnded = () => nextSong();
      audioElement.addEventListener('ended', handleEnded);

      // Progress update listener
      const handleTimeUpdate = () => {
        if (audioElement.duration) {
          const progress = (audioElement.currentTime / audioElement.duration) * 100;
          setSongProgress(progress || 0);
        }
      };
      audioElement.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [audioPlayerRef.current, currentSong]);

  const openFolder = (folder: FolderItem) => {
    setPathURL(folder.path);
    localStorage.setItem('path', folder.path);
    setFolderName(folder.name);
  };

  const fetchData = () => {
    localStorage.setItem('address', serverAddress);
    fetchSongs();
  };

  const fetchSongs = async () => {
    const baseURL = `http://${serverAddress}:8080?path=${pathURL}`;
    console.log(baseURL);
    try {
      const response = await fetch(
        baseURL
      );
      const data = await response.json();
      setItems(data.items);

      // Filter for mp3 files
      const mp3Files = data.items.filter(
        (item: SongItem) => item.type === 'file' && item.extension === '.mp3'
      );
      
      // Set initial playlist without metadata
      setPlaylist(mp3Files);

      // Filter for directories
      const directories = data.items.filter(
        (item: SongItem) => item.type === 'directory'
      ) as FolderItem[];
      setFolders(directories);
      
      // Extract metadata for server files
      if (mp3Files.length > 0) {
        setIsLoadingMetadata(true);
        console.log("Starting metadata extraction for", mp3Files.length, "files");
        
        // Process files in batches to avoid overwhelming the browser
        const batchSize = 5;
        const enhancedFiles: SongItem[] = [...mp3Files]; // Start with original files
        
        for (let i = 0; i < mp3Files.length; i += batchSize) {
          const batch = mp3Files.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (file: SongItem, index: number) => {
              try {
                // Fetch the file for metadata extraction
                const fileUrl = `http://${serverAddress}:8080/download?file=${file.path}`;
                console.log(`Fetching file ${i + index + 1}/${mp3Files.length}: ${file.name}`);
                
                const response = await fetch(fileUrl);
                if (!response.ok) {
                  throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                console.log(`Processing metadata for: ${file.name} (${arrayBuffer.byteLength} bytes)`);
                
                // Parse metadata
                const metadata = await musicMetadata.parseBuffer(
                  new Uint8Array(arrayBuffer),
                  { mimeType: 'audio/mpeg' }
                );
                
                // Extract metadata
                const { common, format } = metadata;
                console.log(`Extracted metadata for: ${file.name}`, { 
                  title: common.title, 
                  artist: common.artist,
                  hasPicture: common.picture && common.picture.length > 0
                });
                
                // Create a blob URL for the picture if it exists
                let pictureUrl = '';
                if (common.picture && common.picture.length > 0) {
                  const picture = common.picture[0];
                  const blob = new Blob([picture.data], { type: picture.format });
                  pictureUrl = URL.createObjectURL(blob);
                  console.log(`Created artwork URL for: ${file.name}`);
                }
                
                return {
                  ...file,
                  title: common.title || file.name,
                  artist: common.artist || 'Unknown Artist',
                  album: common.album || 'Unknown Album',
                  year: common.year,
                  duration: format.duration,
                  artwork: pictureUrl,
                };
              } catch (error) {
                console.error(`Error extracting metadata for ${file.name}:`, error);
                return {
                  ...file,
                  type: 'file' as 'file',
                };
              }
            })
          );
          
          // Update the enhanced files array with the batch results
          batchResults.forEach((result, idx) => {
            enhancedFiles[i + idx] = result;
          });
          
          // Update the playlist with the current progress
          setPlaylist([...enhancedFiles]);
        }
        
        console.log("Metadata extraction complete");
        setIsLoadingMetadata(false);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setIsLoadingMetadata(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const updateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    localStorage.setItem('volume', newVolume);

    if (audioPlayerRef.current) {
      audioPlayerRef.current.volume = parseFloat(newVolume);
    }
  };

  const formatSize = (size: number) => {
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const playSongFromPlaylist = (index: number) => {
    const song = playlist[index];
    setCurrentSong(song);

    if (audioPlayerRef.current) {
      const url = `http://${serverAddress}:8080/download?file=${song.path}`;
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Error playing audio:', err));
    }
  };

  const pause = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!currentSong) return;

    if (isPlaying) {
      pause();
    } else if (audioPlayerRef.current) {
      audioPlayerRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Error playing audio:', err));
    }
  };

  const nextSong = () => {
    if (!currentSong || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(song =>
      song.path === currentSong.path
    );
    const nextIndex = (currentIndex + 1) % playlist.length;
    playSongFromPlaylist(nextIndex);
  };

  const previousSong = () => {
    if (!currentSong || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(song =>
      song.path === currentSong.path
    );
    const previousIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    playSongFromPlaylist(previousIndex);
  };

  // Handle folder upload for local music
  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setUploadStatus({
        success: false,
        message: "No files selected"
      });
      return;
    }

    try {
      setIsLoadingMetadata(true);
      console.log("Starting local file processing");
      
      // Process MP3 files
      const mp3Files: SongItem[] = [];
      const mp3FilesArray = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.mp3'));
      console.log(`Found ${mp3FilesArray.length} MP3 files to process`);
      
      if (mp3FilesArray.length === 0) {
        setUploadStatus({
          success: false,
          message: "No MP3 files found in selected folder"
        });
        setIsLoadingMetadata(false);
        return;
      }
      
      // Process files in batches
      const batchSize = 5;
      let processedCount = 0;
      
      const processNextBatch = async (startIndex: number) => {
        const endIndex = Math.min(startIndex + batchSize, mp3FilesArray.length);
        const batch = mp3FilesArray.slice(startIndex, endIndex);
        
        const batchResults = await Promise.all(
          batch.map(async (file: File) => {
            try {
              console.log(`Processing local file: ${file.name}`);
              // Create a local URL for the file
              const objectUrl = URL.createObjectURL(file);
              
              // Read the file for metadata extraction
              const arrayBuffer = await file.arrayBuffer();
              console.log(`Reading metadata for: ${file.name} (${arrayBuffer.byteLength} bytes)`);
              
              // Parse metadata
              const metadata = await musicMetadata.parseBuffer(
                new Uint8Array(arrayBuffer),
                { mimeType: 'audio/mpeg' }
              );
              
              // Extract metadata
              const { common, format } = metadata;
              console.log(`Extracted metadata for: ${file.name}`, { 
                title: common.title, 
                artist: common.artist,
                hasPicture: common.picture && common.picture.length > 0
              });
              
              // Create a blob URL for the picture if it exists
              let pictureUrl = '';
              if (common.picture && common.picture.length > 0) {
                const picture = common.picture[0];
                const blob = new Blob([picture.data], { type: picture.format });
                pictureUrl = URL.createObjectURL(blob);
                console.log(`Created artwork URL for: ${file.name}`);
              }
              
              // Create a SongItem from the file with metadata
              const songItem: SongItem = {
                name: file.name,
                path: objectUrl,
                type: 'file' as 'file',
                extension: '.mp3',
                size: file.size,
                lastModified: new Date(file.lastModified).toISOString(),
                local: true,
                title: common.title || file.name,
                artist: common.artist || 'Unknown Artist',
                album: common.album || 'Unknown Album',
                year: common.year,
                duration: format.duration,
                artwork: pictureUrl,
              };

              return songItem;
            } catch (error) {
              console.error(`Error processing ${file.name}:`, error);
              // Return a basic SongItem without metadata
              return {
                name: file.name,
                path: URL.createObjectURL(file),
                type: 'file' as 'file',
                extension: '.mp3',
                size: file.size,
                lastModified: new Date(file.lastModified).toISOString(),
                local: true
              };
            }
          })
        );
        
        // Add processed files to our collection
        mp3Files.push(...batchResults);
        processedCount += batch.length;
        
        // Update UI with current progress
        setLocalMusic(prev => [...mp3Files, ...prev]);
        
        // Process next batch or finish
        if (processedCount < mp3FilesArray.length) {
          await processNextBatch(endIndex);
        } else {
          finishProcessing();
        }
      };
      
      const finishProcessing = () => {
        console.log(`Completed processing ${processedCount} files`);
        setUploadStatus({
          success: true,
          message: `Added ${processedCount} MP3 files`
        });

        // Switch to local view mode
        setViewMode('local');
        setIsLoadingMetadata(false);
      };
      
      // Start processing the first batch
      processNextBatch(0);
      
    } catch (error) {
      console.error("Error processing files:", error);
      setUploadStatus({
        success: false,
        message: "Error processing files"
      });
      setIsLoadingMetadata(false);
    }
  };

  // Play a local song
  const playLocalSong = (index: number) => {
    const song = localMusic[index];
    setCurrentSong(song);

    if (audioPlayerRef.current) {
      // For local files, we already have the object URL
      audioPlayerRef.current.src = song.path;
      audioPlayerRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Error playing audio:', err));
    }
  };

  // Toggle between server and local view
  const toggleViewMode = (mode: 'server' | 'local') => {
    setViewMode(mode);
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      localMusic.forEach(song => {
        if (song.local && song.path) {
          URL.revokeObjectURL(song.path);
        }
        if (song.artwork) {
          URL.revokeObjectURL(song.artwork);
        }
      });
      
      // Also clean up artwork URLs for server playlist
      playlist.forEach(song => {
        if (song.artwork) {
          URL.revokeObjectURL(song.artwork);
        }
      });
    };
  }, [localMusic, playlist]);

  // Toggle equalizer enabled state
  const toggleEqualizer = (enabled: boolean) => {
    setEqualizerEnabled(enabled);
  };

  // Filter playlist based on search
  const filteredPlaylist = search
    ? playlist.filter(song => song.name.toLowerCase().includes(search.toLowerCase()))
    : playlist;

  // Filter local music based on search
  const filteredLocalMusic = search
    ? localMusic.filter(song => song.name.toLowerCase().includes(search.toLowerCase()))
    : localMusic;

  // Determine which list to display based on view mode
  const displayedMusic = viewMode === 'local' ? filteredLocalMusic : filteredPlaylist;
  const displayedFolders = viewMode === 'local' ? [] : folders;

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#121212] p-6 flex flex-col h-full">
        <h1 className="text-2xl font-bold mb-8 text-white">Ethereal Tunes</h1>

        {/* Server Connection */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Server Connection</h2>
          <div className="flex flex-col space-y-3">
            <input
              type="text"
              value={serverAddress}
              onChange={(e) => setServerAddress(e.target.value)}
              placeholder="Server Address"
              className="bg-[#282828] text-sm p-3 rounded-md outline-none border border-[#333333] focus:border-[#1DB954] placeholder:text-gray-500 w-full text-white"
            />
            <button
              className="text-white bg-[#1DB954] p-3 rounded-md hover:bg-[#1ed760] transition-colors w-full flex items-center justify-center"
              onClick={fetchData}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Fetch
            </button>
          </div>
        </div>

        {/* Upload Music Section */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Upload Music</h2>
          <div className="flex flex-col space-y-3">
            <label
              htmlFor="folder-upload"
              className="text-white bg-[#333333] hover:bg-[#444444] p-3 rounded-md transition-colors w-full flex items-center justify-center cursor-pointer"
            >
              <svg
                className="w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Select Folder
            </label>
            <input
              type="file"
              id="folder-upload"
              webkitdirectory=""
              className="hidden"
              onChange={handleFolderUpload}
            />
            {uploadStatus && (
              <div
                className={`text-xs text-center mt-1 ${uploadStatus.success ? 'text-green-500' : 'text-red-500'
                  }`}
              >
                {uploadStatus.message}
              </div>
            )}
            <button
              className={`text-white p-3 rounded-md transition-colors w-full flex items-center justify-center ${viewMode === 'local'
                ? 'bg-[#1DB954] hover:bg-[#1ed760]'
                : 'bg-[#333333] hover:bg-[#444444]'
                }`}
              onClick={() => toggleViewMode('local')}
            >
              <svg
                className="w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              My Music
            </button>
            <button
              className={`text-white p-3 rounded-md transition-colors w-full flex items-center justify-center ${viewMode === 'server'
                ? 'bg-[#1DB954] hover:bg-[#1ed760]'
                : 'bg-[#333333] hover:bg-[#444444]'
                }`}
              onClick={() => toggleViewMode('server')}
            >
              <svg
                className="w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Server Music
            </button>
          </div>
        </div>

        {/* Volume Control */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Volume</h2>
          <div className="flex items-center">
            <input
              type="range"
              className="w-full h-2 bg-[#535353] rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
              step="0.01"
              value={volume}
              onChange={updateVolume}
              min="0"
              max="1"
            />
            <span className="text-sm text-gray-300 ml-2 w-10 text-right">
              {Math.round(Number(volume) * 100)}%
            </span>
          </div>
        </div>

        {/* Current Folder */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Current Folder</h2>
          <div className="text-sm bg-[#282828] p-3 rounded-md border border-[#333333] truncate">
            {viewMode === 'local' ? 'Local Music' : folderName}
          </div>
        </div>

        {/* Folders */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Folders</h2>
          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {displayedFolders.map((folder, i) => (
              <div
                key={i}
                className="mb-2 p-3 bg-[#282828] hover:bg-[#333333] rounded-md cursor-pointer transition-colors"
                onClick={() => openFolder(folder)}
              >
                <div className="font-medium truncate">{folder.name}</div>
                <div className="text-xs text-gray-400 truncate mt-1">{folder.path}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Search and controls */}
        <div className="bg-[#121212] p-4 flex items-center">
          <div className="relative flex-1 max-w-xl">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#282828] text-sm p-3 pl-10 rounded-full w-full outline-none border border-[#333333] focus:border-[#1DB954] text-white"
              placeholder="Search songs..."
            />
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 overflow-hidden p-6 bg-gradient-to-b from-[#1e1e1e] to-[#121212]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Songs List */}
            <div className="bg-[#181818] rounded-md overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[#333333] flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
                <h3 className="text-lg font-medium text-white">Songs</h3>
                <span className="ml-auto text-sm text-gray-400">
                  {displayedMusic.length} items
                </span>
              </div>

              <div className="flex-1 overflow-hidden">
                <ul className="h-full overflow-y-auto custom-scrollbar">
                  {isLoadingMetadata && (
                    <div className="flex items-center justify-center h-20 text-gray-400">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading metadata...
                    </div>
                  )}
                  {displayedMusic.length > 0 ? (
                    displayedMusic.map((item, index) => (
                      <li
                        key={index}
                        onClick={() => viewMode === 'local' ? playLocalSong(index) : playSongFromPlaylist(playlist.indexOf(item))}
                        className={`border-b border-[#222222] hover:bg-[#333333] p-4 flex items-center justify-between cursor-pointer transition-colors ${currentSong && currentSong.path === item.path
                          ? 'bg-[#282828] border-l-4 border-l-[#1DB954]'
                          : ''
                          }`}
                      >
                        <div className="flex items-center">
                          <div
                            className="w-10 h-10 flex items-center justify-center bg-[#333333] rounded-md mr-3 flex-shrink-0 overflow-hidden"
                          >
                            {item.artwork ? (
                              <img 
                                src={item.artwork} 
                                alt={item.title || item.name}
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <svg
                                className="h-5 w-5 text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M9 18V5l12-2v13"></path>
                                <circle cx="6" cy="18" r="3"></circle>
                                <circle cx="18" cy="16" r="3"></circle>
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">
                              {item.title || item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.artist || 'Unknown Artist'} • {item.album || 'Unknown Album'}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-xs bg-[#333333] text-gray-300 px-2 py-1 rounded-md ml-2 flex-shrink-0"
                        >
                          {item.duration ? 
                            `${Math.floor(item.duration / 60)}:${Math.floor(item.duration % 60).toString().padStart(2, '0')}` : 
                            formatSize(item.size || 0)
                          }
                        </span>
                      </li>
                    ))
                  ) : (
                    <div
                      className="flex flex-col justify-center items-center h-full p-8"
                    >
                      <svg
                        className="h-16 w-16 text-gray-600 mb-3"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <p className="text-xl font-medium text-gray-400">
                        No Songs Found
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Try selecting a different folder
                      </p>
                    </div>
                  )}
                </ul>
              </div>
            </div>

            {/* Folders List */}
            <div className="bg-[#181818] rounded-md overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[#333333] flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                  ></path>
                </svg>
                <h3 className="text-lg font-medium text-white">Folders</h3>
                <span className="ml-auto text-sm text-gray-400">
                  {displayedFolders.length} items
                </span>
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar">
                  {displayedFolders.length > 0 ? (
                    displayedFolders.map((folder, i) => (
                      <div
                        key={i}
                        onClick={() => openFolder(folder)}
                        className="border-b border-[#222222] hover:bg-[#333333] p-4 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-10 h-10 flex items-center justify-center bg-[#333333] rounded-md mr-3 flex-shrink-0"
                          >
                            <svg
                              className="h-5 w-5 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path
                                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                              ></path>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{folder.name}</p>
                            <p className="text-xs text-gray-400 truncate mt-1">{folder.path}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className="flex flex-col justify-center items-center h-full p-8"
                    >
                      <svg
                        className="h-16 w-16 text-gray-600 mb-3"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                        ></path>
                        <line x1="9" y1="14" x2="15" y2="14"></line>
                      </svg>
                      <p className="text-xl font-medium text-gray-400">
                        No Folders Found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Bar */}
        <div className="h-auto bg-[#181818] border-t border-[#282828] w-full">
          <Player
            currentSong={currentSong}
            isPlaying={isPlaying}
            songProgress={songProgress}
            onNextSong={nextSong}
            onPrevSong={previousSong}
            onTogglePlayPause={togglePlayPause}
            onToggleEqualizer={toggleEqualizer}
            equalizerEnabled={equalizerEnabled}
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioPlayerRef} src="" id="audio" />

      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #121212;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #535353;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1DB954;
        }
      `}</style>
    </div>
  );
}
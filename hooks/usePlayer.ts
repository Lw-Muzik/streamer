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
    const [metaDataProgress, setMetaDataProgress] = React.useState(0)

    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize from localStorage
        const savedPath = localStorage.getItem('path');
        const savedAddress = localStorage.getItem('address');
        const savedVolume = localStorage.getItem('volume');

        setPathURL(savedPath || '/storage/emulated/0/Music/');
        setServerAddress(savedAddress || '192.168.7.221');
        setVolume(savedVolume || '0.17');

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
                                setMetaDataProgress(parseInt(((i + index + 1) / mp3Files.length).toFixed(1)));

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
                            } finally {
                                // setMetaDataProgress(0);
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


    const updateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = e.target.value;
        setVolume(newVolume);
        localStorage.setItem('volume', newVolume);

        if (audioPlayerRef.current) {
            audioPlayerRef.current.volume = parseFloat(newVolume);
        }
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
    return {
        displayedFolders,
        displayedMusic,
        toggleEqualizer,
        togglePlayPause,
        toggleViewMode,
        playLocalSong,
        playSongFromPlaylist,
        nextSong,
        previousSong,
        handleFolderUpload,
        updateVolume,
        uploadStatus,
        volume,
        openFolder,
        fetchSongs,
        isLoadingMetadata,
        setCurrentSong,
        currentSong, fetchData,
        setIsLoadingMetadata, playlist,
        viewMode, search, setSearch,
        audioPlayerRef,
        serverAddress, setServerAddress, metaDataProgress, setMetaDataProgress, isPlaying, songProgress

    }
};

"use client"
import React, { useEffect } from 'react';
import { SongItem, FolderItem } from '@/types';
import * as musicMetadata from 'music-metadata';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAudioContext } from '@/contexts/AudioContext';
import {
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
} from '@/store/slices/playerSlice';

export default function usePlayer() {
    const dispatch = useAppDispatch();
    const { getAudioElement } = useAudioContext();
    const {
        items,
        playlist,
        folders,
        displayedMusic,
        displayedFolders,
        currentSong,
        isPlaying,
        songProgress,
        volume,
        search,
        pathURL,
        folderName,
        serverAddress,
        localMusic,
        uploadStatus,
        viewMode,
        equalizerEnabled,
        isLoadingMetadata,
        metaDataProgress,
    } = useAppSelector((state) => state.player);

    useEffect(() => {
        // Initialize from localStorage
        const savedPath = localStorage.getItem('path');
        const savedAddress = localStorage.getItem('address');
        const savedVolume = localStorage.getItem('volume');

        dispatch(setPathURL(savedPath || '/storage/emulated/0/Music/'));
        dispatch(setServerAddress(savedAddress || '192.168.7.221'));
        dispatch(setVolume(savedVolume || '0.17'));
    }, [dispatch]);

    useEffect(() => {
        // Fetch data after serverAddress or pathURL changes
        if (serverAddress) {
            fetchSongs();
        }
    }, [serverAddress, pathURL]);

    useEffect(() => {
        // Update displayed music based on view mode and search
        if (viewMode === 'local') {
            const filteredLocalMusic = localMusic.filter(song =>
                song.name.toLowerCase().includes(search.toLowerCase()) ||
                (song.title && song.title.toLowerCase().includes(search.toLowerCase()))
            );
            dispatch(setDisplayedMusic(filteredLocalMusic));
        } else {
            const filteredPlaylist = playlist.filter(song =>
                song.name.toLowerCase().includes(search.toLowerCase()) ||
                (song.title && song.title.toLowerCase().includes(search.toLowerCase()))
            );
            dispatch(setDisplayedMusic(filteredPlaylist));
        }
    }, [viewMode, search, playlist, localMusic, dispatch]);

    useEffect(() => {
        // Update displayed folders based on search
        const filteredFolders = folders.filter(folder =>
            folder.name.toLowerCase().includes(search.toLowerCase())
        );
        dispatch(setDisplayedFolders(filteredFolders));
    }, [search, folders, dispatch]);

    useEffect(() => {
        // Set volume when audio element and volume state are available
        const audioElement = getAudioElement();
        if (audioElement) {
            audioElement.volume = parseFloat(volume);
        }
    }, [volume, getAudioElement]);

    useEffect(() => {
        // Add ended event listener
        const audioElement = getAudioElement();
        if (audioElement) {
            const handleEnded = () => nextSong();
            audioElement.addEventListener('ended', handleEnded);

            // Progress update listener
            const handleTimeUpdate = () => {
                if (audioElement.duration) {
                    const progress = (audioElement.currentTime / audioElement.duration) * 100;
                    dispatch(setSongProgress(progress || 0));
                }
            };
            audioElement.addEventListener('timeupdate', handleTimeUpdate);

            return () => {
                audioElement.removeEventListener('ended', handleEnded);
                audioElement.removeEventListener('timeupdate', handleTimeUpdate);
            };
        }
    }, [currentSong, dispatch, getAudioElement]);

    const openFolder = (folder: FolderItem) => {
        dispatch(setPathURL(folder.path));
        localStorage.setItem('path', folder.path);
        dispatch(setFolderName(folder.name));
    };

    const fetchData = () => {
        localStorage.setItem('address', serverAddress);
        fetchSongs();
    };

    const fetchSongs = async () => {
        const baseURL = `http://${serverAddress}:8080?path=${pathURL}`;
        console.log(baseURL);
        try {
            const response = await fetch(baseURL);
            const data = await response.json();
            dispatch(setItems(data.items));

            // Filter for mp3 files
            const mp3Files = data.items.filter(
                (item: SongItem) => item.type === 'file' && item.extension === '.mp3'
            );

            // Set initial playlist without metadata
            dispatch(setPlaylist(mp3Files));
            dispatch(setDisplayedMusic(mp3Files));

            // Filter for directories
            const directories = data.items.filter(
                (item: SongItem) => item.type === 'directory'
            ) as FolderItem[];
            dispatch(setFolders(directories));
            dispatch(setDisplayedFolders(directories));

            // Extract metadata for server files
            if (mp3Files.length > 0) {
                dispatch(setIsLoadingMetadata(true));
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
                                dispatch(setMetaDataProgress(parseInt(((i + index + 1) / mp3Files.length).toFixed(1))));

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
                                    const link = document.querySelector('link');
                                    //    image
                                    // link?.rel = 'image/png';
                                    // link
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
                    dispatch(setPlaylist([...enhancedFiles]));
                    dispatch(setDisplayedMusic([...enhancedFiles]));
                }

                console.log("Metadata extraction complete");
                dispatch(setIsLoadingMetadata(false));
            }
        } catch (error) {
            console.error('Error fetching songs:', error);
            dispatch(setIsLoadingMetadata(false));
        }
    };

    const updateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = e.target.value;
        dispatch(setVolume(newVolume));
        localStorage.setItem('volume', newVolume);

        const audioElement = getAudioElement();
        if (audioElement) {
            audioElement.volume = parseFloat(newVolume);
        }
    };

    const playSongFromPlaylist = (index: number) => {
        const song = viewMode === 'local' ? localMusic[index] : playlist[index];
        if (!song) {
            console.error('No song found at index:', index);
            return;
        }

        dispatch(setCurrentSong(song));

        const audioElement = getAudioElement();
        if (audioElement) {
            const isLocalSong = viewMode === 'local' || song.local === true;
            const url = isLocalSong ? song.path : `http://${serverAddress}:8080/download?file=${encodeURIComponent(song.path)}`;
            console.log('Playing song:', song.name, 'from URL:', url);

            // Reset the audio element
            audioElement.pause();
            audioElement.currentTime = 0;

            // Set the new source
            audioElement.src = url;
            // audioElement.crossOrigin = isLocalSong ? 'anonymous' : 'use-credentials';
            audioElement.load();

            // Add error listener for debugging
            // const errorHandler = (e: Event) => {
            //     console.error('Audio playback error:', e);
            //     const audioError = e.target as HTMLAudioElement;
            //     console.error('Audio error details:', {
            //         error: audioError.error,
            //         networkState: audioError.networkState,
            //         readyState: audioError.readyState
            //     });
            // };

            // audioElement.addEventListener('error', errorHandler, { once: true });

            // Try to play
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Playback started successfully');
                        dispatch(setIsPlaying(true));
                    })
                    .catch(err => {
                        console.error('Error playing audio:', err);
                        // Try to play again after a short delay
                        setTimeout(() => {
                            audioElement.play()
                                .then(() => dispatch(setIsPlaying(true)))
                                .catch(err => console.error('Second attempt failed:', err));
                        }, 500);
                    });
            }
        } else {
            console.error('Audio element not found');
        }
    };

    const pause = () => {
        const audioElement = getAudioElement();
        if (audioElement) {
            audioElement.pause();
            dispatch(setIsPlaying(false));
        }
    };

    const togglePlayPause = () => {
        if (!currentSong) return;

        if (isPlaying) {
            pause();
        } else {
            const audioElement = getAudioElement();
            if (audioElement) {
                const isLocalSong = viewMode === 'local' || currentSong.local === true;
                const url = isLocalSong ? currentSong.path : `http://${serverAddress}:8080/download?file=${encodeURIComponent(currentSong.path)}`;
                console.log('Toggling play/pause for song:', currentSong.name, 'from URL:', url);

                // Only set the source if it's not already set or has changed
                if (audioElement.src !== url) {
                    audioElement.src = url;
                    audioElement.crossOrigin = isLocalSong ? 'anonymous' : 'use-credentials';
                    audioElement.load();
                }

                audioElement.play()
                    .then(() => {
                        console.log('Playback resumed successfully');
                        dispatch(setIsPlaying(true));
                    })
                    .catch(err => {
                        console.error('Error resuming playback:', err);
                        // Try to play again after a short delay
                        setTimeout(() => {
                            audioElement.play()
                                .then(() => dispatch(setIsPlaying(true)))
                                .catch(err => console.error('Second attempt failed:', err));
                        }, 500);
                    });
            }
        }
    };

    const nextSong = () => {
        if (!currentSong || !playlist.length) return;

        const currentIndex = playlist.findIndex(song => song.path === currentSong.path);
        const nextIndex = (currentIndex + 1) % playlist.length;
        playSongFromPlaylist(nextIndex);
    };

    const previousSong = () => {
        if (!currentSong || !playlist.length) return;

        const currentIndex = playlist.findIndex(song => song.path === currentSong.path);
        const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        playSongFromPlaylist(prevIndex);
    };

    const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            dispatch(setUploadStatus({
                success: false,
                message: "No files selected"
            }));
            return;
        }

        try {
            dispatch(setIsLoadingMetadata(true));
            console.log("Starting local file processing");

            // Process MP3 files
            const mp3Files: any[] = [];
            const mp3FilesArray = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.mp3'));
            console.log(`Found ${mp3FilesArray.length} MP3 files to process`);

            if (mp3FilesArray.length === 0) {
                dispatch(setUploadStatus({
                    success: false,
                    message: "No MP3 files found in selected folder"
                }));
                dispatch(setIsLoadingMetadata(false));
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
                            const songItem = {
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
                dispatch(setLocalMusic([...mp3Files, ...localMusic]));
                dispatch(setDisplayedMusic([...mp3Files, ...localMusic]));
                dispatch(setMetaDataProgress(processedCount / mp3FilesArray.length));

                // Process next batch or finish
                if (processedCount < mp3FilesArray.length) {
                    await processNextBatch(endIndex);
                } else {
                    finishProcessing();
                }
            };

            const finishProcessing = () => {
                console.log(`Completed processing ${processedCount} files`);
                dispatch(setUploadStatus({
                    success: true,
                    message: `Added ${processedCount} MP3 files`
                }));

                // Switch to local view mode
                dispatch(setViewMode('local'));
                dispatch(setIsLoadingMetadata(false));
            };

            // Start processing the first batch
            processNextBatch(0);

        } catch (error) {
            console.error("Error processing files:", error);
            dispatch(setUploadStatus({
                success: false,
                message: "Error processing files"
            }));
            dispatch(setIsLoadingMetadata(false));
        }
    };

    const playLocalSong = (index: number) => {
        const song = localMusic[index];
        if (!song) {
            console.error('No local song found at index:', index);
            return;
        }

        dispatch(setCurrentSong(song));

        const audioElement = getAudioElement();
        if (audioElement) {
            console.log('Playing local song:', song.name, 'from path:', song.path);

            // Reset the audio element
            audioElement.pause();
            audioElement.currentTime = 0;

            // Set the new source
            audioElement.src = song.path;
            audioElement.crossOrigin = 'anonymous';
            audioElement.load();

            // Add error listener for debugging
            const errorHandler = (e: Event) => {
                console.error('Local audio playback error:', e);
                const audioError = e.target as HTMLAudioElement;
                console.error('Audio error details:', {
                    error: audioError.error,
                    networkState: audioError.networkState,
                    readyState: audioError.readyState
                });
            };

            audioElement.addEventListener('error', errorHandler, { once: true });

            // Try to play
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Local playback started successfully');
                        dispatch(setIsPlaying(true));
                    })
                    .catch(err => {
                        console.error('Error playing local audio:', err);
                        // Try to play again after a short delay
                        setTimeout(() => {
                            audioElement.play()
                                .then(() => dispatch(setIsPlaying(true)))
                                .catch(err => console.error('Second attempt failed:', err));
                        }, 500);
                    });
            }
        } else {
            console.error('Audio element not found');
        }
    };

    const toggleViewMode = (mode: 'server' | 'local') => {
        dispatch(setViewMode(mode));
    };

    const toggleEqualizer = (enabled: boolean) => {
        dispatch(setEqualizerEnabled(enabled));
    };

    return {
        items,
        playlist,
        folders,
        displayedMusic,
        displayedFolders,
        currentSong,
        isPlaying,
        songProgress,
        volume,
        search,
        pathURL,
        folderName,
        serverAddress,
        localMusic,
        uploadStatus,
        viewMode,
        equalizerEnabled,
        isLoadingMetadata,
        metaDataProgress,
        openFolder,
        fetchData,
        updateVolume,
        playSongFromPlaylist,
        pause,
        togglePlayPause,
        nextSong,
        previousSong,
        handleFolderUpload,
        playLocalSong,
        toggleViewMode,
        toggleEqualizer,
    };
}

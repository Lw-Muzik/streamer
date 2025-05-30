"use client"
import { useAppDispatch, useAppSelector } from '@/store';
import React from 'react';
import {
    setServerAddress,
    setVolume,
    setViewMode,
    setUploadStatus,
    setIsLoadingMetadata,
    setLocalMusic,
    setMetaDataProgress
} from '@/store/slices/playerSlice';
import * as musicMetadata from 'music-metadata';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import SideBarTile from './SideBarTile';

const SidebarComponent = () => {
    const dispatch = useAppDispatch();
    const {
        serverAddress,
        volume,
        uploadStatus,
        viewMode,
        metaDataProgress,
        localMusic
    } = useAppSelector((state) => state.player);
    const navigation = usePathname();
    const fetchData = () => {
        localStorage.setItem('address', serverAddress);
        // You'll need to implement the fetch logic here
    };

    const updateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = e.target.value;
        dispatch(setVolume(newVolume));
        localStorage.setItem('volume', newVolume);
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

    return (
        <div className="w-64 bg-[#121212] overflow-y-auto p-6 flex flex-col h-full">
            <h1 className="text-2xl font-bold mb-8 text-white">Ethereal Tunes</h1>

            {/* Server Connection */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Server Connection</h2>
                <div className="flex flex-col space-y-3">
                    <input
                        type="text"
                        value={serverAddress}
                        onChange={(e) => dispatch(setServerAddress(e.target.value))}
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
            <SideBarTile heading='Upload Music'>
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
                    <span className='px-3'>Select Folder</span>
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
                    onClick={() => dispatch(setViewMode('local'))}
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
                    className={`text-white bg-[#333333] hover:bg-[#444444] p-3 rounded-md transition-colors w-full flex items-center justify-center ${viewMode === 'server'
                        ? 'bg-[#1DB954] hover:bg-[#1ed760]'
                        : 'bg-[#333333] hover:bg-[#444444]'
                        }`}
                    onClick={() => dispatch(setViewMode('server'))}
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
            </SideBarTile>

            <SideBarTile heading='Configs'>
                <Link className={`text-white p-3 rounded-md transition-colors w-full flex items-center justify-center 
                        ${navigation === '/equalizer' ? 'bg-[#1DB954] hover:bg-[#1ed760]'
                        : 'bg-[#333333] hover:bg-[#444444]'}
                            `} href="/equalizer"> <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14"></line>
                        <line x1="4" y1="10" x2="4" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12" y2="3"></line>
                        <line x1="20" y1="21" x2="20" y2="16"></line>
                        <line x1="20" y1="12" x2="20" y2="3"></line>
                        <line x1="1" y1="14" x2="7" y2="14"></line>
                        <line x1="9" y1="8" x2="15" y2="8"></line>
                        <line x1="17" y1="16" x2="23" y2="16"></line>
                    </svg> <span className='px-3'>Equalizer</span> </Link>
                <Link className={`text-white p-3 rounded-md transition-colors w-full flex items-center justify-center 
                        ${navigation === '/visualizer' ? 'bg-[#1DB954] hover:bg-[#1ed760]'
                        : 'bg-[#333333] hover:bg-[#444444]'}
                            `} href="/visualizer"> <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14"></line>
                        <line x1="4" y1="10" x2="4" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12" y2="3"></line>
                        <line x1="20" y1="21" x2="20" y2="16"></line>
                        <line x1="20" y1="12" x2="20" y2="3"></line>
                        <line x1="1" y1="14" x2="7" y2="14"></line>
                        <line x1="9" y1="8" x2="15" y2="8"></line>
                        <line x1="17" y1="16" x2="23" y2="16"></line>
                    </svg> <span className='px-3'> Visualizer</span></Link>
                <Link className={`text-white p-3 rounded-md transition-colors w-full flex items-center justify-center 
                        ${navigation === '/settings' ? 'bg-[#1DB954] hover:bg-[#1ed760]'
                        : 'bg-[#333333] hover:bg-[#444444]'}
                            `} href="/settings">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span className='px-3'>Settings</span>
                </Link>
            </SideBarTile>
            {/* Volume Control */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Volume</h2>
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                            {/* Volume Icon - changes based on volume level */}
                            {Number(volume) === 0 ? (
                                <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <line x1="23" y1="9" x2="17" y2="15"></line>
                                    <line x1="17" y1="9" x2="23" y2="15"></line>
                                </svg>
                            ) : Number(volume) < 0.5 ? (
                                <svg className="w-4 h-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                </svg>
                            )}
                        </div>
                        <span className="text-sm font-medium text-white bg-[#333333] px-2 py-1 rounded-md">
                            {Math.round(Number(volume) * 100)}%
                        </span>
                    </div>

                    <div className="relative">
                        <input
                            type="range"
                            className="volume-slider w-full"
                            step="0.01"
                            value={volume}
                            onChange={updateVolume}
                            min="0"
                            max="1"
                            style={{
                                background: `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${Number(volume) * 100}%, var(--secondary-bg) ${Number(volume) * 100}%, var(--secondary-bg) 100%)`
                            }}
                        />
                        <div className="absolute -bottom-4 left-0 w-full flex justify-between px-1 text-[10px] text-gray-500">
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading Progress */}
            <div className="overflow-hidden flex flex-col">
                <h2 className="text-sm font-semibold text-capitalise text-gray-400 mb-3">{'Loading progress ' + (metaDataProgress * 100) + ' %'}</h2>
                <div className="flex-1 h-1 bg-[#ba8080] round-sm overflow-hidden">
                    <div
                        className="h-1 bg-[#1DB954] transition-all duration-300"
                        style={{ width: `${metaDataProgress * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default SidebarComponent;
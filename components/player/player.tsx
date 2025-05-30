"use client"
import React, { useState, useEffect, useRef } from 'react';
import { SongItem } from '@/types';
import Link from 'next/link';
import Equalizer from '../equalizer.tsx/equalizer';
import usePlayer from '@/hooks/usePlayer';
import { useAudioContext } from '@/contexts/AudioContext';

interface PlayerProps {

}

const Player: React.FC<PlayerProps> = () => {
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [showEqualizerModal, setShowEqualizerModal] = useState<boolean>(false);
    const { getAudioElement } = useAudioContext();
    // Add refs to track current time and duration to avoid infinite loops
    const currentTimeRef = useRef<number>(0);
    const durationRef = useRef<number>(0);
    const {
        nextSong,
        previousSong,
        songProgress,
        isPlaying,
        currentSong,
        togglePlayPause,
    } = usePlayer();

    useEffect(() => {
        // Update current time and duration
        const audioElement = getAudioElement();
        if (audioElement) {
            // Use a separate function for updating the UI state that runs on an interval
            // instead of directly in the event handler
            const updateUIFromRefs = () => {
                if (currentTimeRef.current !== audioElement.currentTime) {
                    setCurrentTime(currentTimeRef.current);
                }
                if (durationRef.current !== audioElement.duration) {
                    setDuration(durationRef.current);
                }
            };

            // This function only updates refs, not state directly
            const updateTimes = () => {
                currentTimeRef.current = audioElement.currentTime;

                // Only update duration if it's a valid number and different from current
                if (!isNaN(audioElement.duration) && audioElement.duration > 0) {
                    durationRef.current = audioElement.duration;
                } else if (currentSong?.duration && currentSong.duration > 0) {
                    // Fallback to the song metadata duration if available
                    durationRef.current = currentSong.duration;
                }
            };

            const handleError = (e: Event) => {
                console.error('Audio error:', e);
                const audioError = e.target as HTMLAudioElement;
                console.error('Audio error details:', {
                    error: audioError.error,
                    networkState: audioError.networkState,
                    readyState: audioError.readyState
                });
            };

            // Initial update to make sure values are set
            updateTimes();
            updateUIFromRefs();

            // Set up an interval to update the UI state from refs
            const intervalId = setInterval(updateUIFromRefs, 250); // Update UI 4 times per second

            audioElement.addEventListener('timeupdate', updateTimes);
            audioElement.addEventListener('loadedmetadata', updateTimes);
            audioElement.addEventListener('durationchange', updateTimes);
            audioElement.addEventListener('canplaythrough', updateTimes);
            // audioElement.addEventListener('error', handleError);
            navigator.mediaSession.setActionHandler('nexttrack', nextSong);
            navigator.mediaSession.setActionHandler('previoustrack', previousSong);

            return () => {
                clearInterval(intervalId);
                audioElement.removeEventListener('timeupdate', updateTimes);
                audioElement.removeEventListener('loadedmetadata', updateTimes);
                audioElement.removeEventListener('durationchange', updateTimes);
                audioElement.removeEventListener('canplaythrough', updateTimes);
                // audioElement.removeEventListener('error', handleError);
            };
        }
    }, [getAudioElement, nextSong, previousSong]); // Keep minimal dependencies

    const formatDate = (date?: string): string => {
        return date ? new Date(date).toLocaleDateString() : '';
    };

    const formatTime = (seconds: number): string => {
        if (!seconds || isNaN(seconds)) return "0:00";

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const toggleEqualizer = () => {
        setShowEqualizerModal(prevState => !prevState);
        // We no longer toggle the equalizer state here, just the modal visibility
    };

    return (
        <div className="w-full text-white">
            {/* Audio element is now provided by AudioContext */}
            <div className="p-4 flex items-center justify-between">
                {/* Song info - left side */}
                <Link href="/player" className="flex items-center space-x-4 w-1/3">
                    {/* Album art */}
                    <div className="w-12 h-12 bg-[#282828] rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 border border-[#333333]">
                        {currentSong && currentSong.artwork ? (
                            <img
                                src={currentSong.artwork}
                                alt={currentSong.title || currentSong.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18V5l12-2v13"></path>
                                <circle cx="6" cy="18" r="3"></circle>
                                <circle cx="18" cy="16" r="3"></circle>
                            </svg>
                        )}
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-sm font-bold truncate">
                            {currentSong ? (currentSong.title || currentSong.name.replace('.mp3', '')) : "No Song Playing"}
                        </h2>
                        <p className="text-xs text-gray-400 truncate">
                            {currentSong ?
                                (currentSong.artist ?
                                    `${currentSong.artist}${currentSong.album ? ` • ${currentSong.album}` : ''}`
                                    : formatDate(currentSong.lastModified)
                                )
                                : "Select a song to play"
                            }
                        </p>
                    </div>
                </Link>

                {/* Player controls - center */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="flex items-center space-x-4 mb-2">
                        <button
                            onClick={previousSong}
                            // disabled={!currentSong}
                            className="text-gray-300 hover:text-white transition-colors disabled:opacity-50 focus:outline-none"
                            title="Previous"
                        >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                                <line x1="5" y1="19" x2="5" y2="5"></line>
                            </svg>
                        </button>

                        <button
                            onClick={togglePlayPause}
                            disabled={!currentSong}
                            className="bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors disabled:opacity-50 focus:outline-none"
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <svg
                                    className="h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="6" y="4" width="4" height="16"></rect>
                                    <rect x="14" y="4" width="4" height="16"></rect>
                                </svg>
                            ) : (
                                <svg
                                    className="h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={() => nextSong()}
                            // disabled={!currentSong}
                            className="text-gray-300 hover:text-white transition-colors disabled:opacity-50 focus:outline-none"
                            title="Next"
                        >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                                <line x1="19" y1="5" x2="19" y2="19"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full flex items-center space-x-2">
                        <span className="text-xs text-gray-400 w-8 text-right">{formatTime(currentTime)}</span>
                        <div className="flex-1 h-1 bg-[#535353] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#1DB954] transition-all duration-300"
                                style={{ width: `${songProgress}%` }}
                            ></div>
                        </div>
                        <span className="text-xs text-gray-400 w-8">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right side - can be used for additional controls */}
                <div className="w-1/3 flex justify-end space-x-3">
                    <Link
                        href="/equalizer"
                        // onClick={toggleEqualizer}
                        className={`flex items-center space-x-1 text-xs ${showEqualizerModal ? 'text-[#1DB954]' : 'text-gray-400'} hover:text-white transition-colors px-2 py-1 rounded bg-[#282828]`}
                        title="Toggle Equalizer"
                    >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="21" x2="4" y2="14"></line>
                            <line x1="4" y1="10" x2="4" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="3"></line>
                            <line x1="20" y1="21" x2="20" y2="16"></line>
                            <line x1="20" y1="12" x2="20" y2="3"></line>
                            <line x1="1" y1="14" x2="7" y2="14"></line>
                            <line x1="9" y1="8" x2="15" y2="8"></line>
                            <line x1="17" y1="16" x2="23" y2="16"></line>
                        </svg>
                        <span>EQ</span>
                    </Link>

                    {currentSong && (
                        <div className="flex space-x-2">
                            {currentSong.duration && (
                                <div className="text-xs text-gray-400 bg-[#282828] px-2 py-1 rounded">
                                    {formatTime(currentSong.duration)}
                                </div>
                            )}
                            {currentSong.size && (
                                <div className="text-xs text-gray-400 bg-[#282828] px-2 py-1 rounded">
                                    {`${Math.round(currentSong.size / 1024 / 1024 * 10) / 10} MB`}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Equalizer Modal */}
            {showEqualizerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-[#282828] border-[#333333] rounded-lg shadow-xl w-full max-w-2xl mx-4 my-auto">
                        <div className="flex justify-between items-center p-4 border-b border-[#333333]">
                            <h3 className="text-xl font-bold">Audio Equalizer</h3>
                            <button
                                onClick={toggleEqualizer}
                                className="text-gray-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-2">
                            <Equalizer
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Player;
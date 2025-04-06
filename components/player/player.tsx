import React, { useState, useEffect } from 'react';
import { SongItem } from '@/types';

interface PlayerProps {
    currentSong: SongItem | null;
    isPlaying: boolean;
    songProgress: number;
    onNextSong: () => void;
    onPrevSong: () => void;
    onTogglePlayPause: () => void;
    playlist?: SongItem[];
}

const Player: React.FC<PlayerProps> = ({
    currentSong,
    isPlaying,
    songProgress,
    onNextSong,
    onPrevSong,
    onTogglePlayPause,
    playlist = []
}) => {
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);

    useEffect(() => {
        // Update current time and duration
        const audioEl = document.getElementById('audio') as HTMLAudioElement;
        if (audioEl) {
            const updateTimes = () => {
                setCurrentTime(audioEl.currentTime);
                setDuration(audioEl.duration);
            };

            audioEl.addEventListener('timeupdate', updateTimes);
            audioEl.addEventListener('loadedmetadata', updateTimes);

            return () => {
                audioEl.removeEventListener('timeupdate', updateTimes);
                audioEl.removeEventListener('loadedmetadata', updateTimes);
            };
        }
    }, []);

    const formatDate = (date?: string): string => {
        return date ? new Date(date).toLocaleDateString() : '';
    };

    const formatTime = (seconds: number): string => {
        if (!seconds || isNaN(seconds)) return "0:00";

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="w-full text-white p-4">
            <div className="flex items-center justify-between">
                {/* Song info - left side */}
                <div className="flex items-center space-x-4 w-1/3">
                    {/* Album art placeholder */}
                    <div className="w-12 h-12 bg-[#282828] rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 border border-[#333333]">
                        <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-sm font-bold truncate">
                            {currentSong ? currentSong.name.replace('.mp3', '') : "No Song Playing"}
                        </h2>
                        <p className="text-xs text-gray-400 truncate">
                            {currentSong ? formatDate(currentSong.lastModified) : "Select a song to play"}
                        </p>
                    </div>
                </div>

                {/* Player controls - center */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="flex items-center space-x-4 mb-2">
                        <button
                            onClick={onPrevSong}
                            disabled={!currentSong}
                            className="text-gray-300 hover:text-white transition-colors disabled:opacity-50 focus:outline-none"
                            title="Previous"
                        >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                                <line x1="5" y1="19" x2="5" y2="5"></line>
                            </svg>
                        </button>

                        <button
                            onClick={onTogglePlayPause}
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
                            onClick={onNextSong}
                            disabled={!currentSong}
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
                <div className="w-1/3 flex justify-end">
                    {currentSong && (
                        <div className="text-xs text-gray-400 bg-[#282828] px-2 py-1 rounded">
                            {currentSong.size ? `${Math.round(currentSong.size / 1024 / 1024 * 10) / 10} MB` : ""}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Player;
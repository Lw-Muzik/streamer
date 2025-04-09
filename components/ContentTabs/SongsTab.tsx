import React from 'react';
import LoadingComponent from './LoadingComponent';
import usePlayer from '@/hooks/usePlayer';
interface SongsIF {

}
const SongsTab: React.FC<SongsIF> = () => {
    const { displayedMusic, playlist, isLoadingMetadata, viewMode, currentSong, playLocalSong, playSongFromPlaylist } = usePlayer();
    const formatSize = (size: number) => {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
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
                        <LoadingComponent />
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
};

export default SongsTab;
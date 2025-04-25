"use client"
import { useAppDispatch, useAppSelector } from '@/store';
import { FolderItem } from '@/types';
import React from 'react';
import { setPathURL, setFolderName } from '@/store/slices/playerSlice';

interface FoldersIF { }

const FoldersTab: React.FC<FoldersIF> = () => {
    const dispatch = useAppDispatch();
    const { displayedFolders } = useAppSelector((state) => state.player);

    const openFolder = (folder: FolderItem) => {
        dispatch(setPathURL(folder.path));
        localStorage.setItem('path', folder.path);
        dispatch(setFolderName(folder.name));
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

export default FoldersTab;
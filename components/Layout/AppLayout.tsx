"use client"
import React from 'react';
import SidebarComponent from '../sidebar/SidebarComponent';
import SearchComponent from '../search/SearchComponent';
import { useAppDispatch, useAppSelector } from '@/store';
import Player from '../player/player';
import { setSearch } from '@/store/slices/playerSlice';

interface AppLayoutIF {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutIF> = ({ children }) => {
    const dispatch = useAppDispatch();
    const { search } = useAppSelector((state) => state.player);
    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Sidebar */}
            <SidebarComponent />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Search and controls */}
                <SearchComponent search={search} setSearch={(value) => dispatch(setSearch(value))} />
                {children}
                {/* Player Bar */}
                <div className="h-auto bg-[#181818] border-t border-[#282828] w-full">
                    <Player />
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
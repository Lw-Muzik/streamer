import React from 'react';
import SidebarComponent from '../sidebar/SidebarComponent';
import SearchComponent from '../search/SearchComponent';
import usePlayer from '@/hooks/usePlayer';
import Player from '../player/player';

interface AppLayoutIF {
    children: React.ReactNode;
}
const AppLayout: React.FC<AppLayoutIF> = ({ children }) => {
    const { search, setSearch, audioPlayerRef } = usePlayer();
    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Sidebar */}
            <SidebarComponent />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Search and controls */}
                <SearchComponent search={search} setSearch={setSearch} />
                {children}
                {/* Player Bar */}
                <div className="h-auto bg-[#181818] border-t border-[#282828] w-full">
                    <Player />
                </div>
            </div>
            {/* Hidden audio element */}
            <audio ref={audioPlayerRef} src="" id="audio" />
        </div>
    );
};

export default AppLayout;
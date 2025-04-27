import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

interface SearchIF {
    search: string;
    setSearch: (value: string) => void;
}

const SearchComponent: React.FC<SearchIF> = ({ search, setSearch }) => {
    const { data: session } = useSession();
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className="bg-[#121212] p-4 flex justify-between items-center">
            <div className='flex-1'></div>
            <div className="relative flex-1  max-w-xl">
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
            {/* User profile */}
            <div className="ml-4 relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                >
                    {session?.user?.image ? (
                        <Image
                            src={session.user.image}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="object-cover"
                        />
                    ) : (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    )}
                </button>
                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#282828] ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                            <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                                {session?.user?.name || 'User'}
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="block w-full px-4 py-2 text-sm text-white hover:bg-[#1DB954] text-left"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchComponent;
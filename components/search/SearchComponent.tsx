import React from 'react';
interface SearchIF {
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
}
const SearchComponent: React.FC<SearchIF> = ({ search, setSearch }) => {
    return (
        <div className="bg-[#121212] p-4 flex items-center">
            <div className="relative flex-1 max-w-xl">
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
        </div>
    );
};

export default SearchComponent;
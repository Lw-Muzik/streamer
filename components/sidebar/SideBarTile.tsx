import React from 'react';
interface SideBarTileIF {
    heading: string;
    children: React.ReactNode;
}
const SideBarTile: React.FC<SideBarTileIF> = ({ children, heading }) => {
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">{heading}</h2>
                <div className="flex flex-col space-y-3">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SideBarTile;
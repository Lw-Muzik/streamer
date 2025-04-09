import React from 'react';
interface ContentTabsIf {
    children: React.ReactNode;
}
const ContentTabsLayout: React.FC<ContentTabsIf> = ({ children }) => {
    return (
        <div className="flex-1 overflow-hidden p-6 bg-gradient-to-b from-[#1e1e1e] to-[#121212]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {children}
            </div>
        </div>
    );
};

export default ContentTabsLayout;
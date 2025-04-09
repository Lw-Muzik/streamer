"use client"
import ContentTabsLayout from "@/components/ContentTabs/ContentTabsLayout";
import SongsTab from "@/components/ContentTabs/SongsTab";
import AppLayout from "@/components/Layout/AppLayout";
import usePlayer from "@/hooks/usePlayer";
import Link from "next/link";
import React from "react";


export default function Page() {
    const {
        nextSong,
        previousSong,
        songProgress,
        isPlaying,
        currentSong,
        togglePlayPause,
    } = usePlayer();
    return (
        <AppLayout>
            <div className="bg-gradient-to-b from-[#121212] to-[#000000] text-white p-6">
                <div className="flex items-center mb-8">
                    <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
                        <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span className="text-lg font-medium">Back to Player</span>
                    </Link>
                </div>

                <ContentTabsLayout>
                    <div className="rounded-md h-[30rem] overflow-hidden flex items-center justify-center flex-shrink-0 border border-[#333333]">
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
                    {/* track info queue */}
                    <div className="h-[30rem] overflow-y-scroll">
                        <SongsTab />
                    </div>
                </ContentTabsLayout>

            </div>
        </AppLayout>
    );
}
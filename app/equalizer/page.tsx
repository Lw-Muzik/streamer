'use client';

import React from "react";
import Equalizer from "@/components/equalizer.tsx/equalizer";
import Link from "next/link";
import { useAudioContext } from "@/contexts/AudioContext";
import AppLayout from "@/components/Layout/AppLayout";

const Page = () => {
    const { getAudioElement } = useAudioContext();
    React.useEffect(() => {
        document.title = "Equalizer | Ethereal Tunes";
    }, []);
    return (
        <AppLayout>
            <div className=" overflow-y-scroll bg-gradient-to-b from-[#121212] to-[#000000] text-white p-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header with back button */}
                    <div className="flex items-center mb-8">
                        <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
                            <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            <span className="text-lg font-medium">Back to Player</span>
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold mb-6">Audio Settings</h1>

                    {/* Equalizer Component */}
                    <div className="mb-8">
                        <Equalizer />
                    </div>

                    {/* Audio Information */}
                    {getAudioElement() && (<div className="bg-[#121212] p-4 rounded-lg mt-8">
                        <h2 className="text-xl font-bold mb-4">Audio Information</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-400">Status</p>
                                <p>{getAudioElement()?.paused ? 'Paused' : 'Playing'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Volume</p>
                                <p>{getAudioElement() ? Math.round(getAudioElement()!.volume * 100) : 0}%</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Current Time</p>
                                <p>{getAudioElement() ? formatTime(getAudioElement()!.currentTime) : '0:00'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Duration</p>
                                <p>{getAudioElement() ? formatTime(getAudioElement()!.duration) : '0:00'}</p>
                            </div>
                        </div>
                    </div>)}
                </div>
            </div>
        </AppLayout>
    );
};

// Helper function to format time
const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default Page;
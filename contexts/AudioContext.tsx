"use client"
import React, { createContext, useContext, useRef, ReactNode } from 'react';

interface AudioContextType {
  getAudioElement: () => HTMLAudioElement | null;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const getAudioElement = (): HTMLAudioElement | null => {
    return audioRef.current;
  };

  const contextValue: AudioContextType = {
    getAudioElement
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
      <audio
        ref={audioRef}
        id="audio"
        className="hidden"
        preload="auto"
        crossOrigin="anonymous"
      />
    </AudioContext.Provider>
  );
};

export const useAudioContext = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};

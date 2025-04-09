'use client';

import React, { useState, useEffect } from 'react';
import { useEqualizer } from '@/hooks/useEqualizer';
import { useAudioContext } from '@/contexts/AudioContext';

interface EqualizerProps {
  onEnableChange?: (enabled: boolean) => void;
}

// Presets for the equalizer
const PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0],
  bass: [7, 5, 3, 0, 0, 0, 0],
  treble: [0, 0, 0, 1, 3, 5, 7],
  vocal: [-3, -2, 0, 4, 2, -1, 0],
  rock: [4, 3, -1, -2, 2, 4, 5]
};

const Equalizer: React.FC<EqualizerProps> = ({
  onEnableChange
}) => {
  const [activeTab, setActiveTab] = useState<'eq' | 'comp' | 'tone'>('eq');
  const [compressorEnabled, setCompressorEnabled] = useState<boolean>(false);
  const [compressorSettings, setCompressorSettings] = useState({
    threshold: -24,
    ratio: 12,
    attack: 0.003,
    release: 0.25,
    knee: 30
  });
  const [preampGain, setPreampGain] = useState<number>(0);

  // Get the audio context
  const { getAudioElement } = useAudioContext();
  const audioElement = getAudioElement();

  const {
    isEnabled,
    isConnected,
    eqValues,
    frequencyBands,
    bassFilter,
    trebleFilter,
    connectEqualizer,
    disconnectEqualizer,
    toggleEqualizer,
    setBandGain,
    setAllBandGains,
    setBassFilterSettings,
    setTrebleFilterSettings,
    resetEqualizer
  } = useEqualizer();

  // Auto-connect when audio element is available and keep connected
  // Use a ref to track if we've already tried to connect
  const hasTriedToConnect = React.useRef(false);
  
  useEffect(() => {
    // Only try to connect once when the audio element is available
    if (audioElement && !isConnected && !hasTriedToConnect.current) {
      hasTriedToConnect.current = true;
      connectEqualizer();
    }

    // Don't disconnect when component unmounts
    // This allows the equalizer to keep running in the background
    return () => { };
  // Remove connectEqualizer from dependencies as it can cause re-renders
  }, [audioElement, isConnected]);

  // Handle EQ slider changes
  const handleEQChange = (index: number, value: number) => {
    setBandGain(index, value);
  };

  // Handle preamp gain changes
  const handlePreampChange = (value: number) => {
    setPreampGain(value);
    // You would apply this gain to your audio context's gain node
    // This is a placeholder for the actual implementation
    console.log(`Preamp gain set to: ${value}dB`);
  };

  // Handle bass filter changes
  const handleBassChange = (value: number) => {
    setBassFilterSettings({ frequency: bassFilter.frequency, gain: value });
  };

  // Handle bass frequency changes
  const handleBassFrequencyChange = (value: number) => {
    setBassFilterSettings({ frequency: value, gain: bassFilter.gain });
  };

  // Handle treble filter changes
  const handleTrebleChange = (value: number) => {
    setTrebleFilterSettings({ frequency: trebleFilter.frequency, gain: value });
  };

  // Handle treble frequency changes
  const handleTrebleFrequencyChange = (value: number) => {
    setTrebleFilterSettings({ frequency: value, gain: trebleFilter.gain });
  };

  // Handle compressor setting changes
  const handleCompressorChange = (setting: keyof typeof compressorSettings, value: number) => {
    setCompressorSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Apply preset
  const applyPreset = (presetName: keyof typeof PRESETS) => {
    setAllBandGains(PRESETS[presetName]);
  };

  // Toggle equalizer
  const handleToggleEqualizer = () => {
    const newState = !isEnabled;
    toggleEqualizer(newState);
    if (onEnableChange) {
      onEnableChange(newState);
    }
  };

  // Toggle connection to audio
  const handleToggleConnection = () => {
    console.log('Toggle connection, current state:', isConnected);
    
    // Use a local variable to track the current UI state
    // This prevents issues with stale state in the closure
    const currentlyConnected = isConnected;
    
    if (currentlyConnected) {
      console.log('Disconnecting equalizer...');
      disconnectEqualizer();
      // Reset the hasTriedToConnect ref so we can connect again
      hasTriedToConnect.current = false;
    } else {
      console.log('Connecting equalizer...');
      // Force connection attempt even if we've tried before
      hasTriedToConnect.current = false;
      // Add a small delay to ensure any previous state updates have completed
      setTimeout(() => {
        connectEqualizer();
      }, 50);
    }
  };

  // Calculate the position of the slider handle
  const getHandlePosition = (value: number) => {
    // Map from -12...12 to 0...100%
    return 50 - ((value / 24) * 100);
  };

  return (
    <div className="bg-[#1a2330] border border-[#2a3a4a] m-2 rounded-lg text-white shadow-lg">
      <div className="flex justify-between items-center p-3 border-b border-[#2a3a4a]">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('eq')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${activeTab === 'eq' ? 'bg-[#1DB954] text-white' : 'bg-[#2a3a4a] text-gray-300 hover:bg-[#3a4a5a]'}`}
          >
            Equalizer
          </button>
          <button
            onClick={() => setActiveTab('tone')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${activeTab === 'tone' ? 'bg-[#1DB954] text-white' : 'bg-[#2a3a4a] text-gray-300 hover:bg-[#3a4a5a]'}`}
          >
            Bass & Treble
          </button>
          <button
            onClick={() => setActiveTab('comp')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${activeTab === 'comp' ? 'bg-[#1DB954] text-white' : 'bg-[#2a3a4a] text-gray-300 hover:bg-[#3a4a5a]'}`}
          >
            Compressor
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleEqualizer}
            className={`px-3 py-1 rounded-md text-xs transition-colors ${isEnabled ? 'bg-[#1DB954] text-white' : 'bg-[#2a3a4a] text-gray-300 hover:bg-[#3a4a5a]'}`}
            disabled={!isConnected}
          >
            {isEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {activeTab === 'eq' && (
        <>
          <div className="flex p-4">
            {/* Left side - preamp slider and reference scale */}
            <div className="w-24 flex flex-col justify-between items-center pr-6 relative">
              <div className="text-xs text-gray-400">+12 dB</div>

              {/* Preamp slider */}
              <div className="relative w-[2px] h-48 bg-[#2a3a4a] mb-2">
                <div
                  className="absolute bottom-1/2 w-[2px] bg-[#1DB954]"
                  style={{
                    height: preampGain > 0 ? `${(preampGain / 12) * 50}%` : '0',
                  }}
                ></div>
                <div
                  className="absolute top-1/2 w-[2px] bg-[#1DB954]"
                  style={{
                    height: preampGain < 0 ? `${(Math.abs(preampGain) / 12) * 50}%` : '0',
                  }}
                ></div>

                {/* Slider handle */}
                <div
                  className="absolute w-6 h-6 bg-white rounded-full shadow-lg transform -translate-x-1/2 left-1/2 cursor-pointer z-10"
                  style={{
                    top: `${getHandlePosition(preampGain)}%`,
                  }}
                ></div>

                {/* Invisible slider input for interaction */}
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={preampGain}
                  onChange={(e) => handlePreampChange(parseInt(e.target.value))}
                  className="absolute inset-0 w-12 h-full opacity-0 cursor-pointer -left-5 z-20"
                  disabled={!isConnected}
                />
              </div>

              <div className="text-xs text-gray-400">-12 dB</div>

              <div className="text-xs font-medium text-center mt-2 mb-4">Preamp</div>
            </div>

            {/* Right side - EQ sliders */}
            <div className="flex-1 flex justify-between items-end space-x-6">
              {frequencyBands.map((freq, index) => (
                <div key={freq} className="flex flex-col items-center flex-1">
                  {/* Value indicator */}
                  <div className="text-xs font-medium mb-1 h-5 text-gray-400">
                    {eqValues[index] > 0 ? `+${eqValues[index]}` : eqValues[index]}
                  </div>

                  {/* Slider track */}
                  <div className="relative w-[2px] h-48 bg-[#2a3a4a] mb-2">
                    {/* Active part of slider */}
                    <div
                      className="absolute bottom-1/2 w-[2px] bg-[#1DB954]"
                      style={{
                        height: eqValues[index] > 0 ? `${(eqValues[index] / 12) * 50}%` : '0',
                      }}
                    ></div>
                    <div
                      className="absolute top-1/2 w-[2px] bg-[#1DB954]"
                      style={{
                        height: eqValues[index] < 0 ? `${(Math.abs(eqValues[index]) / 12) * 50}%` : '0',
                      }}
                    ></div>

                    {/* Slider handle */}
                    <div
                      className="absolute w-6 h-6 bg-white rounded-full shadow-lg transform -translate-x-1/2 left-1/2 cursor-pointer z-10"
                      style={{
                        top: `${getHandlePosition(eqValues[index])}%`,
                      }}
                    ></div>

                    {/* Invisible slider input for interaction */}
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={eqValues[index]}
                      onChange={(e) => handleEQChange(index, parseInt(e.target.value))}
                      className="absolute inset-0 w-12 h-full opacity-0 cursor-pointer -left-5 z-20"
                      disabled={!isConnected}
                    />
                  </div>

                  {/* Frequency label */}
                  <div className="text-xs text-gray-400 mt-1">
                    {freq < 1000 ? freq : `${freq / 1000}k`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="flex justify-between p-3 border-t border-[#2a3a4a]">
            <div className="flex items-center">
              <div className="relative w-48">
                <select
                  onChange={(e) => applyPreset(e.target.value as keyof typeof PRESETS)}
                  className="w-full px-3 py-2 bg-[#2a3a4a] hover:bg-[#3a4a5a] rounded text-sm appearance-none cursor-pointer"
                  disabled={!isConnected}
                >
                  <option value="rock">Rock Preset</option>
                  <option value="flat">Flat</option>
                  <option value="bass">Bass Boost</option>
                  <option value="treble">Treble Boost</option>
                  <option value="vocal">Vocal Boost</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <button
              onClick={resetEqualizer}
              className="px-4 py-2 bg-[#1DB954] hover:bg-[#19a64a] text-white rounded text-sm"
              disabled={!isConnected}
            >
              Reset
            </button>
          </div>
        </>
      )}

      {activeTab === 'tone' && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold">Bass & Treble Controls</h3>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Bass Control */}
            <div className="flex flex-col">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Bass</span>
                <span className="text-xs text-gray-400">{bassFilter.gain > 0 ? `+${bassFilter.gain}` : bassFilter.gain} dB</span>
              </div>

              {/* Bass Gain Slider */}
              <div className="h-1 bg-[#2a3a4a] rounded-full mb-4 relative">
                <div
                  className="absolute h-full bg-[#1DB954] rounded-full"
                  style={{
                    width: `${((bassFilter.gain + 12) / 24) * 100}%`
                  }}
                ></div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={bassFilter.gain}
                  onChange={(e) => handleBassChange(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-6 -top-2 opacity-0 cursor-pointer"
                  disabled={!isConnected}
                />
              </div>

              <div className="flex justify-between mb-2 mt-4">
                <span className="text-sm font-medium">Frequency</span>
                <span className="text-xs text-gray-400">{bassFilter.frequency} Hz</span>
              </div>

              {/* Bass Frequency Slider */}
              <div className="h-1 bg-[#2a3a4a] rounded-full mb-4 relative">
                <div
                  className="absolute h-full bg-[#1DB954] rounded-full"
                  style={{
                    width: `${(bassFilter.frequency / 400) * 100}%`
                  }}
                ></div>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="10"
                  value={bassFilter.frequency}
                  onChange={(e) => handleBassFrequencyChange(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-6 -top-2 opacity-0 cursor-pointer"
                  disabled={!isConnected}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>50 Hz</span>
                <span>400 Hz</span>
              </div>
            </div>

            {/* Treble Control */}
            <div className="flex flex-col">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Treble</span>
                <span className="text-xs text-gray-400">{trebleFilter.gain > 0 ? `+${trebleFilter.gain}` : trebleFilter.gain} dB</span>
              </div>

              {/* Treble Gain Slider */}
              <div className="h-1 bg-[#2a3a4a] rounded-full mb-4 relative">
                <div
                  className="absolute h-full bg-[#1DB954] rounded-full"
                  style={{
                    width: `${((trebleFilter.gain + 12) / 24) * 100}%`
                  }}
                ></div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={trebleFilter.gain}
                  onChange={(e) => handleTrebleChange(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-6 -top-2 opacity-0 cursor-pointer"
                  disabled={!isConnected}
                />
              </div>

              <div className="flex justify-between mb-2 mt-4">
                <span className="text-sm font-medium">Frequency</span>
                <span className="text-xs text-gray-400">{trebleFilter.frequency} Hz</span>
              </div>

              {/* Treble Frequency Slider */}
              <div className="h-1 bg-[#2a3a4a] rounded-full mb-4 relative">
                <div
                  className="absolute h-full bg-[#1DB954] rounded-full"
                  style={{
                    width: `${((trebleFilter.frequency - 1000) / 9000) * 100}%`
                  }}
                ></div>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="100"
                  value={trebleFilter.frequency}
                  onChange={(e) => handleTrebleFrequencyChange(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-6 -top-2 opacity-0 cursor-pointer"
                  disabled={!isConnected}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>1 kHz</span>
                <span>10 kHz</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-[#152030] rounded border border-[#2a3a4a]">
            <p className="text-xs text-gray-400">
              Bass control uses a lowshelf filter to boost or cut frequencies below the cutoff.
              Treble control uses a highshelf filter to boost or cut frequencies above the cutoff.
              Adjust both the gain and frequency for precise tone control.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'comp' && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold">Compressor</h3>
            <button
              onClick={() => setCompressorEnabled(!compressorEnabled)}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${compressorEnabled ? 'bg-[#1DB954] text-white' : 'bg-[#2a3a4a] text-gray-300 hover:bg-[#3a4a5a]'}`}
            >
              {compressorEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {Object.entries(compressorSettings).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1 capitalize">{key}</label>
                <div className="h-1 bg-[#2a3a4a] rounded-full mb-1 relative">
                  <div
                    className="absolute h-full bg-[#1DB954] rounded-full"
                    style={{
                      width: key === 'threshold' ? `${(1 - (Math.abs(value) / 60)) * 100}%` :
                        key === 'ratio' ? `${(value / 20) * 100}%` :
                          key === 'attack' || key === 'release' ? `${(value) * 100}%` :
                            key === 'knee' ? `${(value / 40) * 100}%` : '0%'
                    }}
                  ></div>
                </div>
                <input
                  type="range"
                  min={
                    key === 'threshold' ? -60 :
                      key === 'ratio' ? 1 :
                        key === 'attack' || key === 'release' ? 0 :
                          key === 'knee' ? 0 : 0
                  }
                  max={
                    key === 'threshold' ? 0 :
                      key === 'ratio' ? 20 :
                        key === 'attack' ? 1 :
                          key === 'release' ? 1 :
                            key === 'knee' ? 40 : 1
                  }
                  step={
                    key === 'attack' || key === 'release' ? 0.001 :
                      key === 'threshold' || key === 'ratio' || key === 'knee' ? 1 : 0.1
                  }
                  value={value}
                  onChange={(e) => handleCompressorChange(key as keyof typeof compressorSettings, parseFloat(e.target.value))}
                  className="w-full h-2 bg-transparent appearance-none cursor-pointer"
                  disabled={!compressorEnabled}
                />
                <span className="text-xs mt-1 text-center">{
                  key === 'threshold' ? `${value} dB` :
                    key === 'ratio' ? `${value}:1` :
                      key === 'attack' || key === 'release' ? `${(value * 1000).toFixed(1)} ms` :
                        key === 'knee' ? `${value} dB` : value
                }</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="text-xs p-3 bg-[#152030] mt-1 rounded-b-lg flex justify-between items-center border-t border-[#2a3a4a]">
        <div>
          <span className="text-gray-400">Status: </span>
          <span className={isConnected ? "text-green-400" : "text-red-400"}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        {isConnected ? (
          <button
            onClick={handleToggleConnection}
            className="px-3 py-1.5 bg-[#D32F2F] hover:bg-[#C62828] text-white rounded-md text-xs transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleToggleConnection}
            className="px-3 py-1.5 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-md text-xs transition-colors"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

export default Equalizer;
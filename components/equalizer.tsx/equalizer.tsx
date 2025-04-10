'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEqualizer, PRESETS } from '@/hooks/useEqualizer';
import { useAudioContext } from '@/contexts/AudioContext';

interface EqualizerProps {
  onEnableChange?: (enabled: boolean) => void;
}

interface CustomPreset {
  name: string;
  values: number[];
}

const Equalizer: React.FC<EqualizerProps> = ({
  onEnableChange
}) => {
  const [activeTab, setActiveTab] = useState<'eq' | 'comp' | 'tone' | 'presets'>('eq');
  const [compressorEnabled, setCompressorEnabled] = useState<boolean>(false);
  const [compressorSettings, setCompressorSettings] = useState({
    threshold: -24,
    ratio: 12,
    attack: 0.003,
    release: 0.25,
    knee: 30
  });
  const [preampGain, setPreampGain] = useState<number>(0);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('Normal');
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const saveDialogRef = useRef<HTMLDivElement>(null);

  // Get the audio context
  const { getAudioElement } = useAudioContext();
  const audioElement = getAudioElement();
  
  // Load custom presets from localStorage on component mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('customEqPresets');
    if (savedPresets) {
      try {
        const parsedPresets = JSON.parse(savedPresets);
        setCustomPresets(parsedPresets);
      } catch (error) {
        console.error('Error parsing saved presets:', error);
      }
    }
    
    // Load last used preset
    const lastUsedPreset = localStorage.getItem('lastUsedEqPreset');
    if (lastUsedPreset) {
      setSelectedPreset(lastUsedPreset);
    }
  }, []);

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
  const applyPreset = (presetName: string) => {
    // Check if it's a built-in preset
    if (presetName in PRESETS) {
      const preset = PRESETS[presetName as keyof typeof PRESETS];
      setAllBandGains(preset);
      setSelectedPreset(presetName);
      localStorage.setItem('lastUsedEqPreset', presetName);
      return;
    }
    
    // Check if it's a custom preset
    const customPreset = customPresets.find(p => p.name === presetName);
    if (customPreset) {
      setAllBandGains(customPreset.values);
      setSelectedPreset(presetName);
      localStorage.setItem('lastUsedEqPreset', presetName);
    }
  };
  
  // Save current EQ settings as a custom preset
  const saveCustomPreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: CustomPreset = {
      name: newPresetName.trim(),
      values: [...eqValues]
    };
    
    // Check if a preset with this name already exists
    const existingIndex = customPresets.findIndex(p => p.name === newPreset.name);
    
    let updatedPresets: CustomPreset[];
    if (existingIndex >= 0) {
      // Update existing preset
      updatedPresets = [...customPresets];
      updatedPresets[existingIndex] = newPreset;
    } else {
      // Add new preset
      updatedPresets = [...customPresets, newPreset];
    }
    
    setCustomPresets(updatedPresets);
    localStorage.setItem('customEqPresets', JSON.stringify(updatedPresets));
    setSelectedPreset(newPreset.name);
    localStorage.setItem('lastUsedEqPreset', newPreset.name);
    setNewPresetName('');
    setShowSaveDialog(false);
  };
  
  // Delete a custom preset
  const deleteCustomPreset = (presetName: string) => {
    const updatedPresets = customPresets.filter(p => p.name !== presetName);
    setCustomPresets(updatedPresets);
    localStorage.setItem('customEqPresets', JSON.stringify(updatedPresets));
    
    // If the deleted preset was selected, switch to Normal
    if (selectedPreset === presetName) {
      applyPreset('Normal');
    }
  };
  
  // Handle click outside save dialog
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (saveDialogRef.current && !saveDialogRef.current.contains(event.target as Node)) {
        setShowSaveDialog(false);
      }
    };
    
    if (showSaveDialog) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSaveDialog]);

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
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${activeTab === 'presets' ? 'bg-[#1DB954] text-white' : 'bg-[#2a3a4a] text-gray-300 hover:bg-[#3a4a5a]'}`}
          >
            Presets
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
                  value={selectedPreset}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2a3a4a] hover:bg-[#3a4a5a] rounded text-sm appearance-none cursor-pointer"
                  disabled={!isConnected}
                >
                  <optgroup label="Built-in Presets">
                    {Object.keys(PRESETS).map((preset) => (
                      <option key={preset} value={preset}>{preset}</option>
                    ))}
                  </optgroup>
                  
                  {customPresets.length > 0 && (
                    <optgroup label="Custom Presets">
                      {customPresets.map((preset) => (
                        <option key={preset.name} value={preset.name}>{preset.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="px-4 py-2 bg-[#2a3a4a] hover:bg-[#3a4a5a] text-white rounded text-sm"
                disabled={!isConnected}
              >
                Save
              </button>
              <button
                onClick={resetEqualizer}
                className="px-4 py-2 bg-[#1DB954] hover:bg-[#19a64a] text-white rounded text-sm"
                disabled={!isConnected}
              >
                Reset
              </button>
            </div>
            
            {/* Save Preset Dialog */}
            {showSaveDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div ref={saveDialogRef} className="bg-[#1a2330] border border-[#2a3a4a] rounded-lg p-4 w-80">
                  <h3 className="text-white text-lg font-semibold mb-4">Save Preset</h3>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Preset Name"
                    className="w-full px-3 py-2 bg-[#2a3a4a] text-white rounded mb-4"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="px-4 py-2 bg-[#3a4a5a] text-white rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCustomPreset}
                      className="px-4 py-2 bg-[#1DB954] text-white rounded"
                      disabled={!newPresetName.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                  step="5"
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

      {activeTab === 'presets' && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold">Equalizer Presets</h3>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-3 py-1 bg-[#1DB954] hover:bg-[#19a64a] text-white rounded text-xs"
              disabled={!isConnected}
            >
              Save Current Settings
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-xs font-semibold mb-2 text-gray-400">Built-in Presets</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {Object.keys(PRESETS).map((preset) => (
                  <div key={preset} className="flex justify-between items-center bg-[#2a3a4a] p-2 rounded">
                    <span className="text-sm">{preset}</span>
                    <button
                      onClick={() => applyPreset(preset)}
                      className={`px-2 py-1 text-xs rounded ${selectedPreset === preset ? 'bg-[#1DB954] text-white' : 'bg-[#3a4a5a] text-gray-300 hover:bg-[#4a5a6a]'}`}
                      disabled={!isConnected}
                    >
                      {selectedPreset === preset ? 'Active' : 'Apply'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-semibold text-gray-400">Custom Presets</h4>
              </div>
              {customPresets.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {customPresets.map((preset) => (
                    <div key={preset.name} className="flex justify-between items-center bg-[#2a3a4a] p-2 rounded">
                      <span className="text-sm">{preset.name}</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => applyPreset(preset.name)}
                          className={`px-2 py-1 text-xs rounded ${selectedPreset === preset.name ? 'bg-[#1DB954] text-white' : 'bg-[#3a4a5a] text-gray-300 hover:bg-[#4a5a6a]'}`}
                          disabled={!isConnected}
                        >
                          {selectedPreset === preset.name ? 'Active' : 'Apply'}
                        </button>
                        <button
                          onClick={() => deleteCustomPreset(preset.name)}
                          className="px-2 py-1 text-xs rounded bg-[#e53935] text-white hover:bg-[#f44336]"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#2a3a4a] p-3 rounded text-center text-gray-400 text-sm">
                  No custom presets saved yet.
                  <div className="mt-2">
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      className="px-3 py-1 bg-[#3a4a5a] hover:bg-[#4a5a6a] text-white rounded text-xs"
                      disabled={!isConnected}
                    >
                      Create New Preset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 bg-[#2a3a4a] p-3 rounded">
            <h4 className="text-xs font-semibold mb-2">Current EQ Settings</h4>
            <div className="flex justify-between">
              {frequencyBands.map((freq, index) => (
                <div key={freq} className="flex flex-col items-center">
                  <div 
                    className="w-1 h-12 bg-[#3a4a5a] relative rounded-full overflow-hidden"
                    title={`${freq < 1000 ? freq : `${freq / 1000}k`}Hz: ${eqValues[index]}dB`}
                  >
                    <div 
                      className={`absolute bottom-6 w-full ${eqValues[index] > 0 ? 'bg-[#1DB954]' : 'bg-[#e53935]'}`}
                      style={{
                        height: `${Math.abs(eqValues[index]) / 12 * 100}%`,
                        bottom: eqValues[index] >= 0 ? '50%' : 'auto',
                        top: eqValues[index] < 0 ? '50%' : 'auto'
                      }}
                    ></div>
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1">
                    {freq < 1000 ? freq : `${freq / 1000}k`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'comp' && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold">Compressor</h3>
            <div className="flex items-center">
              <span className="text-xs text-gray-400 mr-2">Enable</span>
              <button
                onClick={() => setCompressorEnabled(!compressorEnabled)}
                className={`w-10 h-5 rounded-full relative ${compressorEnabled ? 'bg-[#1DB954]' : 'bg-[#2a3a4a]'} transition-colors`}
                disabled={!isConnected}
              >
                <span
                  className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${compressorEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                ></span>
              </button>
            </div>
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
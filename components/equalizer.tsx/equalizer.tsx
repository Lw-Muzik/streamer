'use client';

import React, { useState, useEffect, useRef } from 'react';

interface EqualizerProps {
  onEnableChange?: (enabled: boolean) => void;
}

// Frequency bands for a 10-band equalizer (in Hz)
const FREQUENCY_BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

const Equalizer: React.FC<EqualizerProps> = ({
  onEnableChange
}) => {
  // States for UI and audio processing
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [compressorEnabled, setCompressorEnabled] = useState<boolean>(false);
  const [compressorSettings, setCompressorSettings] = useState({
    threshold: -24,
    ratio: 12,
    attack: 0.003,
    release: 0.25,
    knee: 30
  });
  const [eqValues, setEqValues] = useState<number[]>(Array(FREQUENCY_BANDS.length).fill(0));
  const [presets, setPresets] = useState({
    flat: Array(FREQUENCY_BANDS.length).fill(0),
    bass: [7, 5, 3, 1, 0, 0, 0, 0, 0, 0],
    treble: [0, 0, 0, 0, 0, 0, 1, 3, 5, 7],
    vocal: [-3, -2, 0, 3, 4, 3, 1, 0, -1, -2]
  });
  const [activeTab, setActiveTab] = useState<'eq' | 'comp'>('eq');

  // Refs to store audio nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Start capturing tab audio
  const startCapture = () => {
    // if (typeof chrome === 'undefined' || !chrome.tabCapture) {
    //   console.error("Chrome tabCapture API not available");
    //   return;
    // }

    chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
      if (stream) {
        // Store the stream for later cleanup
        mediaStreamRef.current = stream;

        // Create audio context if it doesn't exist
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        // Create audio source from captured stream
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

        // Create gain node (master volume)
        const gainNode = audioContextRef.current.createGain();
        gainNodeRef.current = gainNode;

        // Create compressor
        const compressor = audioContextRef.current.createDynamicsCompressor();
        compressorRef.current = compressor;
        updateCompressorSettings();

        // Create filters for each frequency band
        const filters = FREQUENCY_BANDS.map(frequency => {
          const filter = audioContextRef.current!.createBiquadFilter();
          filter.type = 'peaking'; // EQ filter type
          filter.frequency.value = frequency;
          filter.Q.value = 1.4; // Quality factor
          filter.gain.value = 0; // Initial gain (0dB = no change)
          return filter;
        });
        filtersRef.current = filters;

        // Connect nodes based on current settings
        if (isEnabled) {
          connectNodes();
        } else {
          // Just pass through if not enabled
          sourceRef.current.connect(audioContextRef.current.destination);
        }

        setIsCapturing(true);
        console.log("Tab audio capture started");
      } else {
        console.error("Error starting tab capture:", chrome.runtime.lastError);
      }
    });
  };

  // Stop capturing tab audio
  const stopCapture = () => {
    // Stop all tracks in the media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect audio nodes
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }

    if (compressorRef.current) {
      compressorRef.current.disconnect();
    }

    filtersRef.current.forEach(filter => {
      filter.disconnect();
    });

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsCapturing(false);
    console.log("Tab audio capture stopped");
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  // Update connections when enabled state changes
  useEffect(() => {
    if (!isCapturing || !sourceRef.current || !audioContextRef.current) return;

    // Disconnect existing connections
    sourceRef.current.disconnect();
    if (gainNodeRef.current) gainNodeRef.current.disconnect();
    if (compressorRef.current) compressorRef.current.disconnect();
    filtersRef.current.forEach(filter => filter.disconnect());

    if (isEnabled) {
      connectNodes();
    } else {
      // Bypass processing if disabled
      sourceRef.current.connect(audioContextRef.current.destination);
    }
  }, [isEnabled, compressorEnabled, isCapturing]);

  // Update filter values when eqValues change
  useEffect(() => {
    if (!isEnabled || !isCapturing) return;

    filtersRef.current.forEach((filter, index) => {
      if (filter) {
        filter.gain.value = eqValues[index];
      }
    });
  }, [eqValues, isEnabled, isCapturing]);

  // Update compressor settings when they change
  useEffect(() => {
    updateCompressorSettings();
  }, [compressorSettings]);

  // Connect nodes in the proper order
  const connectNodes = () => {
    if (!sourceRef.current || !audioContextRef.current || !gainNodeRef.current ||
      !compressorRef.current || filtersRef.current.length === 0) return;

    // Connect source to the first filter
    sourceRef.current.connect(filtersRef.current[0]);

    // Connect filters in series
    for (let i = 0; i < filtersRef.current.length - 1; i++) {
      filtersRef.current[i].connect(filtersRef.current[i + 1]);
    }

    // Connect the last filter to the gain node
    filtersRef.current[filtersRef.current.length - 1].connect(gainNodeRef.current);

    // Connect gain to compressor or destination based on compressor state
    if (compressorEnabled) {
      gainNodeRef.current.connect(compressorRef.current);
      compressorRef.current.connect(audioContextRef.current.destination);
    } else {
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  };

  // Update compressor settings
  const updateCompressorSettings = () => {
    if (!compressorRef.current) return;

    compressorRef.current.threshold.value = compressorSettings.threshold;
    compressorRef.current.ratio.value = compressorSettings.ratio;
    compressorRef.current.attack.value = compressorSettings.attack;
    compressorRef.current.release.value = compressorSettings.release;
    compressorRef.current.knee.value = compressorSettings.knee;
  };

  // Handle EQ slider changes
  const handleEQChange = (index: number, value: number) => {
    const newValues = [...eqValues];
    newValues[index] = value;
    setEqValues(newValues);
  };

  // Handle compressor setting changes
  const handleCompressorChange = (setting: keyof typeof compressorSettings, value: number) => {
    setCompressorSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Apply preset
  const applyPreset = (presetName: keyof typeof presets) => {
    setEqValues([...presets[presetName]]);
  };

  // Toggle equalizer
  const toggleEqualizer = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    if (onEnableChange) {
      onEnableChange(newState);
    }
  };

  // Toggle compressor
  const toggleCompressor = () => {
    setCompressorEnabled(prev => !prev);
  };

  // Toggle capture
  const toggleCapture = () => {
    if (isCapturing) {
      stopCapture();
    } else {
      startCapture();
    }
  };

  return (
    <div className="bg-[#28282828] m-2 rounded-lg text-white">
      <div className="flex justify-between items-center mb-3">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('eq')}
            className={`px-3 py-1 text-xs rounded-md ${activeTab === 'eq' ? 'bg-[#333333]' : 'bg-transparent'}`}
          >
            Equalizer
          </button>
          <button
            onClick={() => setActiveTab('comp')}
            className={`px-3 py-1 text-xs rounded-md ${activeTab === 'comp' ? 'bg-[#333333]' : 'bg-transparent'}`}
          >
            Compressor
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleCapture}
            className={`px-3 py-1 rounded-md text-xs ${isCapturing ? 'bg-[#D32F2F] text-white' : 'bg-[#2196F3] text-white'}`}
          >
            {isCapturing ? 'Stop Capture' : 'Start Capture'}
          </button>
          <button
            onClick={toggleEqualizer}
            className={`px-3 py-1 rounded-md text-xs ${isEnabled ? 'bg-[#1DB954] text-white' : 'bg-[#333333] text-gray-300'}`}
            disabled={!isCapturing}
          >
            {isEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {activeTab === 'eq' && (
        <>
          {/* EQ Sliders */}
          <div className="flex justify-between items-end h-24 mb-2 px-2">
            {FREQUENCY_BANDS.map((freq, index) => (
              <div key={freq} className="flex flex-col items-center">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={eqValues[index]}
                  onChange={(e) => handleEQChange(index, parseInt(e.target.value))}
                  className="h-20 appearance-none bg-transparent cursor-pointer"
                  style={{
                    writingMode: 'vertical-lr' as any,
                    WebkitAppearance: 'slider-vertical' /* WebKit */
                  }}
                  disabled={!isEnabled || !isCapturing}
                />
                <div className="text-[10px] text-center mt-1">
                  <div className="font-medium">{freq < 1000 ? freq : `${freq / 1000}k`}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Presets */}
          <div className="flex justify-center space-x-2 pt-1 pb-2">
            {Object.keys(presets).map((preset) => (
              <button
                key={preset}
                onClick={() => applyPreset(preset as keyof typeof presets)}
                className="px-2 py-1 bg-[#333333] hover:bg-[#444444] rounded text-xs uppercase"
                disabled={!isEnabled || !isCapturing}
              >
                {preset}
              </button>
            ))}
          </div>
        </>
      )}

      {activeTab === 'comp' && (
        <div className="pb-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold">Compressor</h3>
            <button
              onClick={toggleCompressor}
              className={`px-2 py-1 rounded-md text-xs ${compressorEnabled ? 'bg-[#1DB954] text-white' : 'bg-[#333333] text-gray-300'}`}
              disabled={!isEnabled || !isCapturing}
            >
              {compressorEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Object.entries(compressorSettings).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <label className="text-[10px] text-gray-400 mb-1 capitalize">{key}</label>
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
                  className="w-full"
                  disabled={!isEnabled || !compressorEnabled || !isCapturing}
                />
                <span className="text-[10px] mt-1">{
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

      {/* Instructions */}
      {!isCapturing && (
        <div className="text-xs p-3 bg-[#333333] mt-2 rounded">
          <p className="mb-2"><strong>Note:</strong> This component requires the Chrome Tab Capture API, which is only available in Chrome extensions.</p>
          <p>To use this in a Chrome extension, make sure to add the following to your manifest.json:</p>
          <pre className="bg-[#222222] p-2 rounded mt-1 overflow-x-auto">
            {`"permissions": ["tabCapture", "activeTab"]`}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Equalizer;
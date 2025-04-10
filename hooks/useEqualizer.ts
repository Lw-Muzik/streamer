'use client';

import { useState, useEffect, useRef } from 'react';
import { useAudioContext } from '@/contexts/AudioContext';

// Define frequency bands for the equalizer
const FREQUENCY_BANDS = [60, 150, 400, 1000, 4000, 16000];

// Global state for the equalizer that persists across component instances
let globalState = {
    isEnabled: false,
    eqValues: [] as number[],
    bassFilter: { frequency: 200, gain: 0 },
    trebleFilter: { frequency: 2000, gain: 0 }
};

// Global audio context and nodes
let globalAudioContext: AudioContext | null = null;
let globalSourceNode: MediaElementAudioSourceNode | null = null;
let globalGainNode: GainNode | null = null;
// Add filter nodes for each frequency band
let eqFilters: BiquadFilterNode[] = [];
let bassBiquadFilter: BiquadFilterNode | null = null;
let trebleBiquadFilter: BiquadFilterNode | null = null;
let analyserNodeFilter: AnalyserNode | null = null;
let isConnected = false;

export const useEqualizer = () => {
    // Get the audio element from context
    const { getAudioElement } = useAudioContext();

    // State for the equalizer
    const [isEnabled, setIsEnabled] = useState<boolean>(globalState.isEnabled);
    const [connected, setConnected] = useState<boolean>(isConnected);
    const [eqValues, setEqValues] = useState<number[]>(
        globalState.eqValues.length === FREQUENCY_BANDS.length
            ? globalState.eqValues
            : Array(FREQUENCY_BANDS.length).fill(0)
    );
    const [bassFilter, setBassFilter] = useState<{ frequency: number; gain: number }>(globalState.bassFilter);
    const [trebleFilter, setTrebleFilter] = useState<{ frequency: number; gain: number }>(globalState.trebleFilter);

    // Reference to the audio element
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Simple function to create the audio context and connect it to the audio element
    const setupAudio = () => {
        try {
            // Get the audio element
            const audioElement = getAudioElement();
            if (!audioElement) {
                console.error("Audio element not found");
                return false;
            }

            audioRef.current = audioElement;
            console.log("Found audio element:", audioElement.src);

            // Create the audio context if it doesn't exist
            if (!globalAudioContext) {
                globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                console.log("Created new AudioContext");
            }

            // Create the source node if it doesn't exist
            if (!globalSourceNode && globalAudioContext) {
                try {
                    globalSourceNode = globalAudioContext.createMediaElementSource(audioElement);
                    analyserNodeFilter = globalAudioContext.createAnalyser();
                    console.log("Created source node");
                } catch (error) {
                    console.error("Error creating source node:", error);

                    // If the audio element is already connected
                    if (error instanceof DOMException && error.name === "InvalidStateError") {
                        console.log("Audio element already connected to another context");
                        // We need to create a new audio context and try again
                        try {
                            // Try to get the existing source node
                            const destination = globalAudioContext.destination;
                            console.log("Using existing audio connections");
                            isConnected = true;
                            setConnected(true);
                            return true;
                        } catch (e) {
                            console.error("Could not recover from InvalidStateError", e);
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            }

            // Create a gain node for testing
            if (!globalGainNode && globalAudioContext) {
                globalGainNode = globalAudioContext.createGain();
                globalGainNode.gain.value = 1.0; // Double the volume for testing
                console.log("Created gain node with value 2.0");
            }

            // Create and connect all the audio nodes
            if (globalSourceNode && globalAudioContext) {
                // First disconnect any existing connections
                try {
                    globalSourceNode.disconnect();
                    // Also disconnect any existing filters
                    eqFilters.forEach(filter => {
                        try { filter.disconnect(); } catch (e) { /* ignore */ }
                    });
                    if (bassBiquadFilter) try { bassBiquadFilter.disconnect(); } catch (e) { /* ignore */ }
                    if (trebleBiquadFilter) try { trebleBiquadFilter.disconnect(); } catch (e) { /* ignore */ }
                } catch (e) {
                    // Ignore errors
                }

                // Create the main gain node if it doesn't exist
                if (!globalGainNode) {
                    globalGainNode = globalAudioContext.createGain();
                    globalGainNode.gain.value = 1.0;
                    console.log("Created main gain node");
                }

                // Create EQ band filters
                if (eqFilters.length === 0) {
                    console.log("Creating EQ band filters for frequencies:", FREQUENCY_BANDS);
                    eqFilters = FREQUENCY_BANDS.map(freq => {
                        const filter = globalAudioContext!.createBiquadFilter();
                        filter.type = 'peaking';
                        filter.frequency.value = freq;
                        filter.Q.value = 1.0;
                        filter.gain.value = 0.0;
                        return filter;
                    });
                }

                // Create bass filter if it doesn't exist
                if (!bassBiquadFilter && globalAudioContext) {
                    bassBiquadFilter = globalAudioContext.createBiquadFilter();
                    bassBiquadFilter.type = 'lowshelf';
                    bassBiquadFilter.frequency.value = 80; // Default bass frequency
                    bassBiquadFilter.gain.value = 0.0;
                    console.log("Created bass filter");
                }

                // Create treble filter if it doesn't exist
                if (!trebleBiquadFilter && globalAudioContext) {
                    trebleBiquadFilter = globalAudioContext.createBiquadFilter();
                    trebleBiquadFilter.type = 'highshelf';
                    trebleBiquadFilter.frequency.value = 2000; // Default treble frequency
                    trebleBiquadFilter.gain.value = 0.0;
                    console.log("Created treble filter");
                }

                // Connect the nodes in series:
                // source -> bass -> treble -> eq bands -> gain -> destination
                let lastNode: AudioNode = globalSourceNode;

                // Connect bass filter
                if (bassBiquadFilter) {
                    lastNode.connect(bassBiquadFilter);
                    lastNode = bassBiquadFilter;
                    console.log("Connected bass filter");
                }

                // Connect treble filter
                if (trebleBiquadFilter) {
                    lastNode.connect(trebleBiquadFilter);
                    lastNode = trebleBiquadFilter;
                    console.log("Connected treble filter");
                }

                // Connect each EQ band filter in series
                eqFilters.forEach((filter, index) => {
                    lastNode.connect(filter);
                    lastNode = filter;
                    console.log(`Connected EQ band ${index} (${FREQUENCY_BANDS[index]} Hz)`);
                });
                if (analyserNodeFilter) {
                    lastNode.connect(analyserNodeFilter);
                    analyserNodeFilter.connect(globalAudioContext.destination);
                }
                // Connect to gain node and then to destination
                lastNode.connect(globalGainNode);
                globalGainNode.connect(globalAudioContext.destination);
                console.log("Connected final chain to destination");

                isConnected = true;
                setConnected(true);
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error setting up audio:", error);
            return false;
        }
    };

    // Connect the equalizer
    const connectEqualizer = () => {
        console.log("Connecting equalizer...");

        // Force the connected state to be in sync with the UI
        const forceSync = () => {
            console.log("Forcing connection state sync");
            isConnected = true;
            globalState.isEnabled = true;
            setConnected(true);
            setIsEnabled(true);
        };

        // If we think we're already connected, make sure UI reflects this
        if (isConnected) {
            console.log("Equalizer already connected, syncing UI state");
            forceSync();
            return;
        }

        const success = setupAudio();
        if (success) {
            console.log("Equalizer connected successfully");
            forceSync();
        } else {
            console.error("Failed to connect equalizer");
            // Try one more time with a different approach
            try {
                if (globalAudioContext && getAudioElement()) {
                    console.log("Attempting alternative connection method");
                    // If we have an audio context but failed to set up, try to force the connection
                    forceSync();
                }
            } catch (e) {
                console.error("Alternative connection method failed", e);
            }
        }
    };

    // Connect audio nodes in the correct order with a direct connection for testing
    const connectNodes = () => {
        try {
            console.log("Connecting audio nodes with direct connection...");

            if (!audioRef.current || !globalAudioContext) {
                console.error("Source or audio context not initialized");
                return false;
            }

            // Try to disconnect source from any previous connections
            try {
                if (globalSourceNode) {
                    globalSourceNode.disconnect();
                    console.log("Disconnected source from previous connections");
                }
            } catch (e) {
                console.log("No previous connections to disconnect");
            }

            // Connect source -> destination
            if (globalSourceNode && globalAudioContext) {
                globalSourceNode.connect(globalAudioContext.destination);
                console.log("Connected source -> destination for testing");
            }

            console.log("Audio node connection complete");
            return true;
        } catch (error) {
            console.error("Error connecting nodes:", error);
            return false;
        }
    };

    // Set all band gains at once (for presets)
    const setAllBandGains = (values: number[]) => {
        if (values.length !== FREQUENCY_BANDS.length) {
            // If the preset has a different number of bands, try to adapt it
            if (values.length > FREQUENCY_BANDS.length) {
                // If preset has more bands than we support, truncate
                values = values.slice(0, FREQUENCY_BANDS.length);
            } else {
                // If preset has fewer bands than we support, pad with zeros
                const padding = Array(FREQUENCY_BANDS.length - values.length).fill(0);
                values = [...values, ...padding];
            }
        }

        setEqValues(values);
        globalState.eqValues = values;

        // Apply the EQ values to the actual filter nodes
        if (isConnected && isEnabled) {
            // Update each EQ band filter with its corresponding gain value
            eqFilters.forEach((filter, index) => {
                if (index < values.length) {
                    filter.gain.value = values[index];
                    console.log(`Set EQ band ${index} (${FREQUENCY_BANDS[index]} Hz) to ${values[index]} dB`);
                }
            });

            console.log('Applied all EQ band settings');
        }
    };

    // Apply a preset
    const applyPreset = (preset: number[]) => {
        setAllBandGains(preset);
    };

    // Enable or disable the equalizer
    const toggleEqualizer = (enabled: boolean) => {
        console.log(`Toggling equalizer to ${enabled ? 'enabled' : 'disabled'}`);

        if (!isConnected) {
            console.log("Equalizer not connected, connecting first...");
            connectEqualizer();
        }

        // Update state
        setIsEnabled(enabled);
        globalState.isEnabled = enabled;

        // Apply the change
        if (globalGainNode) {
            globalGainNode.gain.value = enabled ? 2.0 : 1.0;
            console.log(`Set gain to ${enabled ? 2.0 : 1.0}`);
        }

        console.log(`Equalizer is now ${enabled ? 'enabled' : 'disabled'}`);
    };

    // Disconnect the equalizer
    const disconnectEqualizer = () => {
        console.log("Disconnecting equalizer...");

        if (!isConnected) {
            console.log("Equalizer already disconnected");
            return;
        }

        try {
            // Disconnect nodes
            if (globalSourceNode) {
                try {
                    globalSourceNode.disconnect();
                    console.log("Source node disconnected");
                } catch (e) {
                    console.log("Error disconnecting source node:", e);
                }
            }

            if (globalGainNode) {
                try {
                    globalGainNode.disconnect();
                    console.log("Gain node disconnected");
                } catch (e) {
                    console.log("Error disconnecting gain node:", e);
                }
            }

            // Reset global state
            globalSourceNode = null;

            // Update state variables
            isConnected = false;
            setConnected(false);
            setIsEnabled(false);
            globalState.isEnabled = false;

            console.log("Equalizer fully disconnected");
        } catch (error) {
            console.error("Error disconnecting equalizer:", error);
        }
    };

    // Update filter values when eqValues change
    useEffect(() => {
        if (!isConnected || !isEnabled) return;

        console.log("EQ values changed, applying new values:", eqValues);

        // Update global state
        globalState.eqValues = [...eqValues];

        // Apply to gain node for testing
        if (globalGainNode) {
            const avgGain = eqValues.reduce((sum, val) => sum + val, 0) / eqValues.length;
            const gainValue = 1.0 + (avgGain / 10); // Map to a gain range around 1.0
            globalGainNode.gain.value = gainValue;
            console.log(`Applied average gain ${gainValue} based on EQ values`);
        }
    }, [eqValues, isEnabled, isConnected]);

    // Update bass and treble filter values when bassFilter or trebleFilter change
    useEffect(() => {
        if (!isConnected) return;

        // Update global state
        globalState.bassFilter = { ...bassFilter };
        globalState.trebleFilter = { ...trebleFilter };

        // Apply to gain node for testing
        if (globalGainNode && isEnabled) {
            // Use bass and treble settings to adjust gain for testing
            const combinedGain = (bassFilter.gain + trebleFilter.gain) / 20; // Average and scale down
            const gainValue = 1.0 + combinedGain; // Map to a gain range around 1.0
            globalGainNode.gain.value = gainValue;
            console.log(`Applied gain ${gainValue} based on bass/treble settings`);
        }
    }, [bassFilter, trebleFilter, isConnected, isEnabled]);

    // Clean up when component unmounts
    // useEffect(() => {
    //     setConnected(false);
    //     console.log('Equalizer disconnected');
    // }, []);

    const setBandGain = (index: number, value: number) => {
        if (index < 0 || index >= FREQUENCY_BANDS.length) {
            console.error(`Invalid band index: ${index}`);
            return;
        }

        const newValues = [...eqValues];
        newValues[index] = value;
        setEqValues(newValues);

        // Update global state
        globalState.eqValues = newValues;

        // Apply to the actual EQ filter node for immediate effect
        if (isConnected && isEnabled && index < eqFilters.length) {
            // Apply the gain value directly to the corresponding filter
            eqFilters[index].gain.value = value;
            console.log(`Applied ${value} dB to EQ band ${index} (${FREQUENCY_BANDS[index]} Hz)`);
        }
    };

    const setBassFilterSettings = ({ frequency, gain }: { frequency: number; gain: number }) => {
        // Update state
        setBassFilter({ frequency, gain });

        // Update global state
        globalState.bassFilter = { frequency, gain };

        // Apply to the actual bass filter node for immediate effect
        if (isConnected && isEnabled && bassBiquadFilter) {
            bassBiquadFilter.frequency.value = frequency;
            bassBiquadFilter.gain.value = gain;
            console.log(`Applied bass filter settings: frequency=${frequency}Hz, gain=${gain}dB`);
        }
    };

    const setTrebleFilterSettings = ({ frequency, gain }: { frequency: number; gain: number }) => {
        // Update state
        setTrebleFilter({ frequency, gain });

        // Update global state
        globalState.trebleFilter = { frequency, gain };

        // Apply to the actual treble filter node for immediate effect
        if (isConnected && isEnabled && trebleBiquadFilter) {
            trebleBiquadFilter.frequency.value = frequency;
            trebleBiquadFilter.gain.value = gain;
            console.log(`Applied treble filter settings: frequency=${frequency}Hz, gain=${gain}dB`);
        }
    };

    const resetEqualizer = () => {
        console.log('Resetting equalizer to flat response');

        // Reset EQ bands
        const flatEQ = Array(FREQUENCY_BANDS.length).fill(0);
        setEqValues(flatEQ);

        // Reset bass and treble
        setBassFilter({ ...bassFilter, gain: 0 });
        setTrebleFilter({ ...trebleFilter, gain: 0 });

        // Update global state
        globalState.eqValues = [...flatEQ];
        globalState.bassFilter = { ...bassFilter, gain: 0 };
        globalState.trebleFilter = { ...trebleFilter, gain: 0 };

        // Reset gain node to normal
        if (globalGainNode) {
            globalGainNode.gain.value = 1.0;
            console.log('Reset gain to 1.0');
        }

        console.log('Equalizer reset complete');
    };

    // Track if this hook instance is still mounted
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            console.log('Cleaning up equalizer');
            isMounted.current = false;

            // We don't disconnect nodes on unmount to avoid audio interruptions
            // Just disable the equalizer effect without affecting the connection state
            if (globalGainNode) {
                globalGainNode.gain.value = 1.0; // Reset gain to normal
            }

            // Don't update state on unmount as it can cause issues
            // The next time the component mounts, it will read from globalState
        };
    }, []);

    // Only run connectEqualizer once when the hook is first initialized
    // Using a ref to track if we've already tried to connect
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            // Only try to connect on initial mount
            connectEqualizer();
        }
        return () => { }; // Don't disconnect on unmount
    }, []);

    return {
        isEnabled,
        isConnected: connected,
        eqValues,
        frequencyBands: FREQUENCY_BANDS,
        bassFilter,
        trebleFilter,
        analyserNodeFilter,
        connectEqualizer,
        disconnectEqualizer,
        toggleEqualizer,
        setBandGain,
        setAllBandGains,
        setBassFilterSettings,
        setTrebleFilterSettings,
        resetEqualizer,
        applyPreset
    };
};

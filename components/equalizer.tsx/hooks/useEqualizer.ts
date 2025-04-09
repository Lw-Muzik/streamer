import { useEffect, useRef } from 'react';

export function useEqualizer(audioElement: HTMLAudioElement | null) {
    const audioContextRef = useRef<AudioContext | null>(null);
    const filtersRef = useRef<BiquadFilterNode[]>([]);

    useEffect(() => {
        if (!audioElement) return;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaElementSource(audioElement);

        const freqs = [60, 170, 350, 1000, 3500, 10000]; // 6-band example
        const filters = freqs.map(freq => {
            const filter = audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1;
            filter.gain.value = 0; // Default gain
            return filter;
        });

        filtersRef.current = filters;

        // Connect all filters in series
        source.connect(filters[0]);
        for (let i = 0; i < filters.length - 1; i++) {
            filters[i].connect(filters[i + 1]);
        }

        filters[filters.length - 1].connect(audioContext.destination);

        return () => {
            filters.forEach(f => f.disconnect());
            source.disconnect();
        };
    }, [audioElement]);

    return {
        setGain: (index: number, value: number) => {
            const filter = filtersRef.current[index];
            if (filter) filter.gain.value = value;
        },
        getAudioContext: () => audioContextRef.current,
    };
}

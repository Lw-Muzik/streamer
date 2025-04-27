"use client"
import React from "react";
import AppLayout from "@/components/Layout/AppLayout";
import { useEqualizer } from "@/hooks/useEqualizer";
import Link from "next/link";

const Page = () => {
    const { analyserNodeFilter } = useEqualizer();
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const animationRef = React.useRef<number | null>(null);
    // add title
    React.useEffect(() => {
        document.title = "Visualizer | Ethereal Tunes";
    }, []);
    // function to create visualizer
    const createVisualizer = () => {
        if (analyserNodeFilter && canvasRef.current) {
            const canvas = canvasRef.current;
            const canvasCtx = canvas.getContext("2d");
            if (canvasCtx) {
                // Clear the canvas
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

                const width = canvas.width;
                const height = canvas.height;
                const bufferLength = analyserNodeFilter.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                // Get frequency data
                analyserNodeFilter.getByteFrequencyData(dataArray);

                const barWidth = (width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                // Draw frequency bars
                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] / 2;
                    // Create a gradient color based on frequency
                    canvasCtx.fillStyle = `rgb(${Math.min(255, barHeight + 100)}, ${Math.min(255, barHeight * 2)}, ${Math.min(255, 255 - barHeight)})`;
                    canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }

                // Continue the animation loop
                animationRef.current = window.requestAnimationFrame(createVisualizer);
            }
        }
    }

    // Initialize visualizer when analyserNodeFilter is available
    React.useEffect(() => {
        if (analyserNodeFilter && canvasRef.current) {
            // Set initial canvas dimensions
            const canvas = canvasRef.current;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight; // Fixed height for better visualization

            // Start the animation loop
            animationRef.current = window.requestAnimationFrame(createVisualizer);

            // Cleanup function
            return () => {
                if (animationRef.current) {
                    window.cancelAnimationFrame(animationRef.current);
                }
            };
        }
    }, [analyserNodeFilter]);

    // Handle window resize
    React.useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                // Keep height fixed for better visualization
                canvasRef.current.height = 400;
            }
        }

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        }
    }, []);

    // Handle cleanup on unmount
    React.useEffect(() => {
        return () => {
            // Cancel any ongoing animation
            if (animationRef.current) {
                window.cancelAnimationFrame(animationRef.current);
            }

            // Disconnect analyser node if it exists
            if (analyserNodeFilter) {
                try {
                    analyserNodeFilter.disconnect();
                } catch (error) {
                    console.error("Error disconnecting analyser node:", error);
                }
            }
        }
    }, [analyserNodeFilter])
    return (
        <AppLayout>
            <div className="h-full w-full">

                <div className="flex items-center mb-8">
                    <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
                        <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span className="text-lg font-medium">Back to Player</span>
                    </Link>
                </div>
                <h1>Visualizer</h1>
                {analyserNodeFilter && (
                    <>
                        <canvas
                            id="visualizer"
                            ref={canvasRef}
                            className="w-full h-[400px] bg-black/20 rounded-lg shadow-lg"
                        ></canvas>
                    </>
                )}
            </div>

        </AppLayout>
    )
}
export default Page;
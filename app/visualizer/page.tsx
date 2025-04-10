"use client"
import React from "react";
import AppLayout from "@/components/Layout/AppLayout";
import { useEqualizer } from "@/hooks/useEqualizer";
import Link from "next/link";

const Page = () => {
    const { analyserNodeFilter } = useEqualizer();
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    // function to create visualizer
    const createVisualizer = () => {
        if (analyserNodeFilter && canvasRef.current) {
            const canvas = canvasRef.current;
            const canvasCtx = canvas.getContext("2d");
            if (canvasCtx) {
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                const width = canvas.width;
                const height = canvas.height;
                const bufferLength = analyserNodeFilter.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyserNodeFilter.getByteFrequencyData(dataArray);
                const barWidth = (width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] / 2;
                    canvasCtx.fillStyle = `rgb(${barHeight}, ${barHeight}, ${barHeight})`;
                    canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            }
        }
    }
    React.useEffect(() => {
        if (analyserNodeFilter) {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            // create the visualizer
            window.requestAnimationFrame(createVisualizer);
        }
    }, [analyserNodeFilter]);
    // function to handle window resize
    React.useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                createVisualizer();
            }
        }
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        }
    }, []);
    // handle cleaning on unmount
    React.useEffect(() => {
        return () => {
            if (analyserNodeFilter) {
                analyserNodeFilter.disconnect();
            }
        }
    })
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
                        <canvas height={50} id="visualizer" ref={canvasRef}></canvas>
                    </>
                )}
            </div>

        </AppLayout>
    )
}
export default Page;
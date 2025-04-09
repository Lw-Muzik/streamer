"use client"
import AppLayout from "@/components/Layout/AppLayout";

const Page = () => {
    return (
        <AppLayout>
            <h1>Visualizer</h1>
            <canvas width={100} height={200}></canvas>
        </AppLayout>
    )
}
export default Page;
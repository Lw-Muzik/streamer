"use client"
import React from "react";
import AppLayout from "@/components/Layout/AppLayout";
import Link from "next/link";
import { useTheme } from "@/providers/ThemeProvider";

const SettingsPage = () => {
    // Use the theme context instead of local state
    const { theme, colorTheme, setTheme, setColorTheme } = useTheme();

    // Handle theme change
    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
    };

    // Handle color theme change
    const handleColorThemeChange = (newColorTheme: string) => {
        setColorTheme(newColorTheme);
    };

    return (
        <AppLayout>
            <div className="h-full w-full p-6">
                <div className="flex items-center mb-8">
                    <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
                        <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span className="text-lg font-medium">Back to Player</span>
                    </Link>
                </div>

                <div className="max-w-2xl mx-auto bg-[#181818] p-6 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold mb-6 text-white">Settings</h1>

                    {/* Theme Selection */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-white">Display Mode</h2>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => handleThemeChange("dark")}
                                className={`px-4 py-2 rounded-md transition-colors ${theme === "dark"
                                        ? "bg-[#1DB954] text-white"
                                        : "bg-[#333333] text-gray-200 hover:bg-[#444444]"
                                    }`}
                            >
                                Dark Mode
                            </button>
                            <button
                                onClick={() => handleThemeChange("light")}
                                className={`px-4 py-2 rounded-md transition-colors ${theme === "light"
                                        ? "bg-[#1DB954] text-white"
                                        : "bg-[#333333] text-gray-200 hover:bg-[#444444]"
                                    }`}
                            >
                                Light Mode
                            </button>
                        </div>
                    </div>

                    {/* Color Theme Selection */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-white">Color Theme</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => handleColorThemeChange("green")}
                                className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "green"
                                        ? "ring-2 ring-white"
                                        : ""
                                    }`}
                                style={{ backgroundColor: "#1DB954" }}
                            >
                                <span className="text-white font-medium">Green</span>
                            </button>
                            <button
                                onClick={() => handleColorThemeChange("blue")}
                                className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "blue"
                                        ? "ring-2 ring-white"
                                        : ""
                                    }`}
                                style={{ backgroundColor: "#1E88E5" }}
                            >
                                <span className="text-white font-medium">Blue</span>
                            </button>
                            <button
                                onClick={() => handleColorThemeChange("purple")}
                                className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "purple"
                                        ? "ring-2 ring-white"
                                        : ""
                                    }`}
                                style={{ backgroundColor: "#9C27B0" }}
                            >
                                <span className="text-white font-medium">Purple</span>
                            </button>
                            <button
                                onClick={() => handleColorThemeChange("red")}
                                className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "red"
                                        ? "ring-2 ring-white"
                                        : ""
                                    }`}
                                style={{ backgroundColor: "#E53935" }}
                            >
                                <span className="text-white font-medium">Red</span>
                            </button>
                            <button
                                onClick={() => handleColorThemeChange("orange")}
                                className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "orange"
                                        ? "ring-2 ring-white"
                                        : ""
                                    }`}
                                style={{ backgroundColor: "#FF9800" }}
                            >
                                <span className="text-white font-medium">Orange</span>
                            </button>
                            <button
                                onClick={() => handleColorThemeChange("pink")}
                                className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "pink"
                                        ? "ring-2 ring-white"
                                        : ""
                                    }`}
                                style={{ backgroundColor: "#E91E63" }}
                            >
                                <span className="text-white font-medium">Pink</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default SettingsPage;

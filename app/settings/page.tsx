"use client"
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/Layout/AppLayout";
import Link from "next/link";
import { useTheme } from "@/providers/ThemeProvider";
import { useSession, signOut } from "next-auth/react";
import { User, Lock, LogOut, Settings } from "lucide-react";

const SettingsPage = () => {
    const { theme, colorTheme, setTheme, setColorTheme } = useTheme();
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState("general");
    const [name, setName] = useState(session?.user?.name || "");
    const [email, setEmail] = useState(session?.user?.email || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Update document title based on active tab
    useEffect(() => {
        document.title = `Settings - ${activeTab === "general" ? "General" : "Account"} | Ethereal Tunes`;
    }, [activeTab]);

    // Handle theme change
    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
    };

    // Handle color theme change
    const handleColorThemeChange = (newColorTheme: string) => {
        setColorTheme(newColorTheme);
    };

    // Handle profile update
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email }),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            setSuccess("Profile updated successfully");
            setIsEditing(false);
        } catch (err) {
            setError("Failed to update profile");
        }
    };

    // Handle password change
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const response = await fetch("/api/user/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to change password");
            }

            setSuccess("Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError("Failed to change password");
        }
    };

    return (
        <AppLayout>
            <div className="h-screen flex flex-col">
                <div className="flex-shrink-0 p-4">
                    <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
                        <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span className="text-lg font-medium">Back to Player</span>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                    <div className="max-w-2xl mx-auto bg-[#181818] p-6 rounded-lg shadow-sm">
                        <h1 className="text-2xl font-bold mb-6 text-white">Settings</h1>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-700 mb-6 sticky top-0 bg-[#181818] z-10">
                            <button
                                onClick={() => setActiveTab("general")}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === "general"
                                    ? "text-white border-b-2 border-[#1DB954]"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center">
                                    <Settings className="w-4 h-4 mr-2" />
                                    General
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("account")}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === "account"
                                    ? "text-white border-b-2 border-[#1DB954]"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    Account
                                </div>
                            </button>
                        </div>

                        {/* General Settings Tab */}
                        {activeTab === "general" && (
                            <div className="space-y-8">
                                {/* Theme Selection */}
                                <div>
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
                                            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "green" ? "ring-2 ring-white" : ""
                                                }`}
                                            style={{ backgroundColor: "#1DB954" }}
                                        >
                                            <span className="text-white font-medium">Green</span>
                                        </button>
                                        <button
                                            onClick={() => handleColorThemeChange("blue")}
                                            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "blue" ? "ring-2 ring-white" : ""
                                                }`}
                                            style={{ backgroundColor: "#1E88E5" }}
                                        >
                                            <span className="text-white font-medium">Blue</span>
                                        </button>
                                        <button
                                            onClick={() => handleColorThemeChange("purple")}
                                            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "purple" ? "ring-2 ring-white" : ""
                                                }`}
                                            style={{ backgroundColor: "#9C27B0" }}
                                        >
                                            <span className="text-white font-medium">Purple</span>
                                        </button>
                                        <button
                                            onClick={() => handleColorThemeChange("red")}
                                            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "red" ? "ring-2 ring-white" : ""
                                                }`}
                                            style={{ backgroundColor: "#E53935" }}
                                        >
                                            <span className="text-white font-medium">Red</span>
                                        </button>
                                        <button
                                            onClick={() => handleColorThemeChange("orange")}
                                            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "orange" ? "ring-2 ring-white" : ""
                                                }`}
                                            style={{ backgroundColor: "#FF9800" }}
                                        >
                                            <span className="text-white font-medium">Orange</span>
                                        </button>
                                        <button
                                            onClick={() => handleColorThemeChange("pink")}
                                            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${colorTheme === "pink" ? "ring-2 ring-white" : ""
                                                }`}
                                            style={{ backgroundColor: "#E91E63" }}
                                        >
                                            <span className="text-white font-medium">Pink</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Settings Tab */}
                        {activeTab === "account" && (
                            <div className="space-y-4">
                                {/* Profile Information */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="text-[#1DB954] hover:text-[#1ed760] transition-colors"
                                        >
                                            {isEditing ? "Cancel" : "Edit"}
                                        </button>
                                    </div>
                                    {error && <p className="text-red-500 mb-4">{error}</p>}
                                    {success && <p className="text-green-500 mb-4">{success}</p>}
                                    <form onSubmit={handleProfileUpdate}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 bg-[#333333] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#1DB954] disabled:opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 bg-[#333333] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#1DB954] disabled:opacity-50"
                                                />
                                            </div>
                                            {isEditing && (
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-[#1DB954] text-white rounded-md hover:bg-[#1ed760] transition-colors"
                                                >
                                                    Save Changes
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>

                                {/* Change Password */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4 text-white">Change Password</h2>
                                    <form onSubmit={handlePasswordChange}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full px-3 py-2 bg-[#333333] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-3 py-2 bg-[#333333] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-3 py-2 bg-[#333333] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-[#1DB954] text-white rounded-md hover:bg-[#1ed760] transition-colors"
                                            >
                                                Change Password
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Active Sessions */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4 text-white">Active Sessions</h2>
                                    <div className="bg-[#333333] p-4 rounded-md">
                                        <p className="text-gray-300">
                                            You are currently signed in on this device.
                                        </p>
                                    </div>
                                </div>

                                {/* Sign Out */}
                                <div className="mt-8">
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors rounded-md"
                                    >
                                        <LogOut className="w-5 h-5 mr-2" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default SettingsPage;

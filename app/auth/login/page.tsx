"use client"
// pages/login.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Music, Moon, Sun, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GoogleAuthButton from '@/components/ui/GoogleAuthButton';


interface FormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

export default function Page() {
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        rememberMe: false,
    });

    const { data: session, status } = useSession();
    const router = useRouter();

    // If there's an error from NextAuth, show it


    // Redirect if already authenticated
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    // Initialize theme based on user preference
    useEffect(() => {
        // Check system preference or saved preference
        const isDarkMode = localStorage.getItem('darkMode') === 'true' ||
            window.matchMedia('(prefers-color-scheme: dark)').matches;

        setDarkMode(isDarkMode);

        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    // Toggle theme function
    const toggleTheme = () => {
        setDarkMode(!darkMode);
        if (darkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            setError(null);

            // Call the NextAuth sign in function
            const result = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
                callbackUrl: '/',
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else if (result?.url) {
                router.push(result.url);
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            console.error("Login error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* <head>
                <title>Login | Music App</title>
                <meta name="description" content="Login to your Music App account" />
                <link rel="icon" href="/favicon.ico" />
            </head> */}

            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-md hover:shadow-lg transition-all duration-300"
                aria-label="Toggle theme"
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    {/* Logo and Header */}
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-600 text-white">
                            <Music size={30} />
                        </div>
                        <h1 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                            Welcome back
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Sign in to continue to your music experience
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors duration-300">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-300"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-300"
                                        placeholder="••••••••"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Remember me and Forgot password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="rememberMe"
                                        type="checkbox"
                                        checked={formData.rememberMe}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                                        Forgot your password?
                                    </Link>
                                </div>
                            </div>

                            {/* Sign in button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : null}
                                    Sign in
                                </button>
                            </div>
                        </form>

                        {/* Divider */}
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            {/* Google login button */}
                            <div className="mt-6">
                                <GoogleAuthButton mode="signin" />
                            </div>
                        </div>
                    </div>

                    {/* Sign up link */}
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                                Sign up now
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>© {new Date().getFullYear()} Music App. All rights reserved.</p>
            </footer>
        </div>
    );
}
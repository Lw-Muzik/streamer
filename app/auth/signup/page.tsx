'use client';
import { useState, useEffect } from 'react';
import { Music, Moon, Sun, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}

export default function SignUp() {
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
    });

    const { data: session, status } = useSession();
    const router = useRouter();



    // Initialize theme based on user preference
    useEffect(() => {
        document.title = "Sign Up | Ethereal Tunes";
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

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (!formData.agreeToTerms) {
            setError("You must agree to the terms and conditions");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const responseText = await response.text();
            console.log('Raw API response:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('Failed to parse JSON:', jsonError);
                throw new Error('Invalid server response. Please try again later.');
            }

            if (!response.ok) {
                throw new Error(data.message || `Failed to create account (Status: ${response.status})`);
            }

            const signInResult = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (signInResult?.error) {
                setError("Account created successfully, but automatic sign-in failed. Please sign in manually.");
            } else {
                router.push('/auth/login');
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
            console.error("Signup error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <button
                onClick={toggleTheme}
                className="fixed top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-md hover:shadow-lg transition-all duration-300 z-10"
                aria-label="Toggle theme"
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-600 text-white">
                            <Music size={30} />
                        </div>
                        <h1 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                            Create your account
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Join our music community today
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Full Name
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="appearance-none block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Confirm Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="appearance-none block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:placeholder-gray-400 placeholder:text-black dark:placeholder:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 text-black dark:text-white sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="agreeToTerms"
                                    name="agreeToTerms"
                                    type="checkbox"
                                    checked={formData.agreeToTerms}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
                                        Terms
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating account...
                                    </span>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </div>
                    </form>

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

                        <div className="mt-6">
                            {/* Replace with your GoogleSignInButton implementation */}
                            <button className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                Sign up with Google
                            </button>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="font  text-indigo-600 hover:text-indigo-500">
                            Sign in
                        </Link>
                    </p>
                </div>
            </main>

            <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} Music App. All rights reserved.
            </footer>
        </div>
    );
}
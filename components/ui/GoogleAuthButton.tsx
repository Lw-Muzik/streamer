// components/GoogleAuthButton.tsx
import { signIn } from "next-auth/react";
import { useState } from "react";

interface GoogleAuthButtonProps {
    mode: "signin" | "signup";
    className?: string;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
    mode,
    className = ""
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signIn("google", {
                callbackUrl: mode === "signup" ? '/welcome' : '/'
            });
        } catch (error) {
            console.error("Google sign in error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            type="button"
            className={`w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300 ${className}`}
        >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <>
                    <svg className="h-5 w-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                    {mode === "signin" ? "Sign in with Google" : "Sign up with Google"}
                </>
            )}
        </button>
    );
};

export default GoogleAuthButton;
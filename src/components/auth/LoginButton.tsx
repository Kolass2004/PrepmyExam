"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginButtonProps {
    className?: string;
}

export function LoginButton({ className }: LoginButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogin}
            disabled={isLoading}
            className={cn(
                "group relative flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-lg font-medium text-slate-900 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 disabled:opacity-70",
                className
            )}
        >
            {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <>
                    <img
                        src="https://www.google.com/favicon.ico"
                        alt="Google"
                        className="h-6 w-6"
                    />
                    <span>Continue with Google</span>
                </>
            )}
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary via-primary/80 to-accent opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-50" />
        </button>
    );
}

"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="w-10 h-10" /> // Placeholder
    }

    const toggleTheme = async () => {
        const newTheme = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(newTheme);

        try {
            const { auth } = await import("@/lib/firebase/client");

            if (auth.currentUser) {
                await fetch('/api/user/preferences', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: auth.currentUser.uid,
                        preferences: { theme: newTheme }
                    })
                });
            }
        } catch (error) {
            console.error("Failed to save theme preference:", error);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-secondary/80 transition-colors"
            title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {resolvedTheme === "dark" ? (
                <Sun className="w-6 h-6 text-primary fill-current transition-all" />
            ) : (
                <Moon className="w-6 h-6 text-primary fill-current transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}

"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-slate-400 hover:text-foreground transition-colors"
            title="Toggle Theme"
        >
            <div className="relative w-6 h-6">
                <Sun className="absolute w-6 h-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute w-6 h-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}

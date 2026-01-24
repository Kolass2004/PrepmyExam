"use client"

import * as React from "react"
import { Palette, Check } from "lucide-react"
import { useTheme } from "next-themes"

const THEME_COLORS = [
    { name: "Violet", hue: "262", color: "bg-violet-500" },
    { name: "Blue", hue: "217", color: "bg-blue-500" },
    { name: "Emerald", hue: "142", color: "bg-emerald-500" },
    { name: "Amber", hue: "38", color: "bg-amber-500" },
    { name: "Rose", hue: "340", color: "bg-rose-500" },
    { name: "Slate", hue: "215", color: "bg-slate-500" },
]

export function ColorPicker() {
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    // Close when clicking outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const setAppColor = (hue: string) => {
        document.documentElement.style.setProperty('--base-hue', hue)
        // Optional: save to local storage so it persists
        localStorage.setItem('bankexam-theme-hue-v2', hue)
        setIsOpen(false)
    }

    // Restore color on mount
    React.useEffect(() => {
        const savedHue = localStorage.getItem('bankexam-theme-hue-v2')
        if (savedHue) {
            document.documentElement.style.setProperty('--base-hue', savedHue)
        }
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors duration-300"
                title="Change App Color"
            >
                <Palette className="w-6 h-6" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 p-2 bg-popover border border-border rounded-2xl shadow-xl flex gap-1 z-50 animate-in fade-in slide-in-from-top-2">
                    {THEME_COLORS.map((theme) => (
                        <button
                            key={theme.name}
                            onClick={() => setAppColor(theme.hue)}
                            className={`w-8 h-8 rounded-full ${theme.color} hover:scale-110 transition-transform flex items-center justify-center ring-2 ring-transparent hover:ring-offset-2 hover:ring-offset-popover hover:ring-primary/50`}
                            title={theme.name}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Languages, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const languagesList = [
        { code: "en", label: "English" },
        { code: "ta", label: "Tamil (தமிழ்)" },
        { code: "ml", label: "Malayalam (മലയാളം)" },
        { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
        { code: "te", label: "Telugu (తెలుగు)" },
        { code: "hi", label: "Hindi (हिन्दी)" },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-muted-foreground hover:text-primary bg-muted rounded-full transition-colors duration-300"
                title="Change Language"
            >
                <Languages className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-[100] animate-in zoom-in-95 duration-200">
                    <div className="py-1">
                        {languagesList.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code as any);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full px-4 py-2.5 text-sm flex items-center justify-between hover:bg-muted transition-colors text-left",
                                    language === lang.code ? "text-primary font-medium bg-primary/5" : "text-foreground"
                                )}
                            >
                                {lang.label}
                                {language === lang.code && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

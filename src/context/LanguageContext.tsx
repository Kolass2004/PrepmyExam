"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "@/language/en.json";
import ta from "@/language/ta.json";
import ml from "@/language/ml.json";
import kn from "@/language/kn.json";
import te from "@/language/te.json";
import hi from "@/language/hi.json";

type Language = "en" | "ta" | "ml" | "kn" | "te" | "hi";
type Translations = typeof en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const languages: Record<Language, Translations> = {
    en, ta, ml, kn, te, hi
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem("app-language") as Language;
        if (savedLang && languages[savedLang]) {
            setLanguage(savedLang);
        }
        setMounted(true);
    }, []);

    // We need access to auth to save preferences, but we can't use useAuth here easily because 
    // AuthProvider might be inside or outside. Actually AuthProvider is inside LanguageProvider in Layout? 
    // Wait, in layout.tsx:
    // <LanguageProvider>
    //   <AuthProvider>
    // So LanguageContext CANNOT use useAuth because it wraps it.
    // We need to pass the user or handle persistence elsewhere.
    // OR: We can use the firestore SDK directly and check auth.currentUser.

    // Better approach: Let's stick to the plan but realize the dependency. 
    // If LanguageProvider wraps AuthProvider, useLanguage logic runs "above" auth.
    // However, we can just use `auth.currentUser` from firebase/auth direct import which works client side.

    const handleSetLanguage = React.useCallback(async (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("app-language", lang);

        try {
            const { auth } = await import("@/lib/firebase/client");

            if (auth.currentUser) {
                await fetch('/api/user/preferences', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: auth.currentUser.uid,
                        preferences: { language: lang }
                    })
                });
            }
        } catch (error) {
            console.error("Failed to save language preference:", error);
        }
    }, []);

    const t = React.useCallback((key: keyof Translations) => {
        return languages[language][key] || languages["en"][key] || key;
    }, [language]);

    const value = React.useMemo(() => ({
        language,
        setLanguage: handleSetLanguage,
        t
    }), [language, handleSetLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

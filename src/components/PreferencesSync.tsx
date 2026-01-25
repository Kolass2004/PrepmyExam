"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";

export function PreferencesSync() {
    const { user } = useAuth();
    const { setLanguage } = useLanguage();
    const { setTheme } = useTheme();

    useEffect(() => {
        if (!user) return;

        async function syncPreferences() {
            try {
                const res = await fetch(`/api/user/preferences?uid=${user?.uid}`);
                if (res.ok) {
                    const data = await res.json();
                    const prefs = data.preferences;

                    if (prefs) {
                        // 1. Sync Language
                        if (prefs.language) {
                            setLanguage(prefs.language);
                        }

                        // 2. Sync Theme
                        if (prefs.theme) {
                            setTheme(prefs.theme);
                        }

                        // 3. Sync Hue (Color Scheme)
                        if (prefs.hue) {
                            document.documentElement.style.setProperty('--base-hue', prefs.hue);
                            localStorage.setItem('bankexam-theme-hue-v2', prefs.hue);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to sync preferences:", error);
            }
        }

        syncPreferences();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    return null; // This component doesn't render anything
}

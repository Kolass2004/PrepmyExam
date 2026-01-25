"use client";

import { useState, useRef, useEffect } from "react";
import { User } from "firebase/auth";
import { LogOut, User as UserIcon, Settings, Github, ChevronDown, ExternalLink, Shield, Scale } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useLanguage } from "@/context/LanguageContext";

interface UserMenuProps {
    user: User;
    onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Animation
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            gsap.fromTo(dropdownRef.current,
                { opacity: 0, y: -10, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" }
            );
        }
    }, [isOpen]);

    const getInitials = (name: string | null) => {
        return name ? name.slice(0, 2).toUpperCase() : "U";
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 pl-3 pr-2 rounded-full bg-card hover:bg-secondary border border-border/50 transition-all group"
            >
                <div className="flex flex-col items-end mr-1 hidden sm:flex">
                    <span className="text-sm font-semibold text-foreground leading-none">{user.displayName?.split(' ')[0]}</span>
                    <span className="text-[10px] text-muted-foreground">Student</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 overflow-hidden">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        getInitials(user.displayName)
                    )}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/50 rounded-2xl shadow-xl py-2 z-50 origin-top-right overflow-hidden backdrop-blur-sm"
                >
                    <div className="px-4 py-3 border-b border-border/50 mb-1">
                        <p className="text-sm font-bold text-foreground truncate">{user.displayName || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <div className="p-1 space-y-0.5">
                        <Link
                            href={`/user/${user.uid}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <UserIcon className="w-4 h-4" /> {t('menu_profile')}
                        </Link>
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Settings className="w-4 h-4" /> {t('menu_settings')}
                        </Link>
                        <a
                            href="https://github.com/Kolass2004/Examprep"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Github className="w-4 h-4" /> {t('menu_opensource')} <ExternalLink className="w-3 h-3 opacity-50 ml-auto" />
                        </a>
                    </div>

                    <div className="border-t border-border/50 mt-1 p-1 space-y-0.5">
                        <Link
                            href="/privacy"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Shield className="w-4 h-4" /> {t('menu_privacy')}
                        </Link>
                        <Link
                            href="/terms"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Scale className="w-4 h-4" /> {t('menu_terms')}
                        </Link>
                    </div>

                    <div className="border-t border-border/50 mt-1 p-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onLogout();
                                
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                        >
                            <LogOut className="w-4 h-4" /> {t('menu_logout')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

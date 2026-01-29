"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Users, Settings, LogOut, Sun, Moon, Calendar, Clock, ToggleLeft, ToggleRight, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Restrict access
    useEffect(() => {
        if (!loading && !user && pathname !== "/admin/login") {
            router.push("/admin/login");
        }
    }, [user, loading, pathname, router]);

    // Update time
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Force Violet Theme - Persistent enforcement
    useEffect(() => {
        const enforceTheme = () => {
            document.documentElement.style.setProperty("--base-hue", "270"); // Violet
        };
        enforceTheme();
        const observer = new MutationObserver(enforceTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
        return () => observer.disconnect();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/admin/login");
    };

    if (loading) return null; // Or a loader

    if (!user && pathname !== "/admin/login") return null;

    if (pathname === "/admin/login") return <>{children}</>;

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: "Users", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
        { name: "Question Banks", href: "/admin/question-banks", icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: "Settings", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex font-sans">
            {/* Sidebar */}
            <aside className="w-72 hidden md:flex flex-col p-4 fixed h-full z-50">
                <div className="h-full bg-card rounded-[2rem] border border-border/50 shadow-sm flex flex-col p-6">
                    <div className="flex items-center gap-4 mb-10 text-primary px-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <img src="/prepmyexam.svg" alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl leading-none">Admin</h2>
                            <span className="text-xs text-muted-foreground font-medium tracking-wide">CONSOLE</span>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
                                            : "hover:bg-secondary text-muted-foreground hover:text-foreground hover:translate-x-1"
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-border/50 space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50">
                            <div className="flex flex-col">
                                <div className="text-sm font-bold">{format(currentTime, "HH:mm")}</div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{format(currentTime, "MMM d")}</div>
                            </div>
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-background hover:scale-110 transition-transform shadow-sm"
                            >
                                {theme === "dark" ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                            </button>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all w-full"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 p-6 md:p-10 overflow-auto">
                <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </main>
        </div>
    );
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}

"use client";

import { Wrench, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-primary/20">

            {/* Ambient Background */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl ring-1 ring-white/5">

                    {/* Header: Logo & Icon */}
                    <div className="flex flex-col items-center mb-8 gap-6">
                        <div className="flex items-center gap-2 p-4 ">
                            <img src="/prepmyexam.svg" alt="PrepmyExam Logo" className="w-12 h-12 object-contain" />
                            <h1 className="text-2xl font-bold">PrepmyExam</h1>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-5 rounded-full border border-primary/20 relative">
                                <Wrench className="w-8 h-8 text-primary" />
                            </div>

                            {/* Animated Pulse Ring */}
                            <div className="absolute inset-0 border border-primary/20 rounded-full animate-ping opacity-20" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center space-y-4 mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                            System Maintenance
                        </h1>
                        <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
                            We're performing some scheduled upgrades to make your experience even better.
                        </p>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-500 px-4 py-2 rounded-full text-sm font-medium border border-amber-500/20">
                            <Clock className="w-4 h-4" />
                            <span>back in ~30 mins</span>
                        </div>
                    </div>

                    {/* Footer / Decorative Line */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

                    <p className="text-center text-xs text-muted-foreground font-medium opacity-60">
                        &copy; {new Date().getFullYear()} PrepmyExam. All rights reserved.
                    </p>
                </div>

                {/* Secret Admin Link */}
                <div className="mt-8 text-center">
                    <Link href="/admin" className="text-xs text-muted-foreground/30 hover:text-primary transition-colors pointer-events-auto">
                        Admin Access
                    </Link>
                </div>
            </div>
        </div>
    );
}

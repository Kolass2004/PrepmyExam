"use client";

import { LoginButton } from "@/components/auth/LoginButton";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function LoginPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(titleRef.current, {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: "power4.out",
            });

            gsap.from(".login-card", {
                y: 30,
                opacity: 0,
                duration: 0.8,
                delay: 0.3,
                ease: "power3.out",
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 transition-colors duration-500"
        >
            {/* Background Gradients */}
            <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-primary/20 blur-[100px]" />
            <div className="absolute -right-20 bottom-20 h-96 w-96 rounded-full bg-accent/20 blur-[100px]" />

            <main className="z-10 flex w-full max-w-lg flex-col items-center text-center">
                <h1
                    ref={titleRef}
                    className="mb-12 text-6xl font-bold tracking-tight text-foreground"
                >
                    Bank Exam
                    <br />
                    <span className="text-4xl text-primary font-extrabold">Preparation</span>
                </h1>

                <div className="login-card w-full rounded-[2.5rem] border border-white/10 bg-card/80 p-12 backdrop-blur-2xl shadow-2xl elevation-2">
                    <p className="mb-8 text-lg text-muted-foreground">
                        Sign in to access your dashboard, upload exams, and track your progress.
                    </p>
                    <LoginButton className="w-full" />
                </div>
            </main>
        </div>
    );
}

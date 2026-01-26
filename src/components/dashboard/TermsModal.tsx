"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

interface TermsModalProps {
    isOpen: boolean;
    onAccept: () => void;
}

export function TermsModal({ isOpen, onAccept }: TermsModalProps) {
    const [isAccepting, setIsAccepting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            gsap.fromTo(".terms-modal-content",
                { opacity: 0, scale: 0.95, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power3.out" }
            );
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    const handleAccept = async () => {
        setIsAccepting(true);
        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 600));
        onAccept();
        setIsAccepting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <div className="terms-modal-content w-full max-w-lg bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden relative">
                {/* Decorative background elements */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
                <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />

                <div className="p-8 md:p-10">
                    <div className="flex justify-center mb-6">
                        <img src="/prepmyexam.svg" alt="Logo" className="w-16 h-16 object-contain" />
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Welcome to PrepmyExam</h2>
                    <p className="text-muted-foreground text-center mb-8">
                        To continue using our platform, please review and accept our policies to ensure a safe learning environment.
                    </p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl">
                            <div className="mt-1 p-1 bg-primary/20 rounded-full">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold block mb-1">Privacy Policy</span>
                                <span className="text-muted-foreground">
                                    We respect your data. Read how we collect, use, and protect your personal information in our <Link href="/privacy" target="_blank" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl">
                            <div className="mt-1 p-1 bg-primary/20 rounded-full">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold block mb-1">Terms of Service</span>
                                <span className="text-muted-foreground">
                                    Review the rules and guidelines that govern the use of our platform in our <Link href="/terms" target="_blank" className="text-primary hover:underline font-medium">Terms of Service</Link>.
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleAccept}
                        disabled={isAccepting}
                        className={cn(
                            "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
                            isAccepting
                                ? "bg-primary/70 text-primary-foreground cursor-wait"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        {isAccepting ? (
                            "Accepting..."
                        ) : (
                            <>
                                I Accept & Continue <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                        By clicking "I Accept & Continue", you acknowledge that you have read and agreed to our Terms and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}

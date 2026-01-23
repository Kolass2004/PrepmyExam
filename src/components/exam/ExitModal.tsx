"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { LogOut, X } from "lucide-react";

interface ExitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function ExitModal({ isOpen, onClose, onConfirm }: ExitModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            const ctx = gsap.context(() => {
                gsap.fromTo(overlayRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3 }
                );
                gsap.fromTo(modalRef.current,
                    { y: 20, opacity: 0, scale: 0.95 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
                );
            });
            return () => ctx.revert();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                ref={modalRef}
                className="relative w-full max-w-md bg-card border-0 rounded-[2rem] p-8 shadow-2xl elevation-3"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                        <LogOut className="w-10 h-10 text-destructive" />
                    </div>

                    <h3 className="text-2xl font-bold text-foreground mb-2">Exit Exam?</h3>
                    <p className="text-muted-foreground mb-8 text-lg">
                        You haven't answered any questions yet. Progress will not be saved.
                    </p>

                    <div className="flex w-full gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 text-foreground font-medium hover:bg-secondary rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium rounded-xl transition-all shadow-lg hover:shadow-xl"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
